#!/usr/bin/env node
/**
 * DS-160 Form Auto-Fill Script
 * 
 * Usage: node fill-ds160.js --tramite-id=<id> [--dry-run] [--section=personal]
 * 
 * This script uses Steel Cloud to automatically fill the DS-160 form
 * on ceac.state.gov/GenNIV using saved applicant data.
 * 
 * IMPORTANT: 
 * - This is a complex form with many pages and validations
 * - The script saves progress and can resume from where it left off
 * - Screenshots are taken at each step for verification
 * - Review all data before final submission (script does NOT submit)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const STORAGE_PATH = path.join(__dirname, '..', 'storage', 'tramites');
const DS160_PATH = path.join(__dirname, '..', 'storage', 'ds160');
const SCREENSHOTS_PATH = path.join(__dirname, '..', 'storage', 'screenshots');
const FIELDS_PATH = path.join(__dirname, '..', 'templates', 'forms', 'ds160-fields.json');

// DS-160 Base URL
const DS160_URL = 'https://ceac.state.gov/GenNIV/Default.aspx';

// Ensure directories exist
[DS160_PATH, SCREENSHOTS_PATH].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Parse arguments
function parseArgs() {
  const args = {
    tramiteId: null,
    dryRun: false,
    section: null,
    resume: false,
  };
  
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
      args[camelKey] = value || true;
    }
  });
  
  return args;
}

// Get Steel API key
function getSteelApiKey() {
  const locations = [
    process.env.STEEL_API_KEY,
    path.join(process.env.HOME || '/home/clawd', '.config/secrets/steel_api_key'),
  ];

  for (const loc of locations) {
    if (typeof loc === 'string' && !loc.includes('/') && loc.length > 10) {
      return loc;
    }
    if (typeof loc === 'string' && loc.includes('/')) {
      try {
        return fs.readFileSync(loc, 'utf-8').trim();
      } catch (e) {}
    }
  }
  return null;
}

// Load tramite data
function loadTramite(tramiteId) {
  const filePath = path.join(STORAGE_PATH, `${tramiteId}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Tramite not found: ${tramiteId}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// Load DS-160 field definitions
function loadFieldDefinitions() {
  if (!fs.existsSync(FIELDS_PATH)) {
    throw new Error(`DS-160 field definitions not found: ${FIELDS_PATH}`);
  }
  return JSON.parse(fs.readFileSync(FIELDS_PATH, 'utf-8'));
}

// Save DS-160 progress
function saveProgress(tramiteId, progress) {
  const filePath = path.join(DS160_PATH, `${tramiteId}-progress.json`);
  progress.updatedAt = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(progress, null, 2));
  console.log(`   💾 Progress saved: ${filePath}`);
}

// Load DS-160 progress
function loadProgress(tramiteId) {
  const filePath = path.join(DS160_PATH, `${tramiteId}-progress.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// Map tramite data to DS-160 fields
function mapDataToFields(tramite, section) {
  const data = tramite.data || {};
  const mapping = {};
  
  // Personal section
  if (section === 'personal' || !section) {
    const personal = data.personal || {};
    mapping.Surname = personal.lastName || '';
    mapping.GivenName = personal.firstName || '';
    mapping.FullNameNative = personal.fullNameNative || 'DOES NOT APPLY';
    mapping.Sex = personal.sex === 'M' ? 'Male' : personal.sex === 'F' ? 'Female' : '';
    mapping.MaritalStatus = personal.maritalStatus || 'Single';
    mapping.DateOfBirth = personal.dateOfBirth || '';
    mapping.CityOfBirth = personal.cityOfBirth || '';
    mapping.CountryOfBirth = personal.countryOfBirth || 'ARGENTINA';
    mapping.Nationality = personal.nationality || 'ARGENTINA';
  }
  
  // Passport section
  if (section === 'passport' || !section) {
    const passport = data.passport || {};
    mapping.PassportNumber = passport.number || '';
    mapping.PassportCountry = passport.country || 'ARGENTINA';
    mapping.PassportCity = passport.issuingCity || '';
    mapping.PassportIssueDate = passport.issueDate || '';
    mapping.PassportExpiryDate = passport.expiryDate || '';
  }
  
  // Contact section
  if (section === 'contact' || !section) {
    const contact = data.contact || {};
    mapping.Address = contact.address || '';
    mapping.City = contact.city || '';
    mapping.State = contact.state || '';
    mapping.PostalCode = contact.postalCode || '';
    mapping.Phone = contact.phone || '';
    mapping.Email = contact.email || '';
  }
  
  // Travel section
  if (section === 'travel' || !section) {
    const travel = data.travel || {};
    mapping.Purpose = travel.purpose || 'Tourism';
    mapping.SpecificPurpose = travel.specificPurpose || 'Tourism and sightseeing';
    mapping.ArrivalDate = travel.arrivalDate || '';
    mapping.DepartureDate = travel.departureDate || '';
    mapping.StayAddress = travel.stayAddress || '';
    mapping.PayingForTrip = travel.payingForTrip || 'Self';
  }
  
  // Employment section
  if (section === 'employment' || !section) {
    const employment = data.employment || {};
    mapping.Occupation = employment.occupation || '';
    mapping.EmployerName = employment.employerName || '';
    mapping.EmployerAddress = employment.employerAddress || '';
    mapping.EmployerPhone = employment.employerPhone || '';
    mapping.JobTitle = employment.jobTitle || '';
    mapping.StartDate = employment.startDate || '';
    mapping.MonthlyIncome = employment.monthlyIncome || '';
  }
  
  // Family section
  if (section === 'family' || !section) {
    const family = data.family || {};
    mapping.FatherSurname = family.fatherLastName || '';
    mapping.FatherGivenName = family.fatherFirstName || '';
    mapping.MotherSurname = family.motherLastName || '';
    mapping.MotherGivenName = family.motherFirstName || '';
    mapping.RelativesInUS = family.relativesInUS ? 'Yes' : 'No';
  }
  
  return mapping;
}

// DS-160 Page handlers - define how to fill each page
const pageHandlers = {
  // Start new application
  async startApplication(page, data) {
    console.log('   📄 Starting new DS-160 application...');
    
    // Select location (Argentina)
    await page.selectOption('#ctl00_SiteContentPlaceHolder_ucLocation_ddlLocation', 'ARG');
    
    // Wait for security question to load
    await page.waitForTimeout(1000);
    
    // Click Start Application
    await page.click('#ctl00_SiteContentPlaceHolder_lnkNew');
    
    await page.waitForNavigation({ waitUntil: 'networkidle' });
  },
  
  // Personal Information Page 1
  async personalInfo1(page, data) {
    console.log('   📝 Filling Personal Information (Page 1)...');
    
    // Surname (required)
    if (data.Surname) {
      await page.fill('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SURNAME', data.Surname);
    }
    
    // Given Name (required)
    if (data.GivenName) {
      await page.fill('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_GIVEN_NAME', data.GivenName);
    }
    
    // Full name in native alphabet
    if (data.FullNameNative === 'DOES NOT APPLY') {
      await page.check('#ctl00_SiteContentPlaceHolder_FormView1_cbxAPP_FULL_NAME_NATIVE_NA');
    } else if (data.FullNameNative) {
      await page.fill('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_FULL_NAME_NATIVE', data.FullNameNative);
    }
    
    // Other names used
    await page.click('#ctl00_SiteContentPlaceHolder_FormView1_rblOtherNames_1'); // No
    
    // Telecode name
    await page.click('#ctl00_SiteContentPlaceHolder_FormView1_rblTelecodeQuestion_1'); // No
    
    // Sex
    if (data.Sex === 'Male') {
      await page.click('#ctl00_SiteContentPlaceHolder_FormView1_rblAPP_GENDER_0');
    } else if (data.Sex === 'Female') {
      await page.click('#ctl00_SiteContentPlaceHolder_FormView1_rblAPP_GENDER_1');
    }
    
    // Marital Status
    if (data.MaritalStatus) {
      const statusMap = {
        'Single': 'S',
        'Married': 'M',
        'Divorced': 'D',
        'Widowed': 'W',
        'Separated': 'P'
      };
      await page.selectOption('#ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_MARITAL_STATUS', statusMap[data.MaritalStatus] || 'S');
    }
    
    // Date of Birth
    if (data.DateOfBirth) {
      const [day, month, year] = data.DateOfBirth.split(/[/-]/);
      await page.fill('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_DOB_Day', day);
      await page.selectOption('#ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_DOB_Month', month);
      await page.fill('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_DOB_Year', year);
    }
    
    // City of Birth
    if (data.CityOfBirth) {
      await page.fill('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_POB_CITY', data.CityOfBirth);
    }
    
    // Country of Birth
    if (data.CountryOfBirth) {
      await page.selectOption('#ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_POB_CNTRY', data.CountryOfBirth);
    }
  },
  
  // Add more page handlers as needed...
  async passportInfo(page, data) {
    console.log('   📝 Filling Passport Information...');
    // TODO: Implement passport page filling
  },
  
  async contactInfo(page, data) {
    console.log('   📝 Filling Contact Information...');
    // TODO: Implement contact page filling
  },
  
  async travelInfo(page, data) {
    console.log('   📝 Filling Travel Information...');
    // TODO: Implement travel page filling
  },
  
  async employmentInfo(page, data) {
    console.log('   📝 Filling Employment Information...');
    // TODO: Implement employment page filling
  },
  
  async securityQuestions(page, data) {
    console.log('   📝 Filling Security Questions...');
    // Most answers are "No" - implement with caution
  },
};

// Main form filling function
async function fillDS160(tramiteId, options = {}) {
  const { dryRun = false, section = null, resume = false } = options;
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('         VISABOT - DS-160 Auto-Fill');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Load tramite
  let tramite;
  try {
    tramite = loadTramite(tramiteId);
    console.log(`✅ Trámite cargado: ${tramiteId}`);
    console.log(`   Usuario: ${tramite.userId}`);
    console.log(`   Tipo: ${tramite.type}\n`);
  } catch (e) {
    console.error(`❌ Error: ${e.message}`);
    process.exit(1);
  }
  
  // Load field definitions
  const fieldDefs = loadFieldDefinitions();
  console.log(`📋 DS-160 fields loaded: ${fieldDefs.sections.length} sections`);
  
  // Map data to fields
  const mappedData = mapDataToFields(tramite, section);
  console.log(`📊 Data mapped for section: ${section || 'all'}`);
  
  // Check for missing required data
  const requiredFields = ['Surname', 'GivenName', 'DateOfBirth', 'PassportNumber'];
  const missing = requiredFields.filter(f => !mappedData[f]);
  if (missing.length > 0) {
    console.log(`\n⚠️ Missing required data: ${missing.join(', ')}`);
    console.log('   Complete the data first with: /visa datos');
  }
  
  // Check progress
  let progress = loadProgress(tramiteId);
  if (progress && resume) {
    console.log(`\n📂 Resuming from previous session:`);
    console.log(`   Application ID: ${progress.applicationId || 'Not started'}`);
    console.log(`   Last section: ${progress.lastSection || 'None'}`);
    console.log(`   Last updated: ${progress.updatedAt}`);
  }
  
  if (dryRun) {
    console.log('\n🔍 DRY RUN MODE - Showing what would be filled:\n');
    
    Object.entries(mappedData).forEach(([key, value]) => {
      if (value) {
        console.log(`   ${key}: ${value}`);
      }
    });
    
    console.log('\n✅ Dry run complete. No browser actions taken.');
    return { success: true, mode: 'dry-run', data: mappedData };
  }
  
  // Get Steel API key
  const apiKey = getSteelApiKey();
  if (!apiKey) {
    console.error('\n❌ Steel API key not found');
    console.log('   Set STEEL_API_KEY environment variable or save key to:');
    console.log('   ~/.config/secrets/steel_api_key');
    process.exit(1);
  }
  
  // Dynamic imports
  let Steel, chromium;
  try {
    Steel = (await import('steel-sdk')).default;
    chromium = (await import('playwright')).chromium;
  } catch (e) {
    console.error(`\n❌ Dependencies not installed. Run:\n   npm install steel-sdk playwright`);
    process.exit(1);
  }
  
  const client = new Steel({ steelAPIKey: apiKey });
  let session = null;
  let browser = null;
  
  const result = {
    success: false,
    applicationId: null,
    sectionsCompleted: [],
    screenshots: [],
    errors: []
  };
  
  try {
    // Create Steel session
    console.log('\n🚀 Creating Steel session...');
    session = await client.sessions.create({
      useProxy: false,
      solveCaptcha: false,
      timeout: 600000, // 10 min for complex form
    });
    
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Live View: ${session.sessionViewerUrl}\n`);
    result.sessionViewerUrl = session.sessionViewerUrl;
    
    // Connect browser
    browser = await chromium.connectOverCDP(
      `wss://connect.steel.dev?apiKey=${apiKey}&sessionId=${session.id}`
    );
    
    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();
    
    // Navigate to DS-160
    console.log(`🌐 Navigating to DS-160 portal...`);
    await page.goto(DS160_URL, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Take initial screenshot
    const initScreenshot = path.join(SCREENSHOTS_PATH, `${tramiteId}-ds160-start.png`);
    await page.screenshot({ path: initScreenshot });
    result.screenshots.push(initScreenshot);
    
    console.log(`   Page loaded: ${await page.title()}`);
    
    // Start or resume application
    if (!progress?.applicationId) {
      await pageHandlers.startApplication(page, mappedData);
      
      // Save application ID if available
      const currentUrl = page.url();
      const appIdMatch = currentUrl.match(/[?&]ApplicationId=([^&]+)/i);
      if (appIdMatch) {
        progress = progress || { tramiteId };
        progress.applicationId = appIdMatch[1];
        result.applicationId = appIdMatch[1];
        saveProgress(tramiteId, progress);
      }
    }
    
    // Fill personal info
    await pageHandlers.personalInfo1(page, mappedData);
    result.sectionsCompleted.push('personal1');
    
    // Take screenshot after each section
    const personalScreenshot = path.join(SCREENSHOTS_PATH, `${tramiteId}-ds160-personal.png`);
    await page.screenshot({ path: personalScreenshot, fullPage: true });
    result.screenshots.push(personalScreenshot);
    
    // Update progress
    progress = progress || { tramiteId };
    progress.lastSection = 'personal1';
    progress.sectionsCompleted = result.sectionsCompleted;
    saveProgress(tramiteId, progress);
    
    console.log('\n✅ Initial sections filled successfully');
    console.log('\n⚠️ IMPORTANT: Review all data before clicking "Next"');
    console.log('   This script does NOT auto-submit. Manual review required.\n');
    
    result.success = true;
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    result.errors.push(error.message);
    
    // Try to take error screenshot
    try {
      if (browser) {
        const context = browser.contexts()[0];
        const page = context.pages()[0];
        if (page) {
          const errorScreenshot = path.join(SCREENSHOTS_PATH, `${tramiteId}-ds160-error.png`);
          await page.screenshot({ path: errorScreenshot, fullPage: true });
          result.screenshots.push(errorScreenshot);
        }
      }
    } catch (e) {}
    
  } finally {
    // Cleanup
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
    if (session) {
      try {
        await client.sessions.release(session.id);
        console.log('🧹 Session released');
      } catch (e) {}
    }
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  if (result.success) {
    console.log('✅ Status: Partial fill completed');
  } else {
    console.log('❌ Status: Errors occurred');
  }
  
  if (result.applicationId) {
    console.log(`📝 Application ID: ${result.applicationId}`);
  }
  
  console.log(`📊 Sections completed: ${result.sectionsCompleted.join(', ') || 'None'}`);
  
  if (result.screenshots.length > 0) {
    console.log(`📸 Screenshots saved:`);
    result.screenshots.forEach(s => console.log(`   - ${s}`));
  }
  
  if (result.errors.length > 0) {
    console.log(`⚠️ Errors:`);
    result.errors.forEach(e => console.log(`   - ${e}`));
  }
  
  return result;
}

// Help text
function showHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         📋 VISABOT - DS-160 Auto-Fill                         ║
╚════════════════════════════════════════════════════════════════╝

Este script automatiza el llenado del formulario DS-160 usando Steel Cloud.

ADVERTENCIA: El DS-160 es un formulario complejo y sensible. 
Siempre revisá los datos antes de continuar cada página.
El script NO hace submit automático.

Uso:
  node fill-ds160.js --tramite-id=<id> [opciones]

Opciones:
  --tramite-id=ID    ID del trámite (requerido)
  --dry-run          Ver qué datos se llenarían, sin ejecutar
  --section=SEC      Llenar solo una sección específica
  --resume           Retomar desde donde quedó

Secciones disponibles:
  - personal    Información personal
  - passport    Información del pasaporte
  - contact     Información de contacto
  - travel      Información del viaje
  - employment  Información laboral
  - family      Información familiar
  - security    Preguntas de seguridad

Ejemplos:
  node fill-ds160.js --tramite-id=abc123 --dry-run
  node fill-ds160.js --tramite-id=abc123 --section=personal
  node fill-ds160.js --tramite-id=abc123 --resume

Notas:
  - El formulario requiere sesión activa (timeout ~20 min)
  - Guardá el Application ID para retomar después
  - Las capturas de pantalla se guardan en storage/screenshots/
`);
}

// Main
const args = parseArgs();

if (!args.tramiteId) {
  showHelp();
  process.exit(1);
}

fillDS160(args.tramiteId, {
  dryRun: args.dryRun,
  section: args.section,
  resume: args.resume
}).catch(console.error);
