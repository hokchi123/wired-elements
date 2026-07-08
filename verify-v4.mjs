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

  // ===== Check console =====
  console.log('\n--- Console Logs ---');
  consoleMsgs.forEach(m => console.log(`  ${m}`));

  // ===== Check 1: Canvas animating =====
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
  console.log(`\nCanvas animating: ${isAnimating}`);

  // ===== Check 2: Characters NOT transparent =====
  // Characters are drawn at full opacity. Sample near character positions.
  const charCheck = await page.evaluate(() => {
    const c = document.getElementById('aiTownCanvas');
    const ctx = c.getContext('2d');
    // Sample bottom area where characters should be
    const yStart = Math.floor(c.height * 0.5);
    const data = ctx.getImageData(0, yStart, c.width, c.height - yStart);
    // Look for opaque pixels (alpha = 255)
    let opaqueCount = 0;
    let semiCount = 0;
    let totalPixels = data.data.length / 4;
    for (let i = 3; i < data.data.length; i += 4) {
      if (data.data[i] > 240) opaqueCount++;
      else if (data.data[i] > 100 && data.data[i] < 240) semiCount++;
    }
    return { opaqueCount, semiCount, totalPixels, opaqueRatio: opaqueCount / totalPixels };
  });
  console.log(`\n--- Character Opacity ---`);
  console.log(`  Opaque pixels (alpha>240): ${charCheck.opaqueCount} (${(charCheck.opaqueRatio * 100).toFixed(1)}%)`);
  console.log(`  Semi-transparent pixels: ${charCheck.semiCount}`);

  // ===== Check 3: Characters within bounds =====
  // Track character positions over time
  const posCheck = await page.evaluate(() => {
    // We can't directly access NPC positions, but we can check if
    // the bottom strip of the canvas has content (characters are there)
    const c = document.getElementById('aiTownCanvas');
    const ctx = c.getContext('2d');
    // Check all 4 edges (10px strips) for character presence
    const edges = {
      top: ctx.getImageData(0, 0, c.width, 10).data,
      bottom: ctx.getImageData(0, c.height - 10, c.width, 10).data,
      left: ctx.getImageData(0, 0, 10, c.height).data,
      right: ctx.getImageData(c.width - 10, 0, 10, c.height).data,
    };
    const result = {};
    for (const [name, data] of Object.entries(edges)) {
      let nonBg = 0;
      for (let i = 0; i < data.length; i += 4) {
        // Non-background = opaque and not the map color
        if (data[i + 3] > 200) nonBg++;
      }
      result[name] = nonBg;
    }
    return result;
  });
  console.log(`\n--- Edge Content (non-bg pixels) ---`);
  console.log(`  Top: ${posCheck.top}, Bottom: ${posCheck.bottom}, Left: ${posCheck.left}, Right: ${posCheck.right}`);

  // ===== Check 4: Background is not pure green =====
  const bgCheck = await page.evaluate(() => {
    const c = document.getElementById('aiTownCanvas');
    const ctx = c.getContext('2d');
    // Sample center
    const d = ctx.getImageData(c.width / 2, c.height / 2, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] };
  });
  const isPureGreen = bgCheck.g > 100 && bgCheck.r < 50 && bgCheck.b < 50;
  console.log(`\n--- Background ---`);
  console.log(`  Center: rgba(${bgCheck.r}, ${bgCheck.g}, ${bgCheck.b}, ${bgCheck.a})`);
  console.log(`  Pure green: ${isPureGreen}`);

  // ===== Check 5: Chinese text in UI =====
  const uiText = await page.evaluate(() => {
    const c = document.getElementById('aiTownCanvas');
    const ctx = c.getContext('2d');
    // We can't extract text from canvas, but check console logs for Chinese
    return true;
  });

  // ===== Screenshot =====
  await page.screenshot({ path: 'ai-town-v3.png' });
  console.log('\nScreenshot: ai-town-v3.png');

  // ===== Summary =====
  console.log('\n========== 验收结果 ==========');
  console.log(`✅ Canvas 动画: ${isAnimating ? '通过' : '失败'}`);
  console.log(`✅ 角色不透明 (opaque>${(charCheck.opaqueRatio * 100).toFixed(0)}%): ${charCheck.opaqueRatio > 0.3 ? '通过' : '失败'}`);
  console.log(`✅ 角色在屏幕内 (边缘无大量角色像素): ${posCheck.top < 5000 && posCheck.bottom < 5000 ? '通过' : '失败'}`);
  console.log(`✅ 非纯绿背景: ${!isPureGreen ? '通过' : '失败'}`);
  console.log(`✅ 贴图加载: ${consoleMsgs.some(m => m.includes('原版贴图')) ? '通过' : '失败'}`);
  console.log(`✅ 无JS错误: ${!consoleMsgs.some(m => m.includes('PAGE_ERROR')) ? '通过' : '失败'}`);
  console.log('==============================');

  await browser.close();
})();
