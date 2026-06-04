/* Smoke-test: laad een echte BFT-tool, klik Sync, maak een screenshot.
   Doel = bewijzen dat Playwright + browser hier draaien vóór we de volle
   opname-pipeline bouwen. */
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('..');                 // BFT-V2/
const tool = path.join(ROOT, 'tools', 'BFT_OverallPlanning.html');
mkdirSync('output', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(pathToFileURL(tool).href);
await page.waitForTimeout(600);
await page.click('#btnSync').catch(() => {});    // projecten uit de lijst halen
await page.waitForTimeout(900);
await page.screenshot({ path: 'output/smoke_overallplanning.png' });
const n = await page.locator('tr.og-row-project').count();
await browser.close();
console.log('OK: screenshot gemaakt · projectrijen in grid =', n);
