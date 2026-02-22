#!/usr/bin/env node
const { chromium } = require('playwright');
const fs = require('fs');

const [,, url, username, password] = process.argv;
if (!url) { console.error('Usage: node local-test.js <url> [user] [pass]'); process.exit(1); }

const dir = '/tmp/visabot-screenshots';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function main() {
  console.log('🚀 Launching local browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const ts = Date.now();

  try {
    console.log(`🌐 ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('📄', await page.title());
    await page.screenshot({ path: `${dir}/local-before-${ts}.png`, fullPage: true });

    if (username && password) {
      await page.waitForTimeout(2000);

      // Find & fill email
      const emailSel = ['input[type="email"]','input[name="email"]','input[name="username"]','input[id="email"]','input[placeholder*="email" i]','input[placeholder*="mail" i]','input[autocomplete="email"]'];
      for (const s of emailSel) {
        const el = await page.$(s);
        if (el && await el.isVisible()) { await el.fill(username); console.log(`✅ Email: ${s}`); break; }
      }

      // Find & fill password
      const pwSel = ['input[type="password"]','input[name="password"]','#password'];
      for (const s of pwSel) {
        const el = await page.$(s);
        if (el && await el.isVisible()) { await el.fill(password); console.log(`✅ Pass: ${s}`); break; }
      }

      // Submit
      const btnSel = ['button[type="submit"]','input[type="submit"]','button:has-text("Sign in")','button:has-text("Log in")','button:has-text("Iniciar")','button:has-text("Entrar")','button:has-text("Login")','button:has-text("Continue")'];
      let clicked = false;
      for (const s of btnSel) {
        try {
          const btn = await page.$(s);
          if (btn && await btn.isVisible()) { await btn.click(); console.log(`🔘 Click: ${s}`); clicked = true; break; }
        } catch(e) {}
      }
      if (!clicked) { await page.keyboard.press('Enter'); console.log('⏎ Enter'); }

      await page.waitForTimeout(5000);
      console.log('📄 After login:', await page.title());
      console.log('🔗', page.url());
      await page.screenshot({ path: `${dir}/local-after-${ts}.png`, fullPage: true });
    }

    console.log('✅ Done!');
  } catch(e) {
    console.error('❌', e.message);
    await page.screenshot({ path: `${dir}/local-error-${ts}.png` }).catch(()=>{});
  } finally {
    await browser.close();
  }
}
main();
