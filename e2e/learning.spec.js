const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

for (const [route, title] of [["/learning", "Progress and revision"], ["/engineering", "Building a portfolio with interactive learning tools"]]) {
  test(`${route}: mobile layout and accessible content`, async ({ page }) => {
    await page.goto(route + "?skipIntro=1");
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    const report = await new AxeBuilder({ page }).include(".learning-page").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(report.violations).toEqual([]);
  });
}

test("restore requires confirmation and rejects malformed data", async ({ page }) => {
  await page.goto("/learning?skipIntro=1");
  const input = page.getByLabel("Choose backup file");
  await input.setInputFiles({ name: "invalid.json", mimeType: "application/json", buffer: Buffer.from("{") });
  await expect(page.getByRole("status")).toContainText("not valid JSON");
  const backup = { format: "raja-learning-backup", version: 1, data: { dsa: { xp: 35, problems: {}, days: [], predict: { right: 0, total: 0 }, radarBest: 0, last: null }, java: null, reviews: null } };
  await input.setInputFiles({ name: "progress.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(page.getByRole("heading", { name: "Review this backup" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("rm.dsa.progress.v1"))).toBeNull();
  await page.getByRole("button", { name: "Replace progress with this backup" }).click();
  await expect(page.getByRole("status")).toContainText("Progress restored");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("rm.dsa.progress.v1")).xp)).toBe(35);
});

test("saved learning routes open offline, and removal preserves progress", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Service-worker offline simulation runs in Chromium.");
  await page.goto("/learning?skipIntro=1");
  await page.getByRole("button", { name: "Save learning pages offline" }).click();
  await expect(page.getByRole("status")).toContainText("Learning pages saved", { timeout: 45000 });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
    localStorage.setItem("offline-test-marker", "keep");
  });
  await context.setOffline(true);
  await page.goto("/dsa?skipIntro=1");
  await expect(page.locator(".arcade")).toBeVisible();
  await page.goto("/java?skipIntro=1");
  await expect(page.locator(".jarcade")).toBeVisible();
  await page.goto("/learning?skipIntro=1");
  await page.getByRole("button", { name: "Remove offline downloads" }).click();
  await expect(page.getByRole("status")).toContainText("Offline downloads removed");
  expect(await page.evaluate(() => localStorage.getItem("offline-test-marker"))).toBe("keep");
  expect(await page.evaluate(async () => (await caches.keys()).filter((k) => k.startsWith("rm-learning-")))).toEqual([]);
  await context.setOffline(false);
});
