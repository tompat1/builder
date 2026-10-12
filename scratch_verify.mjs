import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch({
    headless: true
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 }
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Configure house scene directly or via UI
  await page.evaluate(() => {
    const scene = window.__houseScene;
    if (!scene) {
      console.error('__houseScene not found');
      return;
    }
    const current = scene.currentConfig;
    scene.update({
      ...current,
      material: 'black',
      panelOrientation: 'liggande',
      showCornerBoards: true,
      cornerColor: 'falurod',
      wallSlots: {
        ...current.wallSlots,
        'front-3': { type: 'window', itemId: 'standard-single' },
        'front-3u': { type: 'window', itemId: 'standard-single' }
      }
    });

    const w = current.size.width;
    const d = current.size.depth;
    const cornerX = w / 2;
    const cornerZ = d / 2;

    scene.camera.position.set(cornerX + 1.2, 2.4, cornerZ + 2.2);
    scene.controls.target.set(cornerX - 0.2, 2.0, cornerZ);
    scene.controls.update();
  });

  await page.waitForTimeout(1000);

  const outPath1 = '/Users/thomasrynell/.gemini/antigravity-ide/brain/a06808a0-a64b-4267-9849-06160856443d/scratch/corner_red_verified.png';
  await page.screenshot({ path: outPath1 });
  console.log('Saved screenshot 1 to', outPath1);

  await page.evaluate(() => {
    const scene = window.__houseScene;
    const current = scene.currentConfig;
    scene.update({
      ...current,
      cornerColor: 'black'
    });
    const w = current.size.width;
    const d = current.size.depth;
    const cornerX = w / 2;
    const cornerZ = d / 2;
    scene.camera.position.set(cornerX + 0.8, 1.8, cornerZ + 1.2);
    scene.controls.target.set(cornerX - 0.1, 1.6, cornerZ);
    scene.controls.update();
  });

  await page.waitForTimeout(1000);

  const outPath2 = '/Users/thomasrynell/.gemini/antigravity-ide/brain/a06808a0-a64b-4267-9849-06160856443d/scratch/corner_black_sill_verified.png';
  await page.screenshot({ path: outPath2 });
  console.log('Saved screenshot 2 to', outPath2);

  await browser.close();
}

run().catch(console.error);
