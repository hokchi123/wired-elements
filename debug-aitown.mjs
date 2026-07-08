import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const consoleMsgs = [];
  page.on('console', (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => consoleMsgs.push(`[PAGE_ERROR] ${err.message}`));
  page.on('requestfailed', (req) => consoleMsgs.push(`[REQ_FAIL] ${req.url()} - ${req.failure()?.errorText}`));

  console.log('Loading http://localhost:5174/ ...');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);

  console.log('\n--- All Console Messages ---');
  consoleMsgs.forEach(m => console.log(m));

  // Check if ai-town.js was loaded
  const scriptsLoaded = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script'));
    return scripts.map(s => s.src);
  });
  console.log('\nScripts:', JSON.stringify(scriptsLoaded, null, 2));

  // Check canvas
  const canvasInfo = await page.evaluate(() => {
    const c = document.getElementById('aiTownCanvas');
    if (!c) return 'no canvas';
    return { width: c.width, height: c.height };
  });
  console.log('Canvas:', JSON.stringify(canvasInfo));

  await browser.close();
})();
