#!/usr/bin/env node
/**
 * Monitor visa appointment slot availability
 * 
 * Usage: node monitor-slots.js --tramite-id=<id> [--dry-run] [--force-steel]
 * 
 * This script checks for available appointment slots at the specified
 * consulate and notifies the user if slots are found.
 * 
 * Supports:
 *   - Steel Cloud (automated browser)
 *   - Fallback: Manual check instructions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const STORAGE_PATH = path.join(__dirname, '..', 'storage', 'tramites');
const MONITORING_PATH = path.join(__dirname, '..', 'storage', 'monitoring');

// Ensure directories exist
[STORAGE_PATH, MONITORING_PATH].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Parse arguments
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      args[key] = value || true;
    }
  });
  return args;
}

// Load tramite data
function loadTramite(tramiteId) {
  const filePath = path.join(STORAGE_PATH, `${tramiteId}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Tramite not found: ${tramiteId}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// Save tramite data
function saveTramite(tramite) {
  const filePath = path.join(STORAGE_PATH, `${tramite.id}.json`);
  tramite.updatedAt = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(tramite, null, 2));
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

// Check if Steel is available
function isSteelAvailable() {
  const apiKey = getSteelApiKey();
  return !!apiKey;
}

// Monitor using Steel (automated) - IMPLEMENTACIÓN COMPLETA
async function monitorWithSteel(tramite) {
  console.log('🤖 Using Steel Cloud for automated monitoring...\n');
  
  const apiKey = getSteelApiKey();
  if (!apiKey) {
    throw new Error('Steel API key not found');
  }

  // Dynamic imports for ES modules
  let Steel, chromium;
  try {
    Steel = (await import('steel-sdk')).default;
    chromium = (await import('playwright')).chromium;
  } catch (e) {
    throw new Error(`Dependencies not installed. Run: npm install steel-sdk playwright\n${e.message}`);
  }

  // For ais.usvisa-info.com (USA visa appointments)
  const consulate = tramite.monitoring?.consulate || 'Buenos Aires';
  const visaType = tramite.type || 'B1B2';
  const credentials = tramite.monitoring?.credentials || null;
  
  console.log(`📍 Consulate: ${consulate}`);
  console.log(`📋 Visa Type: ${visaType}`);
  console.log(`📅 Date Range: ${tramite.monitoring?.dateFrom || 'Any'} - ${tramite.monitoring?.dateTo || 'Any'}`);
  console.log(`🔐 Credentials: ${credentials ? 'Saved' : 'Not saved (manual login needed)'}\n`);
  
  const client = new Steel({ steelAPIKey: apiKey });
  let session = null;
  let browser = null;
  
  const result = {
    available: false,
    slots: [],
    checkedAt: new Date().toISOString(),
    nextCheck: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    mode: 'STEEL',
    screenshots: []
  };

  try {
    // Create Steel session
    console.log('🚀 Creating Steel session...');
    session = await client.sessions.create({
      useProxy: false,       // Hobby plan
      solveCaptcha: false,   // Hobby plan
      timeout: 300000,       // 5 min timeout
    });
    
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Live View: ${session.sessionViewerUrl}\n`);
    result.sessionViewerUrl = session.sessionViewerUrl;
    
    // Connect Playwright to Steel browser
    console.log('🌐 Connecting browser...');
    browser = await chromium.connectOverCDP(
      `wss://connect.steel.dev?apiKey=${apiKey}&sessionId=${session.id}`
    );
    
    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();
    
    // Navigate to visa appointment site
    const loginUrl = 'https://ais.usvisa-info.com/es-ar/niv/users/sign_in';
    console.log(`📄 Navigating to: ${loginUrl}`);
    
    await page.goto(loginUrl, { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    });
    
    // Take screenshot
    const screenshotPath = path.join(MONITORING_PATH, `${tramite.id}-login.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    result.screenshots.push(screenshotPath);
    
    // Check if we need to login
    const pageTitle = await page.title();
    console.log(`   Page title: ${pageTitle}`);
    
    // Try to login if credentials available
    if (credentials && credentials.email && credentials.password) {
      console.log('\n🔑 Attempting login...');
      
      try {
        // Fill email
        await page.fill('input[name="user[email]"]', credentials.email);
        // Fill password
        await page.fill('input[name="user[password]"]', credentials.password);
        // Accept policy checkbox if exists
        try {
          await page.check('input[name="policy_confirmed"]', { timeout: 2000 });
        } catch (e) {}
        
        // Click sign in button
        await page.click('input[type="submit"]');
        
        // Wait for navigation
        await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });
        
        console.log('   Login submitted, checking result...');
        
        // Take screenshot after login
        const postLoginPath = path.join(MONITORING_PATH, `${tramite.id}-postlogin.png`);
        await page.screenshot({ path: postLoginPath });
        result.screenshots.push(postLoginPath);
        
        // Check for login errors
        const errorElement = await page.$('.alert-error, .error, .flash-error');
        if (errorElement) {
          const errorText = await errorElement.textContent();
          console.log(`   ❌ Login error: ${errorText}`);
          result.loginError = errorText;
        } else {
          console.log('   ✅ Login appears successful');
          
          // Navigate to appointments page
          console.log('\n📅 Looking for appointment availability...');
          
          // Try to find the appointments/schedule link
          try {
            // Common selectors for appointment link
            const appointmentSelectors = [
              'a[href*="appointment"]',
              'a[href*="schedule"]',
              'a:has-text("Schedule")',
              'a:has-text("Appointment")',
              'a:has-text("Cita")',
              '.attend-appointment',
            ];
            
            for (const selector of appointmentSelectors) {
              try {
                const link = await page.$(selector);
                if (link) {
                  await link.click();
                  await page.waitForLoadState('networkidle', { timeout: 15000 });
                  break;
                }
              } catch (e) {}
            }
            
            // Take screenshot of appointments page
            const appointmentsPath = path.join(MONITORING_PATH, `${tramite.id}-appointments.png`);
            await page.screenshot({ path: appointmentsPath, fullPage: true });
            result.screenshots.push(appointmentsPath);
            
            // Try to find available slots
            // Look for date picker or available dates
            const pageContent = await page.content();
            
            // Check for "no appointments" messages
            const noAppointmentPatterns = [
              /no.*appointments.*available/i,
              /no.*citas.*disponibles/i,
              /no hay fechas/i,
              /not.*available/i,
            ];
            
            const hasNoAppointments = noAppointmentPatterns.some(p => p.test(pageContent));
            
            if (hasNoAppointments) {
              console.log('   😔 No appointments currently available');
              result.available = false;
            } else {
              // Try to extract available dates
              // This depends heavily on the site structure
              const dateElements = await page.$$('.datepicker td:not(.disabled), .available-date, .calendar-day.available');
              
              if (dateElements.length > 0) {
                console.log(`   🎉 Found ${dateElements.length} potential available dates!`);
                result.available = true;
                
                // Try to extract the dates
                for (const el of dateElements.slice(0, 10)) { // Max 10
                  try {
                    const dateText = await el.textContent();
                    const dateTitle = await el.getAttribute('title') || await el.getAttribute('data-date');
                    result.slots.push({
                      date: dateTitle || dateText,
                      raw: dateText
                    });
                  } catch (e) {}
                }
              }
            }
            
          } catch (navError) {
            console.log(`   ⚠️ Could not navigate to appointments: ${navError.message}`);
          }
        }
        
      } catch (loginError) {
        console.log(`   ❌ Login failed: ${loginError.message}`);
        result.loginError = loginError.message;
      }
      
    } else {
      console.log('\n⚠️ No credentials saved - cannot check appointments automatically');
      console.log('   Save credentials with: /visa config credentials');
      result.needsCredentials = true;
    }
    
    // Final screenshot
    const finalPath = path.join(MONITORING_PATH, `${tramite.id}-final.png`);
    await page.screenshot({ path: finalPath, fullPage: true });
    result.screenshots.push(finalPath);
    
  } catch (error) {
    console.error(`\n❌ Steel error: ${error.message}`);
    result.error = error.message;
    throw error;
    
  } finally {
    // Cleanup
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
    if (session) {
      try {
        await client.sessions.release(session.id);
        console.log('\n🧹 Session released');
      } catch (e) {}
    }
  }
  
  return result;
}

// Fallback: Generate manual check instructions
function generateManualInstructions(tramite) {
  const consulate = tramite.monitoring?.consulate || 'Buenos Aires';
  const visaType = tramite.type || 'B1B2';
  
  return {
    mode: 'MANUAL',
    available: false,
    instructions: `
📋 **Instrucciones para verificar turnos manualmente**

**Sistema:** US Travel Docs (ais.usvisa-info.com)
**Consulado:** ${consulate}
**Tipo de visa:** ${visaType}

**Pasos:**
1. Ingresá a: https://ais.usvisa-info.com/es-ar/niv/users/sign_in
2. Iniciá sesión con tus credenciales
3. Andá a "Programar cita" o "Reprogramar cita"
4. Seleccioná el consulado: ${consulate}
5. Revisá las fechas disponibles

**Rango de fechas buscado:**
- Desde: ${tramite.monitoring?.dateFrom || 'Lo antes posible'}
- Hasta: ${tramite.monitoring?.dateTo || 'Sin límite'}

**Si encontrás turno:**
Avisame con el comando: /visa turno encontrado

**Links útiles:**
- Sistema de citas: https://ais.usvisa-info.com/es-ar/niv
- Estado de visa: https://ceac.state.gov/CEACStatTracker/Status.aspx
`.trim(),
    checkedAt: new Date().toISOString(),
    fallbackReason: 'Steel Cloud no configurado o falló'
  };
}

// Main monitoring function
async function monitor(tramiteId, options = {}) {
  const { dryRun = false, forceSteel = false } = options;
  
  console.log('═══════════════════════════════════════════');
  console.log('       VISABOT - Monitor de Turnos');
  console.log('═══════════════════════════════════════════\n');

  // Load tramite
  let tramite;
  try {
    tramite = loadTramite(tramiteId);
    console.log(`✅ Trámite cargado: ${tramiteId}`);
    console.log(`   Usuario: ${tramite.userId}`);
    console.log(`   Tipo: ${tramite.type}`);
    console.log(`   Estado: ${tramite.status}\n`);
  } catch (e) {
    console.error(`❌ Error: ${e.message}`);
    process.exit(1);
  }

  // Check if monitoring is active
  if (!tramite.monitoring?.active && !forceSteel) {
    console.log('⚠️ Monitoreo no activo para este trámite');
    console.log('   Activá el monitoreo con: /visa monitorear');
    process.exit(0);
  }

  // Try Steel first, fallback to manual
  let result;
  const steelAvailable = isSteelAvailable();

  if ((steelAvailable || forceSteel) && !dryRun) {
    try {
      result = await monitorWithSteel(tramite);
    } catch (e) {
      console.log(`\n⚠️ Steel error: ${e.message}`);
      console.log('   Switching to manual mode...\n');
      result = generateManualInstructions(tramite);
    }
  } else {
    if (!steelAvailable) {
      console.log('ℹ️ Steel Cloud no disponible');
    }
    if (dryRun) {
      console.log('ℹ️ Dry run - no se ejecutará automatización');
    }
    console.log('   Generando instrucciones manuales...\n');
    result = generateManualInstructions(tramite);
  }

  // Output result
  console.log('\n═══════════════════════════════════════════');
  console.log('                RESULTADO');
  console.log('═══════════════════════════════════════════\n');

  if (result.mode === 'MANUAL') {
    console.log('📝 MODO: Manual (fallback)');
    console.log(`📅 Verificado: ${result.checkedAt}`);
    console.log(`💡 Razón: ${result.fallbackReason}\n`);
    console.log(result.instructions);
  } else if (result.available) {
    console.log('🎉 ¡TURNOS DISPONIBLES!');
    console.log(`📅 Verificado: ${result.checkedAt}`);
    console.log('\nSlots encontrados:');
    result.slots.forEach((slot, i) => {
      console.log(`  ${i + 1}. ${slot.date} ${slot.time ? `- ${slot.time}` : ''} ${slot.location ? `- ${slot.location}` : ''}`);
    });
    
    if (result.screenshots?.length > 0) {
      console.log('\n📸 Screenshots guardados:');
      result.screenshots.forEach(s => console.log(`   - ${s}`));
    }
    
    // Update tramite status
    if (!dryRun) {
      tramite.status = 'SLOT_FOUND';
      tramite.lastSlots = result.slots;
      saveTramite(tramite);
    }
  } else {
    console.log('😔 No hay turnos disponibles');
    console.log(`📅 Verificado: ${result.checkedAt}`);
    console.log(`⏰ Próxima verificación: ${result.nextCheck}`);
    
    if (result.error) {
      console.log(`⚠️ Error: ${result.error}`);
    }
    
    if (result.needsCredentials) {
      console.log('\n💡 Para verificación automática, guardá tus credenciales');
    }
    
    if (result.screenshots?.length > 0) {
      console.log('\n📸 Screenshots guardados:');
      result.screenshots.forEach(s => console.log(`   - ${s}`));
    }
  }

  // Save monitoring log
  if (!dryRun) {
    const logPath = path.join(MONITORING_PATH, `${tramiteId}-log.json`);
    let log = [];
    if (fs.existsSync(logPath)) {
      try {
        log = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
      } catch (e) {}
    }
    log.push({
      timestamp: new Date().toISOString(),
      mode: result.mode || 'AUTOMATED',
      available: result.available || false,
      slotsCount: result.slots?.length || 0,
      error: result.error || null
    });
    // Keep last 100 entries
    if (log.length > 100) log = log.slice(-100);
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
  }

  // Return result for programmatic use
  return result;
}

// Run
const args = parseArgs();
if (!args['tramite-id']) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         📋 VISABOT - Monitor de Turnos                        ║
╚════════════════════════════════════════════════════════════════╝

Uso:
  node monitor-slots.js --tramite-id=<id> [opciones]

Opciones:
  --tramite-id=ID    ID del trámite a monitorear (requerido)
  --dry-run          Solo mostrar qué haría, sin ejecutar
  --force-steel      Forzar uso de Steel aunque no haya credenciales

Ejemplo:
  node monitor-slots.js --tramite-id=abc123
  node monitor-slots.js --tramite-id=abc123 --dry-run
`);
  process.exit(1);
}

monitor(args['tramite-id'], {
  dryRun: args['dry-run'],
  forceSteel: args['force-steel']
}).catch(console.error);
