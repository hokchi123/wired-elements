import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const consoleMsgs = [];
  page.on('console', (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => consoleMsgs.push(`[PAGE_ERROR] ${err.message}`));

  console.log('Loading https://hokchi123.github.io/unlock-music-sketch/ ...');
  await page.goto('https://hokchi123.github.io/unlock-music-sketch/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(12000);

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

  const has6 = consoleMsgs.some(m => m.includes('6 个角色'));
  const fontReady = consoleMsgs.some(m => m.includes('手绘字体已就绪'));
  const hasCollision = consoleMsgs.some(m => m.includes('碰撞检测'));
  const noErrors = !consoleMsgs.some(m => m.includes('PAGE_ERROR'));

  const bg = await page.evaluate(() => {
    const c = document.getElementById('aiTownCanvas');
    const ctx = c.getContext('2d');
    const d = ctx.getImageData(c.width / 2, c.height / 2, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2] };
  });

  const nav = await page.locator('#navApp').isVisible().catch(() => false);
  const dropText = await page.locator('.drop-text').isVisible().catch(() => false);

  await page.screenshot({ path: 'ai-town-prod-v6.png' });

  console.log('\n========== 线上验收 ==========');
  console.log(`✅ Canvas 动画: ${animating ? '通过' : '失败'}`);
  console.log(`✅ 6个角色: ${has6 ? '通过' : '失败'}`);
  console.log(`✅ 碰撞检测: ${hasCollision ? '通过' : '失败'}`);
  console.log(`✅ 手绘字体: ${fontReady ? '通过' : '失败'}`);
  console.log(`✅ 背景非纯绿: rgba(${bg.r},${bg.g},${bg.b}) ${!(bg.g > 100 && bg.r < 50 && bg.b < 50) ? '通过' : '失败'}`);
  console.log(`✅ 贴图加载: ${consoleMsgs.some(m => m.includes('原版贴图')) ? '通过' : '失败'}`);
  console.log(`✅ 精灵图: ${consoleMsgs.some(m => m.includes('精灵图')) ? '通过' : '失败'}`);
  console.log(`✅ UI可见: ${nav && dropText ? '通过' : '失败'}`);
  console.log(`✅ 无JS错误: ${noErrors ? '通过' : '失败'}`);
  console.log('==============================');

  await browser.close();
})();
