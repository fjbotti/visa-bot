#!/usr/bin/env node
/**
 * Steel.dev + Playwright test v2 — handles security checkpoints
 */

const { chromium } = require('playwright');
const fs = require('fs');

const STEEL_API_KEY = process.env.STEEL_API_KEY;
const [,, url, username, password] = process.argv;

if (!STEEL_API_KEY || !url) {
  console.error('Usage: STEEL_API_KEY=... node steel-test-v2.js <url> [username] [password]');
  process.exit(1);
}

const screenshotDir = '/tmp/visabot-screenshots';
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

async function main() {
  console.log('🔧 Creating Steel session...');

  const createRes = await fetch('https://api.steel.dev/v1/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'steel-api-key': STEEL_API_KEY,
    },
    body: JSON.stringify({
      useProxy: false,
      solveCaptcha: false,
      timeout: 300000,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    console.error('❌ Failed to create session:', createRes.status, err);
    process.exit(1);
  }

  const session = await createRes.json();
  console.log('✅ Session created:', session.id);
  console.log('👀 Live viewer:', session.sessionViewerUrl);

  let browser;
  try {
    console.log('🔌 Connecting Playwright...');
    browser = await chromium.connectOverCDP(
      `wss://connect.steel.dev?apiKey=${STEEL_API_KEY}&sessionId=${session.id}`
    );

    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();

    // Navigate
    console.log(`🌐 Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    let title = await page.title();
    console.log('📄 Page title:', title);

    // Wait for security checkpoint to resolve
    if (title.toLowerCase().includes('security') || title.toLowerCase().includes('checkpoint') || title.toLowerCase().includes('vercel')) {
      console.log('⏳ Security checkpoint detected, waiting up to 15s...');
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(1000);
        title = await page.title();
        const currentUrl = page.url();
        if (!title.toLowerCase().includes('security') && !title.toLowerCase().includes('checkpoint')) {
          console.log(`✅ Checkpoint passed after ${i+1}s`);
          console.log('📄 Page title:', title);
          break;
        }
        if (i === 14) console.log('⚠️ Checkpoint did not resolve in 15s');
      }
    }

    const ts = Date.now();
    await page.screenshot({ path: `${screenshotDir}/page-${ts}.png`, fullPage: true });
    console.log(`📸 Screenshot: ${screenshotDir}/page-${ts}.png`);

    // Try login if credentials provided
    if (username && password) {
      console.log('🔑 Attempting login...');

      // Wait a bit for JS to load
      await page.waitForTimeout(2000);

      const emailSelectors = [
        'input[type="email"]', 'input[name="email"]', 'input[name="username"]',
        'input[name="user"]', 'input[name="login"]', 'input[id="email"]',
        'input[id="username"]', '#signInName', 'input[placeholder*="email" i]',
        'input[placeholder*="user" i]', 'input[placeholder*="correo" i]',
        'input[autocomplete="email"]', 'input[autocomplete="username"]',
      ];

      const passwordSelectors = [
        'input[type="password"]', 'input[name="password"]', '#password',
      ];

      let emailField = null;
      for (const sel of emailSelectors) {
        emailField = await page.$(sel);
        if (emailField) { console.log(`  Found email field: ${sel}`); break; }
      }

      let passwordField = null;
      for (const sel of passwordSelectors) {
        passwordField = await page.$(sel);
        if (passwordField) { console.log(`  Found password field: ${sel}`); break; }
      }

      if (emailField) {
        await emailField.click();
        await page.waitForTimeout(300);
        await emailField.fill(username);
        console.log('  ✅ Username filled');
      } else {
        console.log('  ⚠️ No email/username field found on page');
        // Dump visible input fields for debugging
        const inputs = await page.$$eval('input', els => els.map(e => ({
          type: e.type, name: e.name, id: e.id, placeholder: e.placeholder, visible: e.offsetParent !== null
        })));
        console.log('  📋 Input fields found:', JSON.stringify(inputs, null, 2));
      }

      if (passwordField) {
        await passwordField.click();
        await page.waitForTimeout(300);
        await passwordField.fill(password);
        console.log('  ✅ Password filled');
      }

      if (emailField || passwordField) {
        const submitSelectors = [
          'button[type="submit"]', 'input[type="submit"]',
          'button:has-text("Sign in")', 'button:has-text("Log in")',
          'button:has-text("Login")', 'button:has-text("Iniciar")',
          'button:has-text("Entrar")', 'button:has-text("Enter")',
          'button:has-text("Continue")', 'button:has-text("Continuar")',
        ];

        let submitted = false;
        for (const sel of submitSelectors) {
          try {
            const btn = await page.$(sel);
            if (btn && await btn.isVisible()) {
              await btn.click();
              console.log(`  🔘 Clicked: ${sel}`);
              submitted = true;
              break;
            }
          } catch (e) { /* next */ }
        }
        if (!submitted) {
          await page.keyboard.press('Enter');
          console.log('  ⏎ Pressed Enter');
        }

        // Wait for navigation
        console.log('  ⏳ Waiting for response...');
        await page.waitForTimeout(5000);
        console.log('📄 Page title after login:', await page.title());
        console.log('🔗 URL after login:', page.url());

        await page.screenshot({ path: `${screenshotDir}/after-login-${ts}.png`, fullPage: true });
        console.log(`📸 Screenshot: ${screenshotDir}/after-login-${ts}.png`);
      }
    }

    console.log('\n✅ Test complete!');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
    console.log('🧹 Releasing Steel session...');
    await fetch(`https://api.steel.dev/v1/sessions/${session.id}`, {
      method: 'DELETE',
      headers: { 'steel-api-key': STEEL_API_KEY },
    });
    console.log('✅ Session released');
  }
}

main();
