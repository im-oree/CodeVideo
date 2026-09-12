/**
 * Capture the documentation screenshots in docs/screenshots/.
 *
 *   npm run dev            # in one terminal (http://localhost:5173)
 *   npm run screenshots    # in another
 *
 * Override the target with BASE_URL=... and the browser binary with
 * CHROME_PATH=/path/to/chrome (defaults to the Playwright-managed Chromium).
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:5173';
const OUT = resolve('docs/screenshots');
const VIEWPORT = { width: 1600, height: 950 };

mkdirSync(OUT, { recursive: true });

const launchOpts = {
  args: [
    '--no-sandbox',
    '--disable-gpu',
    '--single-process',
    '--no-zygote',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    '--force-color-profile=srgb',
  ],
};
if (process.env.CHROME_PATH) launchOpts.executablePath = process.env.CHROME_PATH;

const shot = async (page, name) => {
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('✓', `docs/screenshots/${name}.png`);
};

/** Click an activity-bar button by its tooltip text. */
const openPanel = async (page, tip) => {
  await page.locator('.activity .abtn', { hasText: tip }).first().click();
  await page.waitForTimeout(400);
};

const closePanel = async (page) => {
  const x = page.locator('.insp-head .btn.ghost');
  if (await x.count()) await x.first().click();
  await page.waitForTimeout(300);
};

/** Click a top menu-bar button ("File", "View", "Export ▾"). */
const openMenu = async (page, label) => {
  await page.locator('header.app-header .mbtn', { hasText: label }).first().click();
  await page.waitForTimeout(350);
};

/** Close an open dropdown by re-clicking the menu button that opened it. */
const dismissMenu = async (page, label) => {
  await page.locator('header.app-header .mbtn.open', { hasText: label }).first()
    .click({ force: true });
  await page.waitForFunction(() => !document.querySelector('.dropdown'), null, { timeout: 5000 });
  await page.waitForTimeout(250);
};

const browser = await chromium.launch(launchOpts);
const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 });

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-cs-stage]');
await page.waitForTimeout(1500); // webfonts settle + remeasure

// 1. The default workspace, inspector collapsed.
await shot(page, '01-workspace');

// 2. Code panel: language picker, sample loader, editor.
await openPanel(page, 'Code');
await shot(page, '02-code-panel');
await closePanel(page);

// 3. Theme & style panel: palette grid, accent, typography, chrome.
await openPanel(page, 'Theme & style');
await shot(page, '03-theme-panel');
await closePanel(page);

// 4. Animation panel: typewriter controls.
await openPanel(page, 'Animation');
await shot(page, '04-animation-panel');
await closePanel(page);

// 5. Scene & output panel: backdrop, aspect ratio, resolution estimate.
await openPanel(page, 'Scene & output');
await shot(page, '05-scene-panel');
await closePanel(page);

// 6. Export menu.
await openMenu(page, 'Export');
await shot(page, '06-export-menu');
await dismissMenu(page, 'Export');

// 7. Typewriter mid-reveal.
await page.locator('.playctl .pri').click();
await page.waitForTimeout(2600);
await page.screenshot({ path: `${OUT}/07-typing.png` });
console.log('✓', 'docs/screenshots/07-typing.png');
await page.locator('.playctl .pri').click(); // pause
await page.waitForTimeout(300);

// 8. Light app theme + a light syntax palette.
await openMenu(page, 'View');
await page.locator('.dropdown .ditem', { hasText: 'Light theme' }).first().click();
await page.waitForTimeout(500);
await openPanel(page, 'Theme & style');
await page.locator('.pal', { hasText: 'GitHub Light' }).first().click();
await page.waitForTimeout(600);
await shot(page, '08-light-theme');

await browser.close();
console.log('\nAll screenshots written to docs/screenshots/');
