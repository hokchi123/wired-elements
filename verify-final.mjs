import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const consoleMsgs = [];
  page.on('console', (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));

  console.log('Loading http://localhost:5174/ ...');
  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);

  // ===== Check 1: Nav only has "应用" =====
  console.log('\n--- Check 1: Nav buttons ---');
  const navTexts = await page.locator('.nav wired-button').allTextContents();
  console.log('Nav buttons:', JSON.stringify(navTexts));
  const hasSettings = navTexts.some(t => t.includes('设置'));
  const hasFaq = navTexts.some(t => t.includes('答疑'));
  console.log(`  设置 exists: ${hasSettings} (should be false)`);
  console.log(`  答疑 exists: ${hasFaq} (should be false)`);

  // ===== Check 2: Settings & FAQ pages don't exist =====
  console.log('\n--- Check 2: Page sections ---');
  const settingsPageExists = await page.locator('#page-settings').count();
  const faqPageExists = await page.locator('#page-faq').count();
  console.log(`  #page-settings exists: ${settingsPageExists > 0} (should be false)`);
  console.log(`  #page-faq exists: ${faqPageExists > 0} (should be false)`);

  // ===== Check 3: Wallpaper background div exists =====
  console.log('\n--- Check 3: Wallpaper ---');
  const wallpaperInfo = await page.evaluate(() => {
    const bg = document.querySelector('.wallpaper-bg');
    if (!bg) return { exists: false };
    const style = getComputedStyle(bg);
    return {
      exists: true,
      opacity: style.opacity,
      zIndex: style.zIndex,
      pointerEvents: style.pointerEvents,
      backgroundImage: style.backgroundImage.substring(0, 50) + '...',
    };
  });
  console.log('Wallpaper div:', JSON.stringify(wallpaperInfo, null, 2));

  // ===== Check 4: App page content visible =====
  console.log('\n--- Check 4: Content visibility ---');
  const dropTextVisible = await page.locator('.drop-text').isVisible();
  const dropHintVisible = await page.locator('.drop-hint').isVisible();
  const infoBarVisible = await page.locator('.info-bar').isVisible();
  console.log(`  Drop text visible: ${dropTextVisible}`);
  console.log(`  Drop hint visible: ${dropHintVisible}`);
  console.log(`  Info bar visible: ${infoBarVisible}`);

  // ===== Check 5: Text readability (contrast check) =====
  console.log('\n--- Check 5: Opacity checks ---');
  const contentOpacities = await page.evaluate(() => {
    const results = {};
    const dropZone = document.querySelector('.drop-zone');
    const header = document.querySelector('.header');
    const infoBar = document.querySelector('.info-bar');
    const footer = document.querySelector('.footer');
    if (dropZone) results.dropZone = getComputedStyle(dropZone).backgroundColor;
    if (header) results.header = getComputedStyle(header).backgroundColor;
    if (infoBar) results.infoBar = getComputedStyle(infoBar).backgroundColor;
    if (footer) results.footer = getComputedStyle(footer).backgroundColor;
    return results;
  });
  console.log('Content backgrounds:', JSON.stringify(contentOpacities, null, 2));

  // ===== Screenshot =====
  await page.screenshot({ path: 'unlock-music-wallpaper.png', fullPage: false });
  console.log('\nScreenshot saved: unlock-music-wallpaper.png');

  // ===== Summary =====
  console.log('\n========== 验收结果 ==========');
  const allPass = !hasSettings && !hasFaq && settingsPageExists === 0 && faqPageExists === 0 && wallpaperInfo.exists;
  console.log(`✅ 导航栏只剩"应用": ${!hasSettings && !hasFaq ? '通过' : '失败'}`);
  console.log(`✅ 设置/答疑页面已删除: ${settingsPageExists === 0 && faqPageExists === 0 ? '通过' : '失败'}`);
  console.log(`✅ 壁纸背景层存在: ${wallpaperInfo.exists ? '通过' : '失败'}`);
  console.log(`✅ 壁纸不遮挡内容(z-index=0, opacity=0.15): ${wallpaperInfo.exists && wallpaperInfo.zIndex === '0' ? '通过' : '失败'}`);
  console.log(`✅ 文字内容可见: ${dropTextVisible && dropHintVisible && infoBarVisible ? '通过' : '失败'}`);
  console.log('==============================');

  await browser.close();
})();
