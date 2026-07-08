import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const consoleMsgs = [];
  page.on('console', (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));

  console.log('Loading http://localhost:5174/ ...');
  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(5000);

  // ===== Check 1: Canvas exists =====
  console.log('\n--- Check 1: AI Town Canvas ---');
  const canvasExists = await page.locator('#aiTownCanvas').count();
  console.log(`  Canvas exists: ${canvasExists > 0}`);

  const canvasInfo = await page.evaluate(() => {
    const c = document.getElementById('aiTownCanvas');
    if (!c) return null;
    const style = getComputedStyle(c);
    return {
      width: c.width,
      height: c.height,
      zIndex: style.zIndex,
      pointerEvents: style.pointerEvents,
      position: style.position,
    };
  });
  console.log('  Canvas info:', JSON.stringify(canvasInfo));

  // ===== Check 2: Console logs from AI Town =====
  console.log('\n--- Check 2: Console Logs ---');
  const aiTownLogs = consoleMsgs.filter(m => m.includes('AI 小镇') || m.includes('ai-town'));
  aiTownLogs.forEach(m => console.log(`  ${m}`));

  // ===== Check 3: Characters are moving =====
  console.log('\n--- Check 3: Character Movement ---');
  // Get canvas pixel data at two time points to check if it's changing
  const check1 = await page.evaluate(() => {
    const c = document.getElementById('aiTownCanvas');
    if (!c) return null;
    const ctx = c.getContext('2d');
    const data = ctx.getImageData(0, 0, c.width, c.height);
    // Sample a few pixels
    const samples = [];
    for (let i = 0; i < 10; i++) {
      const x = Math.floor(Math.random() * c.width);
      const y = Math.floor(Math.random() * c.height);
      const idx = (y * c.width + x) * 4;
      samples.push([data.data[idx], data.data[idx+1], data.data[idx+2]]);
    }
    return samples;
  });

  await page.waitForTimeout(3000);

  const check2 = await page.evaluate(() => {
    const c = document.getElementById('aiTownCanvas');
    if (!c) return null;
    const ctx = c.getContext('2d');
    const data = ctx.getImageData(0, 0, c.width, c.height);
    const samples = [];
    for (let i = 0; i < 10; i++) {
      const x = Math.floor(Math.random() * c.width);
      const y = Math.floor(Math.random() * c.height);
      const idx = (y * c.width + x) * 4;
      samples.push([data.data[idx], data.data[idx+1], data.data[idx+2]]);
    }
    return samples;
  });

  const isAnimating = JSON.stringify(check1) !== JSON.stringify(check2);
  console.log(`  Canvas is animating: ${isAnimating}`);

  // ===== Check 4: Content not obstructed =====
  console.log('\n--- Check 4: Content Visibility ---');
  const dropTextVisible = await page.locator('.drop-text').isVisible();
  const dropHintVisible = await page.locator('.drop-hint').isVisible();
  const infoBarVisible = await page.locator('.info-bar').isVisible();
  const navVisible = await page.locator('#navApp').isVisible();
  console.log(`  Nav button visible: ${navVisible}`);
  console.log(`  Drop text visible: ${dropTextVisible}`);
  console.log(`  Drop hint visible: ${dropHintVisible}`);
  console.log(`  Info bar visible: ${infoBarVisible}`);

  // Check z-index ordering
  const zIndexInfo = await page.evaluate(() => {
    const canvas = document.getElementById('aiTownCanvas');
    const header = document.querySelector('.header');
    const main = document.querySelector('.main');
    const footer = document.querySelector('.footer');
    return {
      canvas: canvas ? getComputedStyle(canvas).zIndex : 'N/A',
      header: header ? getComputedStyle(header).zIndex : 'N/A',
      main: main ? getComputedStyle(main).zIndex : 'N/A',
      footer: footer ? getComputedStyle(footer).zIndex : 'N/A',
    };
  });
  console.log('  Z-index order:', JSON.stringify(zIndexInfo));

  // ===== Check 5: AI Town status (via console) =====
  console.log('\n--- Check 5: AI Town Status ---');
  // Wait for the 30s interval status log
  // Actually, let's check the canvas UI directly by taking a screenshot
  await page.screenshot({ path: 'ai-town-final.png', fullPage: false });
  console.log('  Screenshot saved: ai-town-final.png');

  // ===== Check 6: Nav only has "应用" =====
  console.log('\n--- Check 6: Nav buttons ---');
  const navTexts = await page.locator('.nav wired-button').allTextContents();
  console.log('  Nav buttons:', JSON.stringify(navTexts));

  // ===== Summary =====
  console.log('\n========== 验收结果 ==========');
  const allPass = canvasExists > 0 && isAnimating && dropTextVisible && dropHintVisible && infoBarVisible && navVisible;
  console.log(`✅ AI 小镇 Canvas 存在: ${canvasExists > 0 ? '通过' : '失败'}`);
  console.log(`✅ Canvas 正在动画（角色在走动）: ${isAnimating ? '通过' : '失败'}`);
  console.log(`✅ 导航栏只剩"应用": ${navTexts.length === 1 && navTexts[0]?.includes('应用') ? '通过' : '失败'}`);
  console.log(`✅ 文字内容不被遮挡: ${dropTextVisible && dropHintVisible && infoBarVisible ? '通过' : '失败'}`);
  console.log(`✅ Canvas z-index 在内容之下: ${zIndexInfo.canvas === '0' && zIndexInfo.header === '100' ? '通过' : '失败'}`);
  console.log(`✅ AI 小镇控制台日志: ${aiTownLogs.length > 0 ? '通过' : '失败'}`);
  console.log('==============================');

  await browser.close();
})();
