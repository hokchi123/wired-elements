import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const consoleMsgs = [];
  page.on('console', (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => consoleMsgs.push(`[PAGE_ERROR] ${err.message}`));

  console.log('Loading http://localhost:5174/ ...');
  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(10000);

  console.log('\n--- Console ---');
  consoleMsgs.forEach(m => console.log(`  ${m}`));

  // Animation
  const samplePoints = () => {
    const c = document.getElementById('aiTownCanvas');
    if (!c) return null;
    const ctx = c.getContext('2d');
    const samples = [];
    for (let i = 0; i < 50; i++) {
      const x = Math.floor(Math.random() * c.width);
      const y = Math.floor(Math.random() * c.height);
      const d = ctx.getImageData(x, y, 1, 1).data;
      samples.push([d[0], d[1], d[2], d[3]]);
    }
    return samples;
  };
  const s1 = await page.evaluate(samplePoints);
  await page.waitForTimeout(3000);
  const s2 = await page.evaluate(samplePoints);
  const animating = JSON.stringify(s1) !== JSON.stringify(s2);

  // 6 characters check
  const has6Chars = consoleMsgs.some(m => m.includes('6 个角色'));

  // Fonts
  const fontReady = consoleMsgs.some(m => m.includes('手绘字体已就绪'));

  // BG
  const bg = await page.evaluate(() => {
    const c = document.getElementById('aiTownCanvas');
    const ctx = c.getContext('2d');
    const d = ctx.getImageData(c.width / 2, c.height / 2, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] };
  });

  // UI
  const nav = await page.locator('#navApp').isVisible().catch(() => false);
  const dropText = await page.locator('.drop-text').isVisible().catch(() => false);
  const info = await page.locator('.info-bar').isVisible().catch(() => false);

  // No errors
  const noErrors = !consoleMsgs.some(m => m.includes('PAGE_ERROR'));

  await page.screenshot({ path: 'ai-town-v6.png' });

  console.log('\n========== 验收结果 ==========');
  console.log(`✅ Canvas 动画: ${animating ? '通过' : '失败'}`);
  console.log(`✅ 6个角色: ${has6Chars ? '通过' : '失败'}`);
  console.log(`✅ 手绘字体: ${fontReady ? '通过' : '失败'}`);
  console.log(`✅ 背景非纯绿: rgba(${bg.r},${bg.g},${bg.b}) ${!(bg.g > 100 && bg.r < 50 && bg.b < 50) ? '通过' : '失败'}`);
  console.log(`✅ UI可见: ${nav && dropText && info ? '通过' : '失败'}`);
  console.log(`✅ 贴图加载: ${consoleMsgs.some(m => m.includes('原版贴图')) ? '通过' : '失败'}`);
  console.log(`✅ 精灵图加载: ${consoleMsgs.some(m => m.includes('精灵图')) ? '通过' : '失败'}`);
  console.log(`✅ 无JS错误: ${noErrors ? '通过' : '失败'}`);
  console.log('==============================');

  await browser.close();
})();
