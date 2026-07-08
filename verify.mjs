import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  // Wait for components to render
  await page.waitForTimeout(2000);

  // Check if wired-button rendered SVG (hand-drawn sketch)
  const buttonCount = await page.locator('wired-button').count();
  const buttonSvgCount = await page.locator('wired-button svg path').count();
  console.log(`wired-button: ${buttonCount} elements, ${buttonSvgCount} SVG paths`);

  // Check wired-input
  const inputCount = await page.locator('wired-input').count();
  const inputSvgCount = await page.locator('wired-input svg path').count();
  console.log(`wired-input: ${inputCount} elements, ${inputSvgCount} SVG paths`);

  // Check wired-card
  const cardCount = await page.locator('wired-card').count();
  const cardSvgCount = await page.locator('wired-card svg path').count();
  console.log(`wired-card: ${cardCount} elements, ${cardSvgCount} SVG paths`);

  // Check wired-toggle
  const toggleCount = await page.locator('wired-toggle').count();
  const toggleSvgCount = await page.locator('wired-toggle svg path').count();
  console.log(`wired-toggle: ${toggleCount} elements, ${toggleSvgCount} SVG paths`);

  // Take full page screenshot
  await page.screenshot({ path: 'screenshot-full.png', fullPage: true });
  console.log('Full page screenshot saved: screenshot-full.png');

  // Test button click interaction
  const counterBtn = page.locator('#counterBtn');
  await counterBtn.click();
  await page.waitForTimeout(200);
  const btnText = await counterBtn.textContent();
  console.log(`After click, button text: "${btnText}"`);

  // Test input interaction
  const nameInput = page.locator('#nameInput input');
  await nameInput.fill('CatPaw');
  await page.waitForTimeout(200);
  const nameResult = await page.locator('#nameResult').textContent();
  console.log(`Input result: "${nameResult}"`);

  // Test toggle interaction
  const toggle1 = page.locator('#toggle1');
  await toggle1.click();
  await page.waitForTimeout(200);
  const toggleStatus = await page.locator('#toggle1Status').textContent();
  console.log(`Toggle status after click: "${toggleStatus}"`);

  // Check for console errors
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.waitForTimeout(500);
  if (errors.length > 0) {
    console.log('\n⚠️ Console errors detected:');
    errors.forEach((e) => console.log(`  - ${e}`));
  } else {
    console.log('\n✅ No console errors detected');
  }

  // Summary
  console.log('\n========== 验收结果 ==========');
  const allRendered = buttonSvgCount > 0 && inputSvgCount > 0 && cardSvgCount > 0 && toggleSvgCount > 0;
  if (allRendered) {
    console.log('✅ 所有四类组件均已渲染手绘 SVG');
  } else {
    console.log('❌ 部分组件未正确渲染');
  }
  console.log('==============================');

  await browser.close();
})();
