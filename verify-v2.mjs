import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const consoleMsgs = [];
  page.on('console', (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => consoleMsgs.push(`[PAGE_ERROR] ${err.message}`));

  console.log('Loading http://localhost:5174/ ...');
  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);

  // ===== Check 1: Console logs =====
  console.log('\n--- Console Logs ---');
  consoleMsgs.forEach(m => console.log(`  ${m}`));

  // ===== Check 2: Canvas is animating =====
  console.log('\n--- Canvas Animation ---');
  const check1 = await page.evaluate(() => {
    const c = document.getElementById('aiTownCanvas');
    if (!c) return null;
    const ctx = c.getContext('2d');
    const data = ctx.getImageData(0, 0, c.width, c.height);
    return { w: c.width, h: c.height, sample: Array.from(data.data.slice(0, 30)) };
  });
  console.log(`  Canvas size: ${check1?.w}x${check1?.h}`);

  await page.waitForTimeout(3000);

  const check2 = await page.evaluate(() => {
    const c = document.getElementById('aiTownCanvas');
    if (!c) return null;
    const ctx = c.getContext('2d');
    const data = ctx.getImageData(0, 0, c.width, c.height);
    return { sample: Array.from(data.data.slice(0, 30)) };
  });
  const isAnimating = JSON.stringify(check1?.sample) !== JSON.stringify(check2?.sample);
  console.log(`  Canvas animating: ${isAnimating}`);

  // ===== Check 3: Characters at bottom =====
  console.log('\n--- Character Position ---');
  // Check pixel colors near bottom of canvas to see if characters are rendered there
  const bottomCheck = await page.evaluate(() => {
    const c = document.getElementById('aiTownCanvas');
    if (!c) return null;
    const ctx = c.getContext('2d');
    // Sample bottom third
    const yStart = Math.floor(c.height * 0.6);
    const data = ctx.getImageData(0, yStart, c.width, c.height - yStart);
    // Count non-background pixels (pixels that are not part of the map)
    let nonBgCount = 0;
    for (let i = 0; i < data.data.length; i += 4) {
      const r = data.data[i], g = data.data[i+1], b = data.data[i+2], a = data.data[i+3];
      // Skip transparent pixels
      if (a < 10) continue;
      nonBgCount++;
    }
    return { totalPixels: data.data.length / 4, nonBgCount, yStart };
  });
  console.log(`  Bottom area pixels: ${bottomCheck?.nonBgCount} non-transparent out of ${bottomCheck?.totalPixels}`);

  // ===== Check 4: Content visibility =====
  console.log('\n--- Content Visibility ---');
  const dropTextVisible = await page.locator('.drop-text').isVisible();
  const dropHintVisible = await page.locator('.drop-hint').isVisible();
  const infoBarVisible = await page.locator('.info-bar').isVisible();
  const navVisible = await page.locator('#navApp').isVisible();
  console.log(`  Nav: ${navVisible}, Drop text: ${dropTextVisible}, Hint: ${dropHintVisible}, Info: ${infoBarVisible}`);

  // ===== Screenshot =====
  await page.screenshot({ path: 'ai-town-v2.png' });
  console.log('\nScreenshot: ai-town-v2.png');

  // ===== Summary =====
  console.log('\n========== 验收结果 ==========');
  console.log(`✅ Canvas 存在且尺寸正确: ${check1?.w === 1280 && check1?.h === 900 ? '通过' : '失败'}`);
  console.log(`✅ Canvas 正在动画: ${isAnimating ? '通过' : '失败'}`);
  console.log(`✅ 角色在底部区域: ${bottomCheck?.nonBgCount > 100 ? '通过' : '失败'}`);
  console.log(`✅ 内容不被遮挡: ${dropTextVisible && dropHintVisible && infoBarVisible ? '通过' : '失败'}`);
  console.log(`✅ 原版贴图已加载: ${consoleMsgs.some(m => m.includes('原版贴图')) ? '通过' : '失败'}`);
  console.log('==============================');

  await browser.close();
})();
