/**
 * Env-setup hello-world: local-only → onboarding → start workout → log a set.
 * Run: node scripts/env-setup-hello-world.cjs
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const ART = "/opt/cursor/artifacts";
const BASE = "http://localhost:3000";

async function shot(page, name) {
  const dest = path.join(ART, name);
  await page.screenshot({ path: dest, fullPage: false });
  console.log("screenshot", dest);
  return dest;
}

async function clickIf(page, nameRe) {
  const btn = page.getByRole("button", { name: nameRe }).first();
  if (await btn.count()) {
    await btn.click();
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

(async () => {
  fs.mkdirSync(ART, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  // Fresh storage so we exercise the full gate → onboarding → session path.
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    recordVideo: { dir: ART, size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("console.error:", msg.text());
  });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  if (await clickIf(page, /Continue on this device only/i)) {
    console.log("step: continue local-only");
  }

  if (await page.getByRole("heading", { name: /Where do you train/i }).count()) {
    console.log("step: onboarding club");
    await page.getByRole("button", { name: /Fremantle/i }).click();
    await page.getByRole("button", { name: /^Continue$/i }).click();
    await page.waitForTimeout(400);
  }
  if (await page.getByRole("heading", { name: /What feels right/i }).count()) {
    console.log("step: onboarding experience");
    await page.locator("button.choice").filter({ hasText: /Beginner/i }).first().click();
    await page.getByRole("button", { name: /^Continue$/i }).click();
    await page.waitForTimeout(400);
  }
  if (await clickIf(page, /Start Cracker/i)) {
    console.log("step: start cracker");
    await page.waitForTimeout(800);
  }

  await shot(page, "env-setup-01-home.png");

  // Cracker Home uses VIEW TRAINING; classic FORMA uses Start workout on Home.
  if (await clickIf(page, /VIEW TRAINING/i)) {
    console.log("step: view training");
    await page.waitForTimeout(700);
  } else if (await page.locator(".cracker-tabbar button").filter({ hasText: /^Move$/i }).count()) {
    await page.locator(".cracker-tabbar button").filter({ hasText: /^Move$/i }).click();
    await page.waitForTimeout(700);
  }

  const startWorkout = page.getByRole("button", { name: /Start workout/i }).first();
  if (!(await startWorkout.count())) {
    throw new Error("No Start workout button found on Training");
  }
  console.log("step: start workout (pre-readiness)");
  await startWorkout.click();
  await page.waitForTimeout(1000);

  // Readiness check-in gate (optional scores; confirm with Start workout)
  if (await page.getByRole("heading", { name: /READINESS|How are you today/i }).count() ||
      (await page.locator("body").innerText()).includes("READINESS CHECK-IN")) {
    console.log("step: readiness check-in → Start workout");
    await shot(page, "env-setup-02-readiness.png");
    const confirm = page.getByRole("button", { name: /^Start workout$/i }).first();
    await confirm.click();
    await page.waitForTimeout(1200);
  }

  await page.waitForSelector(".set-row", { timeout: 20000 });
  await shot(page, "env-setup-03-session.png");
  console.log("step: session open");

  const firstSet = page.locator(".set-row").first();
  const inputs = firstSet.locator("input[type=number]");
  await inputs.nth(0).fill("40");
  await inputs.nth(1).fill("10");
  await inputs.nth(2).fill("7");
  console.log("step: log set weight/reps/RPE");
  await firstSet.getByRole("button", { name: /^Done$/i }).click();
  await page.waitForTimeout(600);

  const complete = await firstSet.evaluate((el) => el.classList.contains("complete"));
  if (!complete) throw new Error("Set did not mark complete after Done");
  console.log("step: set complete ✓");
  await shot(page, "env-setup-04-set-logged.png");

  await context.close();
  await browser.close();

  const videos = fs
    .readdirSync(ART)
    .filter((f) => f.endsWith(".webm"))
    .map((f) => ({ f, m: fs.statSync(path.join(ART, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  if (videos[0]) {
    const dest = path.join(ART, "env-setup-hello-world.webm");
    fs.renameSync(path.join(ART, videos[0].f), dest);
    console.log("video", dest);
  }

  console.log("HELLO_WORLD_OK");
  process.exit(0);
})().catch((err) => {
  console.error("HELLO_WORLD_FAIL", err);
  process.exit(1);
});
