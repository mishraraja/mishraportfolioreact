const { test, expect } = require("@playwright/test");

test("native cursor stays visible with normal motion across themes and dialogs", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Desktop pointer regression; mobile navigation is covered separately.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?skipIntro=1");
  await expect(page.locator("main h1")).toBeVisible();
  await page.getByRole("button", { name: "Change colour theme" }).click();
  for (const theme of ["Nebula", "Supernova", "Deep Field", "Solar", "Observatory"]) {
    await page.getByRole("button", { name: "Theme: " + theme, exact: true }).click();
    await page.mouse.move(200, 200);
    await expect(page.locator("body")).not.toHaveCSS("cursor", "none");
    await expect(page.locator(".cursor-dot, .cursor-ring")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Open terminal", exact: true })).toHaveCSS("cursor", "pointer");
  }
  await page.getByRole("button", { name: "Change colour theme" }).click();
  await page.getByRole("button", { name: "Open terminal", exact: true }).click();
  const input = page.getByLabel("Terminal input");
  await expect(input).toBeVisible();
  await expect(input).not.toHaveCSS("cursor", "none");
  await page.emulateMedia({ forcedColors: "active" });
  await expect(input).not.toHaveCSS("cursor", "none");
  const response = await request.get("/");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
});

test("portfolio and arcade deep links render and navigate without runtime errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?skipIntro=1");
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/dsa/two-sum?skipIntro=1");
  await expect(page.getByRole("heading", { name: "Two Sum", exact: true, level: 1 })).toBeVisible();
  await page.getByRole("navigation", { name: "DSA Arcade", exact: true }).getByRole("link", { name: "Problems", exact: true }).click();
  await expect(page.locator("a.pcard")).toHaveCount(75);
  await page.locator('a.pcard[href="/dsa/two-sum"]').click();
  await expect(page.getByRole("heading", { name: "Two Sum", exact: true, level: 1 })).toBeVisible();
  await page.goto("/java/core-java?skipIntro=1");
  await expect(page.getByRole("heading", { name: "Core Java", exact: true, level: 1 })).toBeVisible();
  await page.getByRole("navigation", { name: "Backend Arcade", exact: true }).getByRole("link", { name: "Labs", exact: true }).click();
  await expect(page.locator("a.jlab")).toHaveCount(16);
  expect(errors).toEqual([]);
});
