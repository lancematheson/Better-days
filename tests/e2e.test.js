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
  log('setup visible:', await p.getByText('Welcome', { exact: true }).isVisible());
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
  const type = async (s) => { for (const ch of s) { await p.getByRole('button', { name: ch === '.' ? 'Decimal point' : ch, exact: true }).click(); } await p.waitForTimeout(700); };
  const today = ['7.5','8.0','6.5','5.0','7.0','8.0','4.5','7.5','8.5','6.0','6.5','7.0','8.0','9.0','6.0'];
  for (let i = 0; i < 15; i++) { await type(today[i]); await type('8.0'); }
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
  await p.getByRole('button', { name: 'Emotional', exact: true }).click();
  await p.screenshot({ path: SHOTS + '/09-add-sheet.png' });
  await p.getByRole('button', { name: 'Add', exact: true }).click(); await p.waitForTimeout(150);
  await p.screenshot({ path: SHOTS + '/10-planner.png' });
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
  await btn('Journal').click(); await p.waitForTimeout(150);
  await p.getByLabel(/Journal for/).fill('Long day but a good one.'); await p.waitForTimeout(400);
  await p.screenshot({ path: SHOTS + '/11b-journal.png' });
  log('journal saved:', (await p.evaluate(() => JSON.parse(localStorage.getItem('dayscore.v1')).journal)));
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
