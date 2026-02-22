const { chromium } = require('playwright');
const fs = require('fs');
const dir = '/tmp/visabot-screenshots';
const BB_KEY = fs.readFileSync('/home/clawd/.config/secrets/browserbase_api_key', 'utf8').trim();

const [,, site] = process.argv; // 'tarifar' or 'prenotami'

async function createSession() {
  const res = await fetch('https://www.browserbase.com/v1/sessions', {
    method: 'POST',
    headers: { 'x-bb-api-key': BB_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ browserSettings: { solveCaptchas: true } }),
  });
  return res.json();
}

async function releaseSession(id) {
  await fetch(`https://www.browserbase.com/v1/sessions/${id}`, {
    method: 'POST',
    headers: { 'x-bb-api-key': BB_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'REQUEST_RELEASE' }),
  });
}

async function testTarifar(page) {
  console.log('🌐 app.tarifar.com...');
  await page.goto('https://app.tarifar.com', { waitUntil: 'commit', timeout: 60000 });

  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(2000);
    const title = await page.title();
    if (i % 3 === 0) console.log(`[${i*2}s]`, title);
    if (!title.includes('Security') && !title.includes('Checkpoint') && !title.includes('Vercel') && title.length > 3) {
      console.log(`🎉 PASSED after ${i*2}s!`);
      break;
    }
    if (i === 24) console.log('⚠️ Blocked after 50s');
  }

  const ts = Date.now();
  await page.screenshot({ path: `${dir}/bb-tarifar-${ts}.png`, fullPage: true });
  console.log('📄', await page.title(), '|', page.url());

  const email = await page.$('input[type="email"], input[name="email"]');
  if (email) {
    console.log('🔑 Login found!');
    await email.type('fbotti@gmail.com', { delay: 60 });
    const pass = await page.$('input[type="password"]');
    if (pass) await pass.type('23qwe99', { delay: 60 });
    const btn = await page.$('button[type="submit"]');
    if (btn) await btn.click(); else await page.keyboard.press('Enter');
    await page.waitForTimeout(8000);
    await page.screenshot({ path: `${dir}/bb-tarifar-after-${ts}.png`, fullPage: true });
    console.log('📄 After:', await page.title(), '|', page.url());
    const text = await page.evaluate(() => document.body.innerText.substring(0, 300));
    console.log('📝', text.substring(0, 200));
  }
}

async function testPrenotami(page) {
  console.log('🌐 prenotami.esteri.it...');
  await page.goto('https://prenotami.esteri.it', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  console.log('📄', await page.title());

  await (await page.$('#login-email')).type('fbotti@gmail.com', { delay: 80 });
  await page.waitForTimeout(1000);
  await (await page.$('#login-password')).type('FedeItaliano2026', { delay: 80 });
  console.log('✅ Credentials filled');
  await page.waitForTimeout(2000);

  console.log('🔘 Clicking #captcha-trigger...');
  await page.click('#captcha-trigger');

  console.log('⏳ Waiting for login...');
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(2000);
    const url = page.url();
    const title = await page.title();
    if (i % 3 === 0) console.log(`[${i*2}s]`, title.substring(0, 50), '|', url.substring(0, 60));
    if (url.includes('UserArea') || url.includes('Services')) {
      console.log('🎉🎉🎉 LOGGED IN! 🎉🎉🎉');
      break;
    }
    if (url.includes('Error') && i > 3) { console.log('❌ Error page'); break; }
  }

  const ts = Date.now();
  await page.screenshot({ path: `${dir}/bb-prenotami-${ts}.png`, fullPage: true });
  console.log('📄', await page.title(), '|', page.url());

  if (!page.url().includes('Error')) {
    const text = await page.evaluate(() => document.body.innerText.substring(0, 600));
    console.log('📝', text.substring(0, 400));
  }
}

async function main() {
  const session = await createSession();
  console.log('✅ BB Session:', session.id);

  const browser = await chromium.connectOverCDP(session.connectUrl);
  const page = browser.contexts()[0].pages()[0];

  try {
    if (site === 'tarifar') await testTarifar(page);
    else if (site === 'prenotami') await testPrenotami(page);
    else console.log('Usage: node bb-test.js tarifar|prenotami');
  } catch (e) {
    console.error('❌', e.message);
    await page.screenshot({ path: `${dir}/bb-error-${Date.now()}.png` }).catch(() => {});
  } finally {
    await browser.close().catch(() => {});
    await releaseSession(session.id);
    console.log('🧹 Released');
  }
}

main();
