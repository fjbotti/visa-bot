#!/usr/bin/env node
/**
 * Steel Visa Appointment Checker
 *
 * Usage:
 *   STEEL_API_KEY=xxx node steel-visa-check.js --site <url> --username <email> --password <pass> --action <check|book> [--date YYYY-MM-DD]
 *
 * Actions:
 *   check — log in and look for available appointment dates
 *   book  — log in and attempt to book a specific date (requires --date)
 *
 * Output: JSON to stdout  { ok, dates[], screenshot, error? }
 */

const Steel = require('steel-sdk').default;
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    opts[key] = args[i + 1];
  }
  if (!opts.site || !opts.username || !opts.password || !opts.action) {
    console.error('Required: --site --username --password --action (check|book)');
    process.exit(1);
  }
  return opts;
}

// ---------------------------------------------------------------------------
// Site-specific handlers
// ---------------------------------------------------------------------------

const handlers = {
  // US visa appointments
  'ais.usvisa-info.com': {
    loginUrl: (site) => `https://${site}/en-ar/niv/users/sign_in`, // default to Argentina, adjust country code as needed
    async login(page, username, password) {
      await page.fill('input[name="user[email]"]', username);
      await page.fill('input[name="user[password]"]', password);
      await page.click('input[type="submit"], button[type="submit"]');
      await page.waitForTimeout(5000);
    },
    async checkDates(page) {
      // Navigate to appointment scheduling
      try {
        await page.click('text=Continue', { timeout: 5000 }).catch(() => {});
        await page.click('text=Schedule Appointment', { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(3000);

        // Look for available dates in the calendar
        const dates = await page.$$eval('.ui-datepicker td:not(.ui-state-disabled) a', els =>
          els.map(el => el.textContent.trim())
        ).catch(() => []);

        return dates;
      } catch {
        return [];
      }
    }
  },

  // VFS Global
  'vfsglobal.com': {
    loginUrl: (site) => `https://visa.${site}/global-visa/`,
    async login(page, username, password) {
      await page.fill('input[type="email"], input[name="email"]', username);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"], input[type="submit"]');
      await page.waitForTimeout(5000);
    },
    async checkDates(page) {
      const dates = await page.$$eval('[class*="date"][class*="available"], .slot-available', els =>
        els.map(el => el.textContent.trim())
      ).catch(() => []);
      return dates;
    }
  },

  // TLS Contact
  'tlscontact.com': {
    loginUrl: (site) => `https://visas-de.${site}/appointment/gb/gbLON2de/`, // adjust per country
    async login(page, username, password) {
      await page.fill('input[name="email"], input[type="email"]', username);
      await page.fill('input[name="password"], input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
    },
    async checkDates(page) {
      const dates = await page.$$eval('.calendar-day.available, .tls-date-available', els =>
        els.map(el => el.getAttribute('data-date') || el.textContent.trim())
      ).catch(() => []);
      return dates;
    }
  },

  // BLS International
  'blsinternational.com': {
    loginUrl: (site) => `https://www.${site}/`,
    async login(page, username, password) {
      await page.fill('input[name="email"], input[type="email"]', username);
      await page.fill('input[name="password"], input[type="password"]', password);
      await page.click('button[type="submit"], input[type="submit"]');
      await page.waitForTimeout(5000);
    },
    async checkDates(page) {
      const dates = await page.$$eval('.available-date, .date-slot:not(.disabled)', els =>
        els.map(el => el.textContent.trim())
      ).catch(() => []);
      return dates;
    }
  },

  // Italian consulate
  'prenotami.esteri.it': {
    loginUrl: () => 'https://prenotami.esteri.it/',
    async login(page, username, password) {
      await page.fill('#login-email', username);
      await page.fill('#login-password', password);
      await page.click('#login-form button[type="submit"]');
      await page.waitForTimeout(5000);
    },
    async checkDates(page) {
      // Navigate to booking
      await page.click('text=Prenota', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(3000);
      const dates = await page.$$eval('.day:not(.disabled):not(.unavailable)', els =>
        els.map(el => el.textContent.trim())
      ).catch(() => []);
      return dates;
    }
  }
};

// Fallback generic handler
const genericHandler = {
  loginUrl: (site) => `https://${site}`,
  async login(page, username, password) {
    // Try common selectors
    await page.fill('input[type="email"], input[name="email"], input[name="username"]', username).catch(() => {});
    await page.fill('input[type="password"]', password).catch(() => {});
    await page.click('button[type="submit"], input[type="submit"]').catch(() => {});
    await page.waitForTimeout(5000);
  },
  async checkDates(page) {
    return [];
  }
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const opts = parseArgs();
  const apiKey = process.env.STEEL_API_KEY;
  if (!apiKey) {
    console.error('Set STEEL_API_KEY env var');
    process.exit(1);
  }

  const screenshotDir = '/tmp/visabot-screenshots';
  fs.mkdirSync(screenshotDir, { recursive: true });

  const client = new Steel({ steelAPIKey: apiKey });
  const result = { ok: false, dates: [], screenshot: null, sessionViewerUrl: null, error: null };

  let session;
  try {
    session = await client.sessions.create({
      useProxy: false,
      solveCaptcha: false,
      apiTimeout: 300000,
    });
    result.sessionViewerUrl = session.sessionViewerUrl;
    console.error(`Session: ${session.id}`);
    console.error(`Viewer: ${session.sessionViewerUrl}`);

    const browser = await chromium.connectOverCDP(
      `wss://connect.steel.dev?apiKey=${apiKey}&sessionId=${session.id}`
    );

    try {
      const context = browser.contexts()[0];
      const page = context.pages()[0] || await context.newPage();

      // Pick handler
      const siteKey = Object.keys(handlers).find(k => opts.site.includes(k));
      const handler = siteKey ? handlers[siteKey] : genericHandler;

      // Navigate
      const loginUrl = handler.loginUrl(opts.site);
      console.error(`Navigating to: ${loginUrl}`);
      await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3000);

      // Login
      console.error('Logging in...');
      await handler.login(page, opts.username, opts.password);

      // Screenshot after login
      const ssLogin = path.join(screenshotDir, `${opts.site.replace(/[^a-z0-9]/gi, '_')}-login-${Date.now()}.png`);
      await page.screenshot({ path: ssLogin, fullPage: true });
      console.error(`Screenshot: ${ssLogin}`);

      if (opts.action === 'check') {
        console.error('Checking available dates...');
        result.dates = await handler.checkDates(page);
        result.ok = true;
      } else if (opts.action === 'book' && opts.date) {
        console.error(`Booking date: ${opts.date}`);
        // Booking is highly site-specific; check dates first then click
        result.dates = await handler.checkDates(page);
        if (result.dates.length > 0) {
          // Attempt to click the target date
          await page.click(`text=${opts.date}`, { timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(2000);
          await page.click('button:has-text("Confirm"), button:has-text("Submit"), button:has-text("Book")', { timeout: 5000 }).catch(() => {});
          result.ok = true;
        } else {
          result.error = 'No available dates found to book';
        }
      }

      // Final screenshot
      const ssFinal = path.join(screenshotDir, `${opts.site.replace(/[^a-z0-9]/gi, '_')}-final-${Date.now()}.png`);
      await page.screenshot({ path: ssFinal, fullPage: true });
      result.screenshot = ssFinal;

      await browser.close();
    } catch (e) {
      result.error = e.message;
    }
  } catch (e) {
    result.error = e.message;
  } finally {
    if (session) {
      await client.sessions.release(session.id).catch(() => {});
      console.error('Session released');
    }
  }

  // Output JSON to stdout
  console.log(JSON.stringify(result, null, 2));
}

main().catch(e => {
  console.log(JSON.stringify({ ok: false, error: e.message }));
  process.exit(1);
});
