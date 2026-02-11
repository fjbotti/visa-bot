#!/usr/bin/env node
/**
 * Book a visa appointment slot
 * 
 * Usage: node book-appointment.js --tramite-id=<id> --slot-id=<slot> [--dry-run]
 * 
 * This script attempts to book an available appointment slot.
 * Requires Steel Cloud for automation, with manual fallback.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const STORAGE_PATH = path.join(__dirname, '..', 'storage', 'tramites');

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

// Book using Steel (automated)
async function bookWithSteel(tramite, slotId) {
  console.log('🤖 Using Steel Cloud for automated booking...\n');
  
  // TODO: Implement actual Steel browser automation
  // This would:
  // 1. Create a Steel session
  // 2. Navigate to the booking page
  // 3. Select the slot
  // 4. Fill in required information
  // 5. Confirm booking
  // 6. Return confirmation number

  // For now, return placeholder
  console.log('⏳ Attempting to book slot...');
  
  // Simulated response (replace with actual Steel implementation)
  return {
    success: false,
    mode: 'AUTOMATED',
    error: 'Steel automation not yet implemented',
    message: 'Please use manual booking for now'
  };
}

// Fallback: Generate manual booking instructions
function generateManualInstructions(tramite, slotId) {
  const consulate = tramite.monitoring?.consulate || 'Buenos Aires';
  const slot = tramite.lastSlots?.find(s => s.id === slotId) || { date: 'Ver en sistema', time: 'Ver en sistema' };
  
  // Prepare data for copy-paste
  const applicant = tramite.data?.personal || {};
  const passport = tramite.data?.passport || {};
  
  return {
    success: false,
    mode: 'MANUAL',
    instructions: `
📋 **Instrucciones para reservar turno manualmente**

**Turno a reservar:**
- Fecha: ${slot.date}
- Hora: ${slot.time}
- Consulado: ${consulate}

**Pasos:**
1. Ingresá a: https://ais.usvisa-info.com/es-ar/niv/users/sign_in
2. Iniciá sesión con tus credenciales
3. Andá a "Programar cita"
4. Seleccioná la fecha: ${slot.date}
5. Seleccioná la hora: ${slot.time}
6. Confirmá la reserva

**Datos del solicitante (para copiar):**
- Nombre: ${applicant.firstName || '[completar]'}
- Apellido: ${applicant.lastName || '[completar]'}
- Pasaporte: ${passport.number || '[completar]'}
- Email: ${tramite.data?.contact?.email || '[completar]'}

**Después de reservar:**
Avisame con: /visa confirmar reserva

**⚠️ IMPORTANTE:**
- Los turnos se agotan rápido
- Tené los datos listos antes de empezar
- Si el turno ya no está, volvé a monitorear
`.trim(),
    fallbackReason: 'Steel Cloud no configurado - requiere reserva manual'
  };
}

// Main booking function
async function book(tramiteId, slotId, dryRun = false) {
  console.log('═══════════════════════════════════════════');
  console.log('       VISABOT - Reservar Turno');
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

  // Validate status
  if (tramite.status !== 'SLOT_FOUND' && tramite.status !== 'DATA_COMPLETE') {
    console.log('⚠️ El trámite no está listo para reservar');
    console.log(`   Estado actual: ${tramite.status}`);
    console.log('   Estados válidos: SLOT_FOUND, DATA_COMPLETE');
    process.exit(1);
  }

  // Try Steel first, fallback to manual
  let result;
  const steelAvailable = isSteelAvailable();

  if (steelAvailable && !dryRun) {
    try {
      result = await bookWithSteel(tramite, slotId);
    } catch (e) {
      console.log(`⚠️ Steel error: ${e.message}`);
      console.log('   Switching to manual mode...\n');
      result = generateManualInstructions(tramite, slotId);
    }
  } else {
    if (!steelAvailable) {
      console.log('ℹ️ Steel Cloud no disponible');
    }
    if (dryRun) {
      console.log('ℹ️ Dry run - no se ejecutará automatización');
    }
    console.log('   Generando instrucciones manuales...\n');
    result = generateManualInstructions(tramite, slotId);
  }

  // Output result
  console.log('═══════════════════════════════════════════');
  console.log('                RESULTADO');
  console.log('═══════════════════════════════════════════\n');

  if (result.success) {
    console.log('🎉 ¡TURNO RESERVADO!');
    console.log(`📅 Confirmación: ${result.confirmationNumber}`);
    console.log(`📍 Consulado: ${result.consulate}`);
    console.log(`🕐 Fecha/Hora: ${result.datetime}`);
    
    // Update tramite status
    if (!dryRun) {
      tramite.status = 'BOOKED';
      tramite.booking = {
        confirmationNumber: result.confirmationNumber,
        datetime: result.datetime,
        consulate: result.consulate,
        bookedAt: new Date().toISOString()
      };
      tramite.monitoring.active = false;
      saveTramite(tramite);
    }
  } else if (result.mode === 'MANUAL') {
    console.log('📝 MODO: Manual (fallback)');
    console.log(`💡 Razón: ${result.fallbackReason}\n`);
    console.log(result.instructions);
  } else {
    console.log('❌ No se pudo reservar');
    console.log(`📝 Error: ${result.error}`);
    console.log(`💡 Mensaje: ${result.message}`);
  }

  return result;
}

// Run
const args = parseArgs();
if (!args['tramite-id']) {
  console.error('Usage: node book-appointment.js --tramite-id=<id> --slot-id=<slot> [--dry-run]');
  process.exit(1);
}

book(args['tramite-id'], args['slot-id'] || 'default', args['dry-run']).catch(console.error);
