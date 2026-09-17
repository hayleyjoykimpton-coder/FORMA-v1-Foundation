import { chromium } from "playwright";
import { mkdir, writeFile, readdir, copyFile } from "node:fs/promises";
import path from "node:path";

const OUT = "/opt/cursor/artifacts";
await mkdir(OUT, { recursive: true });
await mkdir("/tmp/nutrition-test", { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 430, height: 920 },
  recordVideo: { dir: "/tmp/nutrition-test", size: { width: 430, height: 920 } },
});
const page = await context.newPage();
const log = (...a) => console.log(...a);

async function snap(name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: true });
  log("SNAP", name);
}

async function clickIf(name, timeout = 3000) {
  const btn = page.getByRole("button", { name });
  try {
    await btn.first().waitFor({ state: "visible", timeout });
    await btn.first().click();
    await page.waitForTimeout(450);
    return true;
  } catch {
    return false;
  }
}

await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1000);
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(1000);

await clickIf(/continue on this device only/i);
await clickIf(/get started/i);

const nameInput = page.locator("input").first();
if (await nameInput.count()) {
  await nameInput.fill("Alex");
  await clickIf(/^continue$/i);
}
const club = page.locator("button.choice, .cracker-club-grid button, .choice-grid button").first();
if (await club.count()) {
  await club.click();
  await clickIf(/^continue$/i);
}
if (await page.locator("button.choice").count()) {
  await page.locator("button.choice").first().click();
}
await clickIf(/^continue$/i);
await clickIf(/join christmas cracker/i);
if (await page.locator("button.choice").count()) {
  await page.locator("button.choice").first().click();
}
await clickIf(/enter my cracker home/i, 4000);
await page.waitForTimeout(1500);
await snap("nutrition_hub_home_after_onboard.png");

// Ensure Fuel / Nutrition module open
const toggles = page.locator("button").filter({ hasText: /fuel your six weeks|recipe & food|nutrition/i });
for (let i = 0; i < (await toggles.count()); i++) {
  const t = toggles.nth(i);
  const exp = await t.getAttribute("aria-expanded");
  if (exp === "false") await t.click();
}
await page.waitForTimeout(500);

const hub = page.locator(".nutrition-hub");
await hub.first().waitFor({ state: "visible", timeout: 15000 });
await hub.first().scrollIntoViewIfNeeded();
await snap("nutrition_hub_dashboard.png");

const bodyText = await page.locator("body").innerText();
if (!/Fuel your six weeks/i.test(bodyText)) throw new Error("Missing hub hero");
log("OK hero");

await page.getByRole("button", { name: /^this week$/i }).click();
await page.waitForTimeout(400);
await snap("nutrition_this_week.png");

await page.getByRole("button", { name: /^meal plan$/i }).click();
await page.waitForTimeout(400);
await snap("nutrition_meal_plan.png");

await page.locator(".nutrition-meal-card").first().click();
await page.waitForTimeout(500);
await snap("nutrition_recipe_detail.png");
await page.getByRole("button", { name: /^save$/i }).click();
await page.waitForTimeout(200);
await page.getByRole("button", { name: /add to shopping list/i }).click();
await page.waitForTimeout(200);
await page.getByRole("button", { name: /← back/i }).click();
await page.waitForTimeout(300);

await page.getByRole("button", { name: /^recipes$/i }).click();
await page.waitForTimeout(300);
await page.locator(".nutrition-search input").fill("salmon");
await page.waitForTimeout(400);
await snap("nutrition_recipes_search.png");
const salmonCount = await page.locator(".nutrition-meal-card").count();
log("salmon results", salmonCount);
if (salmonCount < 1) throw new Error("Search failed");

await page.getByRole("button", { name: /^learn$/i }).click();
await page.waitForTimeout(300);
await snap("nutrition_learn.png");
await page.locator(".nutrition-learn-card").first().click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: /mark complete/i }).click();
await page.waitForTimeout(200);
await page.getByRole("button", { name: /← back/i }).click();

await page.getByRole("button", { name: /^shopping$/i }).click();
await page.waitForTimeout(300);
await snap("nutrition_shopping.png");
const shopItems = await page.locator(".nutrition-shop-list li").count();
log("shopping items", shopItems);
if (shopItems < 1) throw new Error("Shopping list empty after add");

await page.getByRole("button", { name: /^saved$/i }).click();
await page.waitForTimeout(300);
await snap("nutrition_saved.png");
const savedCards = await page.locator(".nutrition-meal-card").count();
log("saved cards", savedCards);
if (savedCards < 1) throw new Error("Saved empty");

await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.locator(".nutrition-hub").first().scrollIntoViewIfNeeded();
await page.getByRole("button", { name: /^shopping$/i }).click();
await page.waitForTimeout(400);
const shopAfter = await page.locator(".nutrition-shop-list li").count();
log("shopping after reload", shopAfter);
if (shopAfter < 1) throw new Error("Shopping did not persist");
await snap("nutrition_shopping_persisted.png");

await page.evaluate(() => {
  const buttons = [...document.querySelectorAll("button, a")];
  const hit = buttons.find((b) =>
    /switch to forma|start forma programme|enable forma/i.test(b.textContent || ""),
  );
  if (hit) throw new Error("FORMA switch still available: " + hit.textContent);
});
log("OK no FORMA switch control");

await writeFile(
  path.join(OUT, "nutrition_hub_smoke_log.txt"),
  `hero ok\nsalmon ${salmonCount}\nshop ${shopItems}->${shopAfter}\nsaved ${savedCards}\n`,
);

await context.close();
await browser.close();

const vids = (await readdir("/tmp/nutrition-test")).filter((f) => f.endsWith(".webm"));
if (vids[0]) {
  await copyFile(
    `/tmp/nutrition-test/${vids[0]}`,
    path.join(OUT, "nutrition_hub_walkthrough.webm"),
  );
  log("VIDEO nutrition_hub_walkthrough.webm");
}
log("DONE");
