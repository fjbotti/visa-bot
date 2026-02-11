#!/usr/bin/env node
/**
 * Check Steel Cloud configuration and connectivity
 * 
 * Usage: node check-steel.js
 * 
 * Exit codes:
 *   0 - Steel configured and working
 *   1 - Steel not configured (missing API key)
 *   2 - Steel connection error
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Try to load Steel API key from multiple locations
function getApiKey() {
  const locations = [
    process.env.STEEL_API_KEY,
    path.join(process.env.HOME, '.config/secrets/steel_api_key'),
    path.join(process.env.HOME, '.steel/api_key'),
  ];

  for (const loc of locations) {
    if (typeof loc === 'string' && !loc.includes('/')) {
      // It's an env var value
      if (loc && loc.length > 10) return loc;
    } else if (typeof loc === 'string') {
      // It's a file path
      try {
        const key = fs.readFileSync(loc, 'utf-8').trim();
        if (key && key.length > 10) return key;
      } catch (e) {
        // File not found, continue
      }
    }
  }
  return null;
}

async function checkSteelConnection(apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.steel.dev',
      port: 443,
      path: '/v1/sessions',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 401) {
          // 401 means key is invalid but connection works
          resolve({ connected: true, authorized: res.statusCode === 200, data });
        } else {
          resolve({ connected: true, authorized: false, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Connection timeout'));
    });

    req.end();
  });
}

async function main() {
  console.log('🔍 Checking Steel Cloud configuration...\n');

  // Check API key
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.log('❌ STEEL_NOT_CONFIGURED');
    console.log('\nSteel API key not found. Checked:');
    console.log('  - Environment variable: STEEL_API_KEY');
    console.log('  - File: ~/.config/secrets/steel_api_key');
    console.log('  - File: ~/.steel/api_key');
    console.log('\nTo configure Steel:');
    console.log('  1. Get an API key from https://steel.dev');
    console.log('  2. Save it to ~/.config/secrets/steel_api_key');
    console.log('  3. Or set STEEL_API_KEY environment variable');
    process.exit(1);
  }

  console.log('✅ API key found');
  console.log(`   Key prefix: ${apiKey.substring(0, 8)}...`);

  // Check connection
  try {
    console.log('\n🌐 Testing connection to Steel Cloud...');
    const result = await checkSteelConnection(apiKey);
    
    if (result.connected && result.authorized) {
      console.log('✅ STEEL_CONFIGURED');
      console.log('\nSteel Cloud is ready to use!');
      console.log('  - Connection: OK');
      console.log('  - Authorization: OK');
      process.exit(0);
    } else if (result.connected && !result.authorized) {
      console.log('⚠️ STEEL_AUTH_ERROR');
      console.log('\nConnection works but API key may be invalid.');
      console.log('Please verify your API key at https://steel.dev');
      process.exit(2);
    }
  } catch (error) {
    console.log('❌ STEEL_CONNECTION_ERROR');
    console.log(`\nCould not connect to Steel Cloud: ${error.message}`);
    process.exit(2);
  }
}

main().catch(console.error);
