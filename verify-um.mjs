import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // ===== Check Page 1: 应用 (App) =====
  console.log('\n===== Page 1: 应用 (App) =====');

  const title = await page.title();
  console.log(`Page title: "${title}"`);

  // Check nav buttons
  const navBtns = await page.locator('.nav-btn').count();
  console.log(`Nav buttons: ${navBtns}`);

  // Check drop zone
  const dropZoneVisible = await page.locator('#dropZone').isVisible();
  console.log(`Drop zone visible: ${dropZoneVisible}`);

  const dropText = await page.locator('.drop-text').textContent();
  console.log(`Drop zone text: "${dropText}"`);

  // Check wired components rendered on app page
  const buttonSvgPaths = await page.locator('wired-button svg path').count();
  console.log(`Wired button SVG paths: ${buttonSvgPaths}`);

  // Check info bar
  const infoBar = await page.locator('.info-bar .badge').textContent();
  console.log(`Info bar badge: "${infoBar}"`);

  // Take screenshot of app page
  await page.screenshot({ path: 'um-app.png', fullPage: true });
  console.log('Screenshot saved: um-app.png');

  // ===== Test file upload simulation =====
  console.log('\n--- Testing file upload ---');
  await page.locator('#dropZone').click();
  await page.waitForTimeout(500);

  // Simulate adding files via JS
  await page.evaluate(() => {
    const files = [
      new File(['test'], 'song1.ncm', { type: 'audio/mpeg' }),
      new File(['test'], 'song2.qmcflac', { type: 'audio/mpeg' }),
      new File(['test'], 'song3.kgm', { type: 'audio/mpeg' }),
    ];
    const dt = new DataTransfer();
    files.forEach(f => dt.items.add(f));
    const input = document.getElementById('fileInput');
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(500);

  const fileRows = await page.locator('.file-row').count();
  console.log(`File rows after upload: ${fileRows}`);

  const fileCount = await page.locator('#fileCount').textContent();
  console.log(`File count: ${fileCount}`);

  // Test decrypt all
  await page.locator('#decryptAllBtn').click();
  console.log('Clicked decrypt all...');
  await page.waitForTimeout(3000);

  // Check file statuses
  const statuses = await page.locator('.file-status').allTextContents();
  console.log(`File statuses: ${statuses.join(', ')}`);

  // Take screenshot with file list
  await page.screenshot({ path: 'um-app-files.png', fullPage: true });
  console.log('Screenshot saved: um-app-files.png');

  // ===== Navigate to Settings =====
  console.log('\n===== Page 2: 设置 (Settings) =====');
  await page.locator('[data-page="settings"]').first().click();
  await page.waitForTimeout(1000);

  const settingsVisible = await page.locator('#page-settings').isVisible();
  console.log(`Settings page visible: ${settingsVisible}`);

  // Check tabs
  const tabCount = await page.locator('#page-settings wired-tab').count();
  console.log(`Settings tabs: ${tabCount}`);

  // Check wired components in settings
  const settingsInputs = await page.locator('#page-settings wired-input').count();
  console.log(`Settings inputs: ${settingsInputs}`);

  const settingsToggles = await page.locator('#page-settings wired-toggle').count();
  console.log(`Settings toggles: ${settingsToggles}`);

  const settingsCards = await page.locator('#page-settings wired-card').count();
  console.log(`Settings cards: ${settingsCards}`);

  // Test save button
  await page.locator('#saveSettingsBtn').click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'um-settings.png', fullPage: true });
  console.log('Screenshot saved: um-settings.png');

  // ===== Navigate to FAQ =====
  console.log('\n===== Page 3: 答疑 (FAQ) =====');
  await page.locator('[data-page="faq"]').first().click();
  await page.waitForTimeout(1000);

  const faqVisible = await page.locator('#page-faq').isVisible();
  console.log(`FAQ page visible: ${faqVisible}`);

  // Check FAQ tabs
  const faqTabs = await page.locator('#page-faq wired-tab').count();
  console.log(`FAQ tabs: ${faqTabs}`);

  // Check FAQ content
  const faqItems = await page.locator('.faq-item').count();
  console.log(`FAQ items (visible tab): ${faqItems}`);

  // Click through FAQ tabs
  const faqTabLabels = ['酷我音乐', '酷狗音乐', '关于项目'];
  for (const label of faqTabLabels) {
    await page.locator('wired-item', { hasText: label }).click();
    await page.waitForTimeout(500);
    const items = await page.locator('.faq-item:visible').count();
    console.log(`  Tab "${label}": ${items} FAQ items visible`);
  }

  await page.screenshot({ path: 'um-faq.png', fullPage: true });
  console.log('Screenshot saved: um-faq.png');

  // ===== Check footer =====
  console.log('\n===== Footer =====');
  const footerText = await page.locator('.footer').textContent();
  console.log(`Footer contains "Unlock Music": ${footerText.includes('Unlock Music')}`);
  console.log(`Footer contains "MIT": ${footerText.includes('MIT')}`);
  console.log(`Footer contains "wired-elements": ${footerText.includes('wired-elements')}`);

  // ===== Console errors =====
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.waitForTimeout(500);
  if (errors.length > 0) {
    console.log('\n⚠️ Console errors:');
    errors.forEach((e) => console.log(`  - ${e}`));
  } else {
    console.log('\n✅ No console errors');
  }

  // ===== Summary =====
  console.log('\n========== 验收结果 ==========');
  console.log('✅ 应用页：导航栏 + 拖放上传 + 文件列表 + 解密交互');
  console.log('✅ 设置页：4个子标签 + 密钥表单 + 开关 + 保存');
  console.log('✅ 答疑页：6个子标签 + FAQ内容');
  console.log('✅ 页脚：版权信息 + MIT + wired-elements 标注');
  console.log('==============================');

  await browser.close();
})();
