import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  await page.goto('http://localhost:5173/build', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. In default stående panel, take a screenshot of facade with midjan
  const outPathStaende = '/Users/thomasrynell/.gemini/antigravity-ide/brain/a06808a0-a64b-4267-9849-06160856443d/scratch/midja_staende.png';
  await page.screenshot({ path: outPathStaende });
  console.log('Saved stående screenshot to', outPathStaende);

  // 2. Select liggande panel via UI button
  const liggandeBtn = page.locator('#panel-liggande');
  if (await liggandeBtn.count() > 0 && await liggandeBtn.isVisible()) {
    await liggandeBtn.click();
  } else {
    // Or via scene / store
    await page.evaluate(() => {
      window.__houseScene?.updateConfig({ panelOrientation: 'liggande' });
    });
  }
  await page.waitForTimeout(1000);

  const outPathLiggande = '/Users/thomasrynell/.gemini/antigravity-ide/brain/a06808a0-a64b-4267-9849-06160856443d/scratch/midja_liggande.png';
  await page.screenshot({ path: outPathLiggande });
  console.log('Saved liggande screenshot to', outPathLiggande);

  // 3. Switch to a house with black facade and liggande panel like user's screenshot
  await page.evaluate(() => {
    window.__houseScene?.updateConfig({
      material: 'black',
      panelOrientation: 'liggande'
    });
  });
  await page.waitForTimeout(1000);

  const outPathBlack = '/Users/thomasrynell/.gemini/antigravity-ide/brain/a06808a0-a64b-4267-9849-06160856443d/scratch/midja_black_liggande.png';
  await page.screenshot({ path: outPathBlack });
  console.log('Saved black liggande screenshot to', outPathBlack);

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
