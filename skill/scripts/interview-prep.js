#!/usr/bin/env node
/**
 * Interview Preparation Script for Visa B1/B2
 * 
 * Usage: 
 *   node interview-prep.js --visa-type=B1B2 [--category=purpose] [--simulate] [--count=10]
 * 
 * Options:
 *   --visa-type   Type of visa (default: B1B2)
 *   --category    Specific category to practice (optional)
 *   --simulate    Interactive simulation mode
 *   --count       Number of questions in simulation (default: 10)
 *   --list        List all questions
 *   --tips        Show interview tips
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const TEMPLATES_PATH = path.join(__dirname, '..', 'templates', 'interview');

// Parse arguments
function parseArgs() {
  const args = {
    visaType: 'B1B2',
    category: null,
    simulate: false,
    count: 10,
    list: false,
    tips: false
  };
  
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
      args[camelKey] = value || true;
    }
  });
  
  if (args.count) args.count = parseInt(args.count, 10);
  
  return args;
}

// Load questions for visa type
function loadQuestions(visaType) {
  const filename = `questions-${visaType.toLowerCase()}.json`;
  const filePath = path.join(TEMPLATES_PATH, filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ No questions found for visa type: ${visaType}`);
    console.log(`   Looking for: ${filePath}`);
    console.log('\nAvailable question files:');
    fs.readdirSync(TEMPLATES_PATH)
      .filter(f => f.startsWith('questions-'))
      .forEach(f => console.log(`   - ${f}`));
    process.exit(1);
  }
  
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// Load tips
function loadTips() {
  const filePath = path.join(TEMPLATES_PATH, 'tips.md');
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf-8');
}

// List all questions
function listQuestions(data, category = null) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  📋 Preguntas de Entrevista - Visa ${data.visaType}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const categories = category 
    ? data.categories.filter(c => c.id === category)
    : data.categories;
  
  if (categories.length === 0) {
    console.log(`❌ Categoría no encontrada: ${category}`);
    console.log('\nCategorías disponibles:');
    data.categories.forEach(c => console.log(`   - ${c.id}: ${c.name}`));
    return;
  }
  
  let totalQuestions = 0;
  
  categories.forEach(cat => {
    console.log(`\n📁 ${cat.name.toUpperCase()}`);
    console.log('─'.repeat(50));
    
    cat.questions.forEach(q => {
      console.log(`\n  ${q.id}. ${q.question}`);
      console.log(`     💡 Tip: ${q.tips}`);
      if (q.redFlags && q.redFlags.length > 0) {
        console.log(`     ⚠️  Evitar: ${q.redFlags.join(', ')}`);
      }
      totalQuestions++;
    });
  });
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  Total: ${totalQuestions} preguntas`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// Get random questions for simulation
function getRandomQuestions(data, count, category = null) {
  let allQuestions = [];
  
  const categories = category
    ? data.categories.filter(c => c.id === category)
    : data.categories;
  
  categories.forEach(cat => {
    cat.questions.forEach(q => {
      allQuestions.push({
        ...q,
        category: cat.name
      });
    });
  });
  
  // Shuffle and take count
  for (let i = allQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }
  
  return allQuestions.slice(0, Math.min(count, allQuestions.length));
}

// Analyze response quality (simple heuristics)
function analyzeResponse(response, question) {
  const feedback = {
    score: 0,
    comments: []
  };
  
  const words = response.trim().split(/\s+/).length;
  
  // Check length
  if (words < 3) {
    feedback.comments.push('⚠️ Respuesta muy corta. Elaborá un poco más.');
    feedback.score -= 1;
  } else if (words > 100) {
    feedback.comments.push('⚠️ Respuesta muy larga. Sé más conciso.');
    feedback.score -= 1;
  } else if (words >= 10 && words <= 50) {
    feedback.comments.push('✅ Longitud adecuada.');
    feedback.score += 1;
  }
  
  // Check for specifics (numbers, dates, names)
  if (/\d/.test(response)) {
    feedback.comments.push('✅ Incluiste datos específicos (números/fechas).');
    feedback.score += 1;
  }
  
  // Check for red flags
  const redFlagPatterns = [
    { pattern: /no s[eé]/i, msg: '⚠️ Evitá decir "no sé" - mostrá que tenés un plan.' },
    { pattern: /tal vez|quizás|maybe/i, msg: '⚠️ Evitá la ambigüedad - sé más definido.' },
    { pattern: /quedarme|stay longer|no volver/i, msg: '🚨 ¡Cuidado! Esto puede interpretarse como intención de quedarse.' },
  ];
  
  redFlagPatterns.forEach(rf => {
    if (rf.pattern.test(response)) {
      feedback.comments.push(rf.msg);
      feedback.score -= 2;
    }
  });
  
  // Check for positive indicators
  const positivePatterns = [
    { pattern: /trabajo|empleo|empresa|job|work/i, msg: '✅ Mencionaste tu trabajo - buen lazo.' },
    { pattern: /familia|hijos|esposa|esposo|family/i, msg: '✅ Mencionaste familia - excelente lazo.' },
    { pattern: /casa|propiedad|property/i, msg: '✅ Mencionaste propiedad - fuerte lazo.' },
    { pattern: /volver|regresar|return/i, msg: '✅ Mostraste intención de regresar.' },
  ];
  
  positivePatterns.forEach(pp => {
    if (pp.pattern.test(response)) {
      feedback.comments.push(pp.msg);
      feedback.score += 1;
    }
  });
  
  // Add question-specific tip
  if (question.tips) {
    feedback.comments.push(`💡 Recordá: ${question.tips}`);
  }
  
  // Calculate final score
  feedback.finalScore = Math.max(0, Math.min(10, 5 + feedback.score));
  
  return feedback;
}

// Interactive simulation
async function runSimulation(data, count, category = null) {
  const questions = getRandomQuestions(data, count, category);
  
  if (questions.length === 0) {
    console.log('❌ No se encontraron preguntas para simular.');
    return;
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const ask = (prompt) => new Promise(resolve => rl.question(prompt, resolve));
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  🎯 SIMULACRO DE ENTREVISTA DE VISA');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('Voy a hacerte preguntas como si fuera un oficial consular.');
  console.log('Respondé como lo harías en la entrevista real.');
  console.log('Escribí tu respuesta y presioná Enter.');
  console.log('Para salir, escribí "salir" o "exit".\n');
  console.log('─'.repeat(60));
  
  let totalScore = 0;
  let questionsAnswered = 0;
  
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    
    console.log(`\n📌 Pregunta ${i + 1}/${questions.length} [${q.category}]\n`);
    console.log(`   👤 "${q.question}"\n`);
    
    const response = await ask('   Tu respuesta: ');
    
    if (response.toLowerCase() === 'salir' || response.toLowerCase() === 'exit') {
      console.log('\n👋 Simulacro terminado por el usuario.\n');
      break;
    }
    
    if (response.trim().length === 0) {
      console.log('\n   ⚠️ No respondiste nada. En la entrevista real, siempre respondé algo.\n');
      continue;
    }
    
    questionsAnswered++;
    
    // Analyze and show feedback
    const feedback = analyzeResponse(response, q);
    totalScore += feedback.finalScore;
    
    console.log('\n   📊 FEEDBACK:');
    feedback.comments.forEach(c => console.log(`   ${c}`));
    console.log(`   \n   Puntaje: ${feedback.finalScore}/10`);
    console.log('─'.repeat(60));
  }
  
  // Final summary
  if (questionsAnswered > 0) {
    const avgScore = (totalScore / questionsAnswered).toFixed(1);
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  📊 RESUMEN DEL SIMULACRO');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`   Preguntas respondidas: ${questionsAnswered}`);
    console.log(`   Puntaje promedio: ${avgScore}/10\n`);
    
    if (avgScore >= 8) {
      console.log('   🌟 ¡Excelente! Estás muy bien preparado/a.');
    } else if (avgScore >= 6) {
      console.log('   👍 Bien, pero podés mejorar. Practicá más.');
    } else if (avgScore >= 4) {
      console.log('   ⚠️ Necesitás más práctica. Revisá los tips.');
    } else {
      console.log('   🚨 Mucho por mejorar. Estudiá bien antes de la entrevista.');
    }
    
    console.log('\n   💡 Tip: Practicá con alguien que te haga las preguntas.');
    console.log('   📖 Leé los tips completos con: node interview-prep.js --tips\n');
  }
  
  rl.close();
}

// Main function
async function main() {
  const args = parseArgs();
  
  // Show tips
  if (args.tips) {
    const tips = loadTips();
    if (tips) {
      console.log(tips);
    } else {
      console.log('❌ No se encontró el archivo de tips.');
    }
    return;
  }
  
  // Load questions
  const data = loadQuestions(args.visaType);
  
  // List mode
  if (args.list) {
    listQuestions(data, args.category);
    return;
  }
  
  // Simulation mode
  if (args.simulate) {
    await runSimulation(data, args.count, args.category);
    return;
  }
  
  // Default: show help
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         📋 VISABOT - Preparación de Entrevista                ║
╚════════════════════════════════════════════════════════════════╝

Uso:
  node interview-prep.js [opciones]

Opciones:
  --visa-type=TIPO    Tipo de visa (default: B1B2)
  --category=CAT      Categoría específica para practicar
  --list              Mostrar todas las preguntas
  --simulate          Modo simulacro interactivo
  --count=N           Número de preguntas en simulacro (default: 10)
  --tips              Mostrar consejos de entrevista

Ejemplos:
  node interview-prep.js --list
  node interview-prep.js --list --category=ties
  node interview-prep.js --simulate
  node interview-prep.js --simulate --count=5 --category=purpose
  node interview-prep.js --tips

Categorías disponibles:
${data.categories.map(c => `  - ${c.id}: ${c.name} (${c.questions.length} preguntas)`).join('\n')}

Total de preguntas: ${data.totalQuestions}
`);
}

main().catch(console.error);
