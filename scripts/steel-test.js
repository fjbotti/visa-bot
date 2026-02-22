#!/usr/bin/env node
/**
 * Steel.dev + Playwright test — login to a site with credentials
 * Usage: STEEL_API_KEY=... node steel-test.js <url> <username> <password>
 */

const { chromium } = require('playwright');

const STEEL_API_KEY = process.env.STEEL_API_KEY;
const [,, url, username, password] = process.argv;

if (!STEEL_API_KEY || !url) {
  console.error('Usage: STEEL_API_KEY=... node steel-test.js <url> [username] [password]');
  process.exit(1);
}

async function main() {
  console.log('🔧 Creating Steel session...');

  // Create session via REST API
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
    // Connect Playwright via CDP
    console.log('🔌 Connecting Playwright...');
    browser = await chromium.connectOverCDP(
      `wss://connect.steel.dev?apiKey=${STEEL_API_KEY}&sessionId=${session.id}`
    );

    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();

    // Navigate to URL
    console.log(`🌐 Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('📄 Page title:', await page.title());

    // Screenshot before login
    const screenshotDir = '/tmp/visabot-screenshots';
    const fs = require('fs');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

    const ts = Date.now();
    await page.screenshot({ path: `${screenshotDir}/before-login-${ts}.png`, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotDir}/before-login-${ts}.png`);

    // If credentials provided, try to find and fill login fields
    if (username && password) {
      console.log('🔑 Attempting login...');

      // Common selectors for login forms
      const emailSelectors = [
        'input[type="email"]',
        'input[name="email"]',
        'input[name="username"]',
        'input[name="user"]',
        'input[name="login"]',
        'input[id="email"]',
        'input[id="username"]',
        'input[id="login"]',
        '#signInName',
        'input[placeholder*="email" i]',
        'input[placeholder*="user" i]',
      ];

      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[name="passwd"]',
        '#password',
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
        await emailField.fill(username);
        console.log('  ✅ Username filled');
      } else {
        console.log('  ⚠️ No email/username field found');
      }

      if (passwordField) {
        await passwordField.click();
        await passwordField.fill(password);
        console.log('  ✅ Password filled');
      } else {
        console.log('  ⚠️ No password field found');
      }

      // Try to find and click submit button
      if (emailField || passwordField) {
        const submitSelectors = [
          'button[type="submit"]',
          'input[type="submit"]',
          'button:has-text("Sign in")',
          'button:has-text("Log in")',
          'button:has-text("Login")',
          'button:has-text("Enter")',
          'button:has-text("Entrar")',
          'button:has-text("Iniciar")',
          '#next',
        ];

        let submitted = false;
        for (const sel of submitSelectors) {
          try {
            const btn = await page.$(sel);
            if (btn) {
              await btn.click();
              console.log(`  🔘 Clicked submit: ${sel}`);
              submitted = true;
              break;
            }
          } catch (e) { /* try next */ }
        }

        if (!submitted) {
          // Try pressing Enter
          await page.keyboard.press('Enter');
          console.log('  ⏎ Pressed Enter');
        }

        // Wait for navigation
        await page.waitForTimeout(5000);
        console.log('📄 Page title after login:', await page.title());

        // Screenshot after login
        await page.screenshot({ path: `${screenshotDir}/after-login-${ts}.png`, fullPage: true });
        console.log(`📸 Screenshot saved: ${screenshotDir}/after-login-${ts}.png`);
      }
    }

    // Print page info
    const pageUrl = page.url();
    console.log('🔗 Current URL:', pageUrl);
    console.log('\n✅ Test complete!');
    console.log(`📁 Screenshots in: ${screenshotDir}/`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (browser) await browser.close().catch(() => {});

    // Release Steel session
    console.log('🧹 Releasing Steel session...');
    await fetch(`https://api.steel.dev/v1/sessions/${session.id}`, {
      method: 'DELETE',
      headers: { 'steel-api-key': STEEL_API_KEY },
    });
    console.log('✅ Session released');
  }
}

main();
