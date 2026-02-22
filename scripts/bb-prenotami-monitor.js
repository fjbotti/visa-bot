/**
 * Prenotami Auto-Monitor & Booker
 * 
 * Checks for available slots and AUTOMATICALLY books when found.
 * Notifies user AFTER booking is confirmed.
 * 
 * Usage:
 *   node bb-prenotami-monitor.js <email> <password> <serviceId> [--once]
 * 
 * Example:
 *   node bb-prenotami-monitor.js fbotti@gmail.com Pass123 224          # Monitor continuously
 *   node bb-prenotami-monitor.js fbotti@gmail.com Pass123 224 --once   # Check once
 * 
 * Service IDs (Buenos Aires consulate):
 *   224 = Cittadinanza per discendenza (Citizenship by descent)
 *   225 = Servizi Consolari - Notarile
 *   227 = Servizi Consolari - Studi
 *   228 = Vice Consolato San Isidro
 *   229 = Stato civile - Tres de Febrero
 *   230 = Stato civile - Zarate
 *   231 = Stato civile - Merlo
 *   233 = Legalizzazioni per Naturalizzazione
 *   234 = Conformità di traduzioni
 *   575 = Ufficio Pensioni
 */

const { chromium } = require('playwright');
const fs = require('fs');

const BB_KEY_PATH = '/home/clawd/.config/secrets/browserbase_api_key';
const SCREENSHOT_DIR = '/tmp/visabot-screenshots';
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const MAX_LOGIN_RETRIES = 5;

function log(msg) {
  console.log(`[${new Date().toISOString()}]`, msg);
}

function getBBKey() {
  return fs.readFileSync(BB_KEY_PATH, 'utf8').trim();
}

async function createSession(apiKey) {
  const res = await fetch('https://www.browserbase.com/v1/sessions', {
    method: 'POST',
    headers: { 'x-bb-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      browserSettings: { solveCaptchas: false },
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
  }).catch(() => {});
}

async function humanDelay(min = 300, max = 800) {
  await new Promise(r => setTimeout(r, min + Math.random() * (max - min)));
}

async function loginWithRetry(apiKey, email, password) {
  for (let i = 1; i <= MAX_LOGIN_RETRIES; i++) {
    log(`🔄 Login attempt ${i}/${MAX_LOGIN_RETRIES}`);
    
    const session = await createSession(apiKey);
    if (!session.connectUrl) {
      log('❌ Session creation failed');
      continue;
    }

    const browser = await chromium.connectOverCDP(session.connectUrl);
    const page = browser.contexts()[0].pages()[0];

    try {
      await page.goto('https://prenotami.esteri.it', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await page.waitForTimeout(4000 + Math.random() * 2000);

      // Human-like mouse movements
      for (let m = 0; m < 3 + Math.floor(Math.random() * 3); m++) {
        await page.mouse.move(
          100 + Math.random() * 500,
          100 + Math.random() * 400
        );
        await humanDelay(200, 600);
      }

      // Fill email
      await (await page.$('#login-email')).click();
      await humanDelay(300, 600);
      await page.keyboard.type(email, { delay: 80 + Math.random() * 60 });
      await humanDelay(800, 1500);

      // Fill password
      await (await page.$('#login-password')).click();
      await humanDelay(300, 600);
      await page.keyboard.type(password, { delay: 80 + Math.random() * 60 });
      await humanDelay(2000, 4000);

      // More mouse movement before submit
      await page.mouse.move(
        200 + Math.random() * 300,
        350 + Math.random() * 150
      );
      await humanDelay(500, 1200);

      await page.click('#captcha-trigger');
      await page.waitForTimeout(15000);

      const url = page.url();
      if (url.includes('UserArea') || url.includes('Services')) {
        log(`🎉 Logged in on attempt ${i}`);
        return { page, browser, session };
      }

      log(`❌ Login attempt ${i} failed (${url.substring(0, 60)})`);
    } catch (e) {
      log(`❌ Error on attempt ${i}: ${e.message}`);
    }

    await browser.close().catch(() => {});
    await releaseSession(apiKey, session.id);

    if (i < MAX_LOGIN_RETRIES) {
      const wait = 3000 + Math.random() * 5000;
      log(`⏳ Waiting ${Math.round(wait / 1000)}s before retry...`);
      await new Promise(r => setTimeout(r, wait));
    }
  }

  return null;
}

async function checkAndBook(apiKey, email, password, serviceId) {
  const login = await loginWithRetry(apiKey, email, password);
  if (!login) {
    log('❌ All login attempts failed');
    return { status: 'login_failed' };
  }

  const { page, browser, session } = login;

  try {
    // Navigate to service booking page
    const bookingUrl = `https://prenotami.esteri.it/Services/Booking/${serviceId}`;
    log(`🔗 Checking ${bookingUrl}`);
    
    await page.goto(bookingUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(5000);

    const ts = Date.now();
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/monitor-${serviceId}-${ts}.png`,
      fullPage: true,
    });

    // Check if "esauriti" (exhausted/no slots) modal appeared
    const modalText = await page.evaluate(() => {
      const modal = document.querySelector('.jconfirm-box');
      return modal ? modal.textContent.trim() : '';
    });

    if (modalText.includes('esauriti') || modalText.includes('exhausted') || modalText.includes('agotados')) {
      log('😔 No slots available: ' + modalText.substring(0, 100));
      return { status: 'no_slots', message: modalText };
    }

    // If no "esauriti" modal, slots might be available!
    log('🎉🎉🎉 SLOTS MIGHT BE AVAILABLE!');
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/SLOTS-FOUND-${serviceId}-${ts}.png`,
      fullPage: true,
    });

    // Check for calendar/date picker
    const pageContent = await page.evaluate(() => document.body.innerText.substring(0, 3000));
    log('📝 Page content: ' + pageContent.substring(0, 500));

    // Look for date selection elements
    const hasCalendar = await page.$('.calendar, .datepicker, #calendar, [class*=calend], .flatpickr-calendar, input[type=date]');
    
    if (hasCalendar) {
      log('📅 Calendar found! Attempting to book...');
      
      // Try to select the first available date
      const availableDay = await page.$('td.day:not(.disabled):not(.old):not(.new), .available, td[data-date]:not(.disabled)');
      
      if (availableDay) {
        const dateText = await availableDay.textContent();
        log(`📅 Clicking available date: ${dateText}`);
        await availableDay.click();
        await page.waitForTimeout(3000);
        
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/DATE-SELECTED-${serviceId}-${ts}.png`,
          fullPage: true,
        });

        // Look for time slots
        const timeSlot = await page.$('select option:not([disabled]):not(:first-child), .time-slot:not(.disabled), input[type=radio]');
        if (timeSlot) {
          await timeSlot.click();
          log('⏰ Time slot selected');
          await page.waitForTimeout(2000);
        }

        // Look for confirm/submit button
        const confirmBtn = await page.$('button[type=submit], button:has-text("Conferma"), button:has-text("Prenota"), input[type=submit], .btn-primary');
        if (confirmBtn) {
          const btnText = await confirmBtn.textContent().catch(() => 'submit');
          log(`🔘 Clicking confirm: "${btnText.trim()}"`);
          await confirmBtn.click();
          await page.waitForTimeout(10000);

          await page.screenshot({
            path: `${SCREENSHOT_DIR}/BOOKED-${serviceId}-${ts}.png`,
            fullPage: true,
          });

          const finalContent = await page.evaluate(() => document.body.innerText.substring(0, 2000));
          log('📝 After booking: ' + finalContent.substring(0, 500));

          // Check for confirmation
          if (finalContent.includes('confermata') || finalContent.includes('confirmed') || 
              finalContent.includes('prenotazione') || finalContent.includes('appuntamento') ||
              page.url().includes('Reservation')) {
            log('🎉🎉🎉 BOOKING CONFIRMED! 🎉🎉🎉');
            return {
              status: 'booked',
              message: finalContent.substring(0, 500),
              screenshot: `${SCREENSHOT_DIR}/BOOKED-${serviceId}-${ts}.png`,
            };
          }
        }
      }

      // If we got here, calendar was shown but couldn't complete booking
      return {
        status: 'slots_found_booking_incomplete',
        message: pageContent.substring(0, 500),
        screenshot: `${SCREENSHOT_DIR}/SLOTS-FOUND-${serviceId}-${ts}.png`,
      };
    }

    // Check if maybe it's a form page (need to fill details before seeing calendar)
    const formFields = await page.$$('input:not([type=hidden]), select, textarea');
    if (formFields.length > 0) {
      log('📋 Form found with ' + formFields.length + ' fields — may need user data');
      return {
        status: 'form_found',
        message: pageContent.substring(0, 500),
        screenshot: `${SCREENSHOT_DIR}/SLOTS-FOUND-${serviceId}-${ts}.png`,
      };
    }

    // Unknown state
    return {
      status: 'unknown',
      message: pageContent.substring(0, 500),
      screenshot: `${SCREENSHOT_DIR}/monitor-${serviceId}-${ts}.png`,
    };

  } catch (e) {
    log(`❌ Error: ${e.message}`);
    return { status: 'error', message: e.message };
  } finally {
    await browser.close().catch(() => {});
    await releaseSession(apiKey, session.id);
    log('🧹 Session released');
  }
}

async function monitor(email, password, serviceId, once = false) {
  const apiKey = getBBKey();
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  log(`🚀 Starting monitor for service ${serviceId}`);
  log(`📧 User: ${email}`);
  log(`🔄 Mode: ${once ? 'single check' : `continuous (every ${CHECK_INTERVAL_MS / 60000} min)`}`);

  while (true) {
    const result = await checkAndBook(apiKey, email, password, serviceId);
    log(`📊 Result: ${result.status}`);

    if (result.status === 'booked') {
      log('🎉 APPOINTMENT BOOKED SUCCESSFULLY!');
      log('📝 ' + result.message);
      // TODO: Send Telegram notification to user
      break;
    }

    if (result.status === 'slots_found_booking_incomplete' || result.status === 'form_found') {
      log('⚠️ SLOTS AVAILABLE but could not auto-book. Manual intervention needed.');
      log('📝 ' + result.message);
      // TODO: Send urgent Telegram notification
      break;
    }

    if (once) {
      log('✅ Single check complete');
      break;
    }

    // Add jitter to avoid pattern detection
    const jitter = Math.random() * 10 * 60 * 1000; // 0-10 min jitter
    const nextCheck = CHECK_INTERVAL_MS + jitter;
    log(`⏳ Next check in ${Math.round(nextCheck / 60000)} minutes`);
    await new Promise(r => setTimeout(r, nextCheck));
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const once = args.includes('--once');
  const filtered = args.filter(a => a !== '--once');
  const [email, password, serviceId] = filtered;

  if (!email || !password || !serviceId) {
    console.log('Usage: node bb-prenotami-monitor.js <email> <password> <serviceId> [--once]');
    console.log('');
    console.log('Service IDs (Buenos Aires):');
    console.log('  224 = Cittadinanza per discendenza');
    console.log('  225 = Servizi Consolari - Notarile');
    console.log('  227 = Studi');
    console.log('  228 = Vice Consolato San Isidro');
    process.exit(1);
  }

  monitor(email, password, serviceId, once).then(() => process.exit(0)).catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
  });
}

module.exports = { checkAndBook, loginWithRetry, monitor };
