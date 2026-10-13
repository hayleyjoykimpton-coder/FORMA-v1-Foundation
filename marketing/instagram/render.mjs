import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.dirname(fileURLToPath(import.meta.url));
const html = path.join(root, "index.html");
const outDir = path.join(root, "out");

const slides = [
  "slide-01",
  "slide-02",
  "slide-03",
  "slide-04",
  "slide-05",
  "slide-06",
  "slide-07",
];

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1080, height: 1350 },
  deviceScaleFactor: 1,
});

await page.goto(`file://${html}`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await mkdir(outDir, { recursive: true });

for (const id of slides) {
  const el = page.locator(`#${id}`);
  await el.scrollIntoViewIfNeeded();
  await el.screenshot({
    path: path.join(outDir, `${id}.png`),
    type: "png",
  });
}

await browser.close();
console.log(`Wrote ${slides.length} slides to ${outDir}`);
