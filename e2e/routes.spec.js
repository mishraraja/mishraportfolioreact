const { test, expect } = require("@playwright/test");

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
