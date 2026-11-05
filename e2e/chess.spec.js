const { test, expect } = require("@playwright/test");
const { Chess } = require("chess.js");
const puzzles = require("../src/components/easter/chessPuzzles.json");
const AxeBuilder = require("@axe-core/playwright").default;
const { writeFileSync } = require("node:fs");

async function currentPuzzle(dialog) {
  const href = await dialog.locator(".chess__source a").getAttribute("href");
  return puzzles.find((puzzle) => href.endsWith("/" + puzzle.id));
}
async function play(dialog, uci) {
  await dialog.locator('[data-square="' + uci.slice(0, 2) + '"]').click();
  await dialog.locator('[data-square="' + uci.slice(2, 4) + '"]').click();
  if (uci[4]) await dialog.getByRole("button", { name: "Promote to " + ({ q: "queen", r: "rook", b: "bishop", n: "knight" }[uci[4]]) }).click();
}

test("chess offers three attempts, random difficulty sets and complete multi-move play", async ({ page }, testInfo) => {
  test.setTimeout(120000);
  await page.goto("/");
  await page.getByRole("button", { name: /Playing Chess/ }).click();
  const dialog = page.getByRole("dialog", { name: "Chess puzzle studio" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("gridcell").first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByRole("gridcell").nth(1)).toBeFocused();
  const initial = await currentPuzzle(dialog);
  const game = new Chess(initial.fen);
  game.move({ from: initial.setup.slice(0, 2), to: initial.setup.slice(2, 4), promotion: initial.setup[4] });
  const wrong = game.moves({ verbose: true }).find((move) => {
    if (move.from + move.to + (move.promotion || "") === initial.line[0]) return false;
    const trial = new Chess(game.fen()); trial.move(move); return !trial.isCheckmate() && !move.promotion;
  });
  expect(wrong).toBeDefined();
  for (let remaining = 2; remaining >= 0; remaining--) {
    await play(dialog, wrong.from + wrong.to);
    await expect(dialog.getByLabel(remaining + " attempts remaining")).toBeVisible();
  }
  await dialog.getByRole("button", { name: "Show solution", exact: true }).click();
  await expect(dialog.locator(".chess__solution")).toContainText("#");
  await dialog.getByRole("button", { name: "Retry puzzle", exact: true }).click();
  await expect(dialog.getByLabel("3 attempts remaining")).toBeVisible();
  await dialog.getByRole("button", { name: "New random puzzle" }).click();
  expect((await currentPuzzle(dialog)).id).not.toBe(initial.id);
  await dialog.getByLabel("Difficulty", { exact: true }).selectOption("advanced");
  const advanced = await currentPuzzle(dialog);
  expect(advanced.level).toBe("advanced");
  for (let step = 0; step < advanced.line.length; step += 2) {
    await play(dialog, advanced.line[step]);
    if (step + 1 < advanced.line.length) await expect(dialog.getByRole("grid")).toHaveAttribute("aria-busy", "false");
  }
  await expect(dialog.getByRole("status").first()).toContainText("You found the finish");
  await expect(dialog.getByLabel("3 attempts remaining")).toBeVisible();
  await expect(dialog.locator(".chess__session")).toHaveText("1/3 solved");
  await dialog.getByRole("button", { name: "New random puzzle" }).click();
  expect((await currentPuzzle(dialog)).id).not.toBe(advanced.id);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("chess-studio.png") });
  const access = await new AxeBuilder({ page }).include(".chess").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(access.violations).toEqual([]);
  await dialog.getByRole("button", { name: "Close puzzle", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: /Playing Chess/ }).click();
  expect((await currentPuzzle(dialog)).id).not.toBe(initial.id);
  if (testInfo.project.name === "chromium-desktop") {
    await dialog.getByLabel("Difficulty", { exact: true }).selectOption("intermediate");
    for (let i = 0; i < 8 && (await currentPuzzle(dialog)).id !== "001w5"; i++) await dialog.getByRole("button", { name: "New random puzzle" }).click();
    const promotionPuzzle = await currentPuzzle(dialog);
    expect(promotionPuzzle.id).toBe("001w5");
    for (let step = 0; step < promotionPuzzle.line.length; step += 2) {
      await play(dialog, promotionPuzzle.line[step]);
      if (step + 1 < promotionPuzzle.line.length) await expect(dialog.getByRole("grid")).toHaveAttribute("aria-busy", "false");
    }
    await expect(dialog.getByRole("status").first()).toContainText("You found the finish");
  }
});

test("laptop hero fits naturally and window glyphs reveal on hover", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Laptop pointer/layout regression.");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator(".scroll-progress")).toHaveCount(0);
  expect(await page.locator(".hero__name").evaluate((node) => parseFloat(getComputedStyle(node).fontSize))).toBeLessThanOrEqual(72);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const backgroundPaints = await page.evaluate(async () => {
    let mutations = 0;
    const observer = new MutationObserver(() => mutations++);
    observer.observe(document.querySelector(".cosmos__stars"), { attributes: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    observer.disconnect(); return mutations;
  });
  expect(backgroundPaints).toBe(0);
  await page.waitForTimeout(1500);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  const before = (await cdp.send("Performance.getMetrics")).metrics;
  await page.waitForTimeout(3000);
  const after = (await cdp.send("Performance.getMetrics")).metrics;
  const metric = (name) => after.find((item) => item.name === name).value - before.find((item) => item.name === name).value;
  const metricsFile = testInfo.outputPath("laptop-idle-metrics.json");
  writeFileSync(metricsFile, JSON.stringify({ idleSeconds: 3, scriptMs: metric("ScriptDuration") * 1000, taskMs: metric("TaskDuration") * 1000, layouts: metric("LayoutCount"), styleRecalculations: metric("RecalcStyleCount") }));
  await testInfo.attach("laptop-idle-metrics", { path: metricsFile, contentType: "application/json" });
  await page.screenshot({ path: testInfo.outputPath("laptop-refinement.png") });
  await page.getByRole("button", { name: "Open terminal", exact: true }).click();
  const controls = page.getByRole("group", { name: "terminal window controls" });
  await page.mouse.move(500, 500);
  await expect(controls.locator("svg").first()).toHaveCSS("opacity", "0");
  await expect.poll(() => controls.locator("button").evaluateAll((buttons) => buttons[1].getBoundingClientRect().x - buttons[0].getBoundingClientRect().x)).toBeCloseTo(20, 2);
  await controls.hover();
  await expect(controls.locator("svg").first()).toHaveCSS("opacity", "0.85");
  await page.screenshot({ path: testInfo.outputPath("mac-window-controls.png") });
});
