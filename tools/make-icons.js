// Regenerates the app icons (icon-180/192/512.png) at the repo root from src/icon.svg.
// Run: node tools/make-icons.js   (needs Playwright with Chromium)
const path = require('path'); const fs = require('fs'); const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
(async () => {
  const svg = fs.readFileSync(path.join(ROOT, 'src', 'icon.svg'), 'utf8');
  const b = await chromium.launch(); const p = await b.newPage();
  for (const s of [180, 192, 512]) {
    await p.setViewportSize({ width: s, height: s });
    await p.setContent(`<html><body style="margin:0;background:#000">${svg.replace('<svg ', `<svg width="${s}" height="${s}" `)}</body></html>`);
    await p.screenshot({ path: path.join(ROOT, `icon-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();
