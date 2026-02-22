/**
 * Prenotami Login via Browserbase + AR Proxy
 * 
 * VERIFIED WORKING: 2026-02-22
 * 
 * Key: solveCaptchas MUST be false — the solver interferes with
 * native reCAPTCHA Enterprise, causing low scores.
 * AR residential proxy required for good reCAPTCHA score.
 * 
 * Usage:
 *   node bb-prenotami-login.js <email> <password>
 */

const { chromium } = require('playwright');
const fs = require('fs');

const BB_KEY_PATH = '/home/clawd/.config/secrets/browserbase_api_key';
const SCREENSHOT_DIR = '/tmp/visabot-screenshots';

async function createSession(apiKey) {
  const res = await fetch('https://www.browserbase.com/v1/sessions', {
    method: 'POST',
    headers: { 'x-bb-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      browserSettings: { solveCaptchas: false }, // CRITICAL: must be false
      proxies: [{ type: 'browserbase', geolocation: { country: 'AR' } }],
    }),
  });
  return res.json();
}

async function releaseSession(apiKey, sessionId) {
  await fetch(`https://www.browserbase.com/v1/sessions/${sessionId}`, {
    method: 'POST',
    headers: { 'x-bb-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'REQUEST_RELEASE' }),
  });
}

async function loginPrenotami(email, password) {
  const apiKey = fs.readFileSync(BB_KEY_PATH, 'utf8').trim();
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const session = await createSession(apiKey);
  if (!session.connectUrl) {
    console.error('❌ Failed to create session:', JSON.stringify(session));
    return { success: false, error: 'session_create_failed' };
  }
  console.log('✅ Session:', session.id);

  const browser = await chromium.connectOverCDP(session.connectUrl);
  const page = browser.contexts()[0].pages()[0]; // MUST use existing page

  try {
    // Navigate
    await page.goto('https://prenotami.esteri.it', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(5000);
    console.log('📄', await page.title());

    // Fill credentials with human-like delays
    const emailInput = await page.$('#login-email');
    const passInput = await page.$('#login-password');
    if (!emailInput || !passInput) {
      throw new Error('Login form not found');
    }

    await emailInput.type(email, { delay: 100 });
    await page.waitForTimeout(1000);
    await passInput.type(password, { delay: 100 });
    await page.waitForTimeout(2000);
    console.log('✅ Credentials filled');

    // Mouse movements to improve reCAPTCHA score
    await page.mouse.move(300, 400);
    await page.waitForTimeout(500);
    await page.mouse.move(500, 300);
    await page.waitForTimeout(1000);

    // Click the submit button (NOT form.submit, NOT Enter)
    // #captcha-trigger calls getCaptchaToken() which runs
    // grecaptcha.enterprise.execute() natively
    console.log('🔘 Clicking Avanti...');
    await page.click('#captcha-trigger');

    // Wait for login to complete
    await page.waitForTimeout(15000);

    const url = page.url();
    const title = await page.title().catch(() => 'unknown');
    const ts = Date.now();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/prenotami-${ts}.png`,
      fullPage: true,
    });

    if (url.includes('UserArea') || url.includes('Services')) {
      console.log('🎉 LOGGED IN!', url);

      // Extract cookies for reuse
      const cookies = await browser.contexts()[0].cookies('https://prenotami.esteri.it');
      console.log('🍪 Cookies:', cookies.length);

      return {
        success: true,
        url,
        cookies,
        page,
        browser,
        session,
        releaseSession: () => releaseSession(apiKey, session.id),
      };
    } else {
      console.log('❌ Login failed:', title, '|', url);
      await browser.close().catch(() => {});
      await releaseSession(apiKey, session.id);
      return { success: false, error: url };
    }
  } catch (e) {
    console.error('❌', e.message);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/prenotami-error-${Date.now()}.png`,
    }).catch(() => {});
    await browser.close().catch(() => {});
    await releaseSession(apiKey, session.id);
    return { success: false, error: e.message };
  }
}

// CLI usage
if (require.main === module) {
  const [, , email, password] = process.argv;
  if (!email || !password) {
    console.log('Usage: node bb-prenotami-login.js <email> <password>');
    process.exit(1);
  }

  loginPrenotami(email, password).then(async (result) => {
    if (result.success) {
      console.log('\n✅ Login successful!');
      console.log('🍪 Session cookies saved');
      // Clean up if running standalone
      if (result.browser) await result.browser.close().catch(() => {});
      if (result.releaseSession) await result.releaseSession();
    } else {
      console.log('\n❌ Login failed:', result.error);
    }
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { loginPrenotami };
