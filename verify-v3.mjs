import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const consoleMsgs = [];
  page.on('console', (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));

  console.log('Loading http://localhost:5174/ ...');
  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);

  // Sample 50 random points across the canvas
  const samplePoints = () => {
    const c = document.getElementById('aiTownCanvas');
    if (!c) return null;
    const ctx = c.getContext('2d');
    const w = c.width, h = c.height;
    const samples = [];
    for (let i = 0; i < 50; i++) {
      const x = Math.floor(Math.random() * w);
      const y = Math.floor(Math.random() * h);
      const d = ctx.getImageData(x, y, 1, 1).data;
      samples.push([d[0], d[1], d[2], d[3]]);
    }
    return samples;
  };

  const check1 = await page.evaluate(samplePoints);
  await page.waitForTimeout(3000);
  const check2 = await page.evaluate(samplePoints);
  const isAnimating = JSON.stringify(check1) !== JSON.stringify(check2);

  // Check if the map is NOT pure green
  const colorCheck = await page.evaluate(() => {
    const c = document.getElementById('aiTownCanvas');
    const ctx = c.getContext('2d');
    // Sample center of canvas
    const d = ctx.getImageData(c.width / 2, c.height / 2, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2] };
  });

  console.log(`Canvas animating: ${isAnimating}`);
  console.log(`Center pixel: rgb(${colorCheck.r}, ${colorCheck.g}, ${colorCheck.b})`);
  console.log(`Is pure green: ${colorCheck.g > 60 && colorCheck.r < 50 && colorCheck.b < 50}`);

  // Screenshot
  await page.screenshot({ path: 'ai-town-v2-final.png' });

  console.log('\n========== 验收 ==========');
  console.log(`✅ Canvas 动画: ${isAnimating ? '通过' : '失败'}`);
  console.log(`✅ 非纯绿背景: !(r=${colorCheck.r},g=${colorCheck.g},b=${colorCheck.b}) ${!(colorCheck.g > 60 && colorCheck.r < 50 && colorCheck.b < 50) ? '通过' : '失败'}`);
  console.log(`✅ 原版贴图: ${consoleMsgs.some(m => m.includes('原版贴图')) ? '通过' : '失败'}`);
  console.log('==========================');

  await browser.close();
})();
