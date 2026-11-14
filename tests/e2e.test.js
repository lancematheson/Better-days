// End-to-end test on an iPhone-sized screen: setup, a full check-in, saving, reload,
// planner, compare, history, settings and offline tips. Run: node tests/e2e.test.js (needs Playwright).
const { chromium, devices } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let f = decodeURIComponent(req.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html';
  const fp = path.join(ROOT, f); if (!fp.startsWith(ROOT) || !fs.existsSync(fp)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(fp)] || 'application/octet-stream' }); fs.createReadStream(fp).pipe(res);
}).listen(8766);
const SHOTS = path.join(ROOT, 'tests', 'screenshots'); fs.mkdirSync(SHOTS, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const log = (...a) => console.log(...a);
  const btn = (name) => p.getByRole('navigation', { name: 'Pages' }).getByRole('button', { name, exact: true });
  await p.goto('http://localhost:8766/'); await p.waitForTimeout(400);
  await p.screenshot({ path: SHOTS + '/01-setup.png' });
  log('setup visible:', await p.getByRole('heading', { name: 'Welcome to Better Days' }).isVisible());
  // setup
  for (let i = 0; i < 4; i++) { const c = p.getByRole('button', { name: /Continue|Start Using/ }); await c.click(); await p.waitForTimeout(120); if (i === 0) {} }
  await p.getByRole('button', { name: 'Start Using the App' }).click(); await p.waitForTimeout(200);
  await p.screenshot({ path: SHOTS + '/02-summary-empty.png' });
  log('welcome card:', await p.getByText('Welcome to Better Days').isVisible());
  // check-in
  await p.getByRole('button', { name: 'Start Tonight\'s Check-in' }).click(); await p.waitForTimeout(150);
  await p.screenshot({ path: SHOTS + '/03-review.png' });
  await p.getByRole('button', { name: /Start Today.s Check-in/ }).click(); await p.waitForTimeout(150);
  await p.screenshot({ path: SHOTS + '/04-factor.png' });
  await p.locator('#cardimp').selectOption('L'); await p.waitForTimeout(100);
  log('card importance:', await p.locator('label[for="cardimp"]').innerText());
  await p.screenshot({ path: SHOTS + '/04-factor.png' });
  log('card fits screen:', await p.evaluate(() => { const s = document.querySelector('.scroller'); const c = document.querySelector('[aria-label^="Swipe card"]'); return s.scrollHeight <= s.clientHeight + 1 && c.scrollHeight <= c.clientHeight + 1; }));
  // real swipes on the first card: up (good) for today, right (okay) for tomorrow
  const tap0 = async (n) => { await p.getByRole('button', { name: n, exact: true }).click(); await p.waitForTimeout(60); };
  const swipe = async (dx, dy) => { const c = await p.getByRole('group', { name: /Swipe card/ }).boundingBox(); const x = c.x + c.width / 2, y = c.y + c.height / 2; await p.mouse.move(x, y); await p.mouse.down(); for (let i = 1; i <= 6; i++) await p.mouse.move(x + dx * i / 6, y + dy * i / 6); await p.mouse.up(); await p.waitForTimeout(300); };
  await swipe(0, -160); await p.screenshot({ path: SHOTS + '/04b-factor-tomorrow.png' }); await swipe(170, 0);
  log('swiped to card:', await p.getByText(/^2 of 15$/).isVisible());
  await swipe(-170, 0); log('left swipe does nothing:', await p.getByText(/^2 of 15$/).isVisible() && await p.getByText('How was it today?').isVisible());
  await p.getByRole('button', { name: 'Back', exact: true }).click(); await p.waitForTimeout(100);
  log('Back button returns to card 1 tomorrow:', await p.getByText(/^1 of 15$/).isVisible() && await p.getByText('Expected tomorrow').isVisible());
  await tap0('Okay');
  const tap = async (n) => { await p.getByRole('button', { name: n, exact: true }).click(); await p.waitForTimeout(60); };
  const plan = [['Good','Okay'],['Okay','Good'],['Bad','Okay'],['Good','Good'],['Good','Okay'],['Bad','Okay'],['Okay','Good'],['Good','Good'],['Okay','Okay'],['Okay','Good'],['Good','Okay'],['Good','Good'],['Good','Good'],['Okay','Good']];
  for (const [a, b2] of plan) { await tap(a); await tap(b2); }
  await p.waitForTimeout(300);
  log('plan screen:', await p.getByText('Plan Tomorrow').isVisible());
  await p.getByLabel('New task for tomorrow').fill('Gym at 6 AM'); await p.getByRole('button', { name: 'Physical', exact: true }).click();
  await p.getByRole('button', { name: 'Add task' }).click(); await p.waitForTimeout(150);
  await p.screenshot({ path: SHOTS + '/05-plan.png' });
  await p.getByRole('button', { name: 'Continue' }).click(); await p.waitForTimeout(150);
  await p.getByLabel(/Optional/).fill('First real check-in.');
  await p.getByRole('button', { name: 'Save Day' }).click(); await p.waitForTimeout(250);
  await p.screenshot({ path: SHOTS + '/06-results.png', fullPage: false });
  log('results:', await p.getByText('Your Day').isVisible());
  // reload -> persisted
  await p.reload(); await p.waitForTimeout(400);
  log('after reload, setup hidden:', !(await p.getByText('Step 1 of 5').isVisible()));
  await p.screenshot({ path: SHOTS + '/07-summary-after-reload.png' });
  log('summary label:', await p.getByText('Today', { exact: true }).first().isVisible());
  const stored = await p.evaluate(() => JSON.parse(localStorage.getItem('dayscore.v1')));
  log('stored days:', Object.keys(stored.days), 'pillars:', stored.tasks.map(t => t.pillar), 'tasks:', stored.tasks.map(t => t.text + '@' + t.date), 'note:', Object.values(stored.days)[0].note);
  // expand 7-day
  await p.getByRole('button', { name: /7-Day Score/ }).click(); await p.waitForTimeout(150);
  await p.screenshot({ path: SHOTS + '/08-summary-expanded.png', fullPage: true });
  // planner add sheet
  await btn('Planner').click(); await p.waitForTimeout(150);
  await p.getByRole('button', { name: 'Add to-do' }).click(); await p.waitForTimeout(150);
  await p.getByRole('textbox', { name: 'To-do', exact: true }).fill('Call Mom');
  await p.getByLabel(/^Time/).fill('18:30');
  await p.getByRole('button', { name: 'Emotional', exact: true }).click();
  await p.screenshot({ path: SHOTS + '/09-add-sheet.png' });
  await p.getByRole('button', { name: 'Add', exact: true }).click(); await p.waitForTimeout(150);
  await p.screenshot({ path: SHOTS + '/10-planner.png' });
  log('time on to-do:', await p.getByText('6:30 PM').first().isVisible());
  // scan a photo of a printed list (reader runs on the phone from vendor/ocr)
  const pg2 = await b.newPage({ viewport: { width: 700, height: 420 } });
  await pg2.setContent('<body style="margin:0;background:#fff"><div style="font:30px Georgia,serif;color:#111;padding:30px 40px;line-height:1.6">To do<br>- Dentist Tue 3pm<br>- Pay rent Nov 14<br>- Call Mom tomorrow<br>- Buy milk</div></body>');
  const photo = SHOTS + '/scan-input.png'; await pg2.screenshot({ path: photo }); await pg2.close();
  await btn('Planner').click(); await p.waitForTimeout(100);
  const t0 = Date.now(); await p.setInputFiles('#scanfile', photo);
  await p.getByText(/^Add \d+ to-do/).waitFor({ timeout: 90000 });
  await p.screenshot({ path: SHOTS + '/10f-scan-review.png' });
  const vals = await p.$$eval('input[id^="scantext-"]', (els) => els.map((e) => e.value));
  log('scan read in', Math.round((Date.now() - t0) / 1000) + 's:', vals);
  await p.getByRole('button', { name: /^Add \d+ to-do/ }).click(); await p.waitForTimeout(500);
  log('scan added:', (await p.evaluate(() => JSON.parse(localStorage.getItem('dayscore.v1')).tasks.map((t) => t.text + '@' + t.date + ' ' + t.time))));
  // check-in tab: start button on top, today's to-dos grouped by pillar
  await btn('Check-in').click(); await p.waitForTimeout(150);
  await p.screenshot({ path: SHOTS + '/10b-checkin-tab.png' });
  // work list
  await btn('Planner').click(); await p.getByRole('button', { name: 'Work', exact: true }).click(); await p.waitForTimeout(150);
  await p.getByLabel('New work to-do').fill('Send proposal'); await p.keyboard.press('Enter'); await p.waitForTimeout(100);
  await p.getByLabel('New work to-do').fill('Call client'); await p.getByRole('button', { name: 'Add work to-do', exact: true }).click(); await p.waitForTimeout(100);
  await p.getByRole('button', { name: 'Mark done: Send proposal' }).click(); await p.waitForTimeout(100);
  log('work list:', await p.getByText('Call client').isVisible(), await p.getByText('1 of 2 done').isVisible());
  await p.getByRole('button', { name: 'Add work to-do with options' }).click(); await p.waitForTimeout(100);
  await p.getByRole('textbox', { name: 'To-do', exact: true }).fill('Team standup'); await p.getByRole('button', { name: 'Weekdays' }).click();
  await p.screenshot({ path: SHOTS + '/10d-repeat.png' });
  await p.getByRole('button', { name: 'Add', exact: true }).click(); await p.waitForTimeout(100);
  log('repeat added:', await p.getByText('↻ Every weekday').isVisible());
  await p.screenshot({ path: SHOTS + '/10c-work.png' });
  await p.getByRole('button', { name: /Pick a date/ }).click(); await p.waitForTimeout(150);
  await p.screenshot({ path: SHOTS + '/10e-datepick.png' });
  await p.getByRole('button', { name: 'Next month' }).click(); await p.getByRole('button', { name: /, December 10|Thu, Dec 10/ }).first().click(); await p.waitForTimeout(150);
  log('jumped to:', await p.getByRole('button', { name: /Pick a date/ }).getAttribute('aria-label'));
  await btn('History').click(); await p.waitForTimeout(150);
  await btn('Notes').click(); await p.waitForTimeout(150);
  await p.getByRole('button', { name: /Grocery List/ }).click(); await p.waitForTimeout(100);
  await p.getByLabel('Add an item').fill('Eggs'); await p.keyboard.press('Enter'); await p.waitForTimeout(100);
  await p.getByRole('button', { name: 'Notes', exact: true }).first().click(); await p.getByRole('button', { name: /Gift Ideas/ }).click(); await p.waitForTimeout(100);
  await p.getByLabel('Gift idea').fill('Scarf'); await p.getByLabel('For').fill('Mom'); await p.getByLabel('Price (optional)').fill('35'); await p.getByRole('button', { name: 'Add item' }).click(); await p.waitForTimeout(400);
  await p.screenshot({ path: SHOTS + '/11b-notes-gifts.png' });
  log('notes saved:', (await p.evaluate(() => JSON.parse(localStorage.getItem('dayscore.v1')).notes.items.map((x) => x.text + (x.who ? ' for ' + x.who : '') + (x.price ? ' $' + x.price : '')))));
  await p.screenshot({ path: SHOTS + '/11-history.png' });
  // settings
  await btn('Summary').click(); await p.getByRole('button', { name: 'Settings' }).click(); await p.waitForTimeout(150);
  await p.screenshot({ path: SHOTS + '/12-settings.png' });
  // offline tips
  await btn('Summary').click(); await ctx.setOffline(true); await p.waitForTimeout(200);
  await p.getByRole('button', { name: /Needs Attention/ }).click(); await p.waitForTimeout(150);
  log('offline tip msg:', await p.getByText('Connect to the internet to see tips.').isVisible());
  await ctx.setOffline(false); await p.waitForTimeout(200);
  log('online tip shown:', await p.getByText('Open source ›').first().isVisible());
  await p.screenshot({ path: SHOTS + '/13-tips.png', fullPage: true });
  log('ERRORS:', errs.length ? errs : 'none');
  await b.close(); server.close();
  process.exit(errs.length ? 1 : 0);
})();
