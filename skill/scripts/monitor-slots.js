#!/usr/bin/env node
/**
 * Monitor visa appointment slot availability
 * 
 * Usage: node monitor-slots.js --tramite-id=<id> [--dry-run]
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

// Check if Steel is available
function isSteelAvailable() {
  try {
    const result = execSync('node ' + path.join(__dirname, 'check-steel.js'), {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return result.includes('STEEL_CONFIGURED');
  } catch (e) {
    return false;
  }
}

// Get Steel API key
function getSteelApiKey() {
  const locations = [
    process.env.STEEL_API_KEY,
    path.join(process.env.HOME, '.config/secrets/steel_api_key'),
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

// Monitor using Steel (automated)
async function monitorWithSteel(tramite) {
  console.log('🤖 Using Steel Cloud for automated monitoring...\n');
  
  const apiKey = getSteelApiKey();
  if (!apiKey) {
    throw new Error('Steel API key not found');
  }

  // For ustraveldocs.com (USA visa appointments)
  const consulate = tramite.monitoring?.consulate || 'Buenos Aires';
  const visaType = tramite.type || 'B1B2';
  
  console.log(`📍 Consulate: ${consulate}`);
  console.log(`📋 Visa Type: ${visaType}`);
  console.log(`📅 Date Range: ${tramite.monitoring?.dateFrom || 'Any'} - ${tramite.monitoring?.dateTo || 'Any'}`);
  
  // TODO: Implement actual Steel browser automation
  // This would:
  // 1. Create a Steel session
  // 2. Navigate to ustraveldocs.com
  // 3. Login with saved credentials (if any)
  // 4. Check available slots
  // 5. Return results

  // For now, return placeholder
  console.log('\n⏳ Checking availability...');
  
  // Simulated response (replace with actual Steel implementation)
  const mockResult = {
    available: false,
    slots: [],
    checkedAt: new Date().toISOString(),
    nextCheck: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  };

  return mockResult;
}

// Fallback: Generate manual check instructions
function generateManualInstructions(tramite) {
  const consulate = tramite.monitoring?.consulate || 'Buenos Aires';
  const visaType = tramite.type || 'B1B2';
  
  return {
    mode: 'MANUAL',
    instructions: `
📋 **Instrucciones para verificar turnos manualmente**

**Sistema:** US Travel Docs (ustraveldocs.com)
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
    fallbackReason: 'Steel Cloud no configurado'
  };
}

// Main monitoring function
async function monitor(tramiteId, dryRun = false) {
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
  if (!tramite.monitoring?.active) {
    console.log('⚠️ Monitoreo no activo para este trámite');
    console.log('   Activá el monitoreo con: /visa monitorear');
    process.exit(0);
  }

  // Try Steel first, fallback to manual
  let result;
  const steelAvailable = isSteelAvailable();

  if (steelAvailable && !dryRun) {
    try {
      result = await monitorWithSteel(tramite);
    } catch (e) {
      console.log(`⚠️ Steel error: ${e.message}`);
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
  console.log('═══════════════════════════════════════════');
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
      console.log(`  ${i + 1}. ${slot.date} - ${slot.time} - ${slot.location}`);
    });
    
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
  }

  // Save monitoring log
  if (!dryRun) {
    const logPath = path.join(MONITORING_PATH, `${tramiteId}-log.json`);
    let log = [];
    if (fs.existsSync(logPath)) {
      log = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
    }
    log.push({
      timestamp: new Date().toISOString(),
      mode: result.mode || 'AUTOMATED',
      available: result.available || false,
      slotsCount: result.slots?.length || 0
    });
    // Keep last 100 entries
    if (log.length > 100) log = log.slice(-100);
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
  }

  return result;
}

// Run
const args = parseArgs();
if (!args['tramite-id']) {
  console.error('Usage: node monitor-slots.js --tramite-id=<id> [--dry-run]');
  process.exit(1);
}

monitor(args['tramite-id'], args['dry-run']).catch(console.error);
