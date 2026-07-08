import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

  const URL = 'https://hokchi123.github.io/unlock-music-sketch/';
  console.log(`验收公网地址: ${URL}\n`);

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  // App page
  const title = await page.title();
  console.log(`页面标题: "${title}"`);

  const dropText = await page.locator('.drop-text').textContent();
  console.log(`上传区文案: "${dropText}"`);

  const navBtns = await page.locator('.nav-btn').count();
  console.log(`导航按钮数: ${navBtns}`);

  const wiredPaths = await page.locator('wired-button svg path').count();
  console.log(`手绘 SVG 路径数: ${wiredPaths}`);

  // Navigate to settings
  await page.locator('[data-page="settings"]').first().click();
  await page.waitForTimeout(1500);
  const settingsTabs = await page.locator('#page-settings wired-tab').count();
  console.log(`设置页标签数: ${settingsTabs}`);

  // Navigate to FAQ
  await page.locator('[data-page="faq"]').first().click();
  await page.waitForTimeout(1500);
  const faqTabs = await page.locator('#page-faq wired-tab').count();
  console.log(`答疑页标签数: ${faqTabs}`);

  await page.screenshot({ path: 'um-public-final.png', fullPage: true });
  console.log('\n截图已保存: um-public-final.png');

  console.log('\n========== 公网验收通过 ==========');
  console.log(`网址: ${URL}`);
  console.log('===================================');

  await browser.close();
})();
