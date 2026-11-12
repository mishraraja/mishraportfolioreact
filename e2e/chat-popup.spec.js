const { test, expect } = require("@playwright/test");

test("Ask popup stays visible when portfolio motion is paused", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?skipIntro=1");
  await page.evaluate(() => document.documentElement.setAttribute("data-motion", "paused"));

  await page.getByRole("button", { name: "Ask about this site" }).click();

  const dialog = page.getByRole("dialog", { name: "Ask about this site" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS("opacity", "1");
  await expect(page.getByLabel("Your question")).toBeFocused();
});
