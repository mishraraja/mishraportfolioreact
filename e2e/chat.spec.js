const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

test("chat works without AI, fits the viewport and restores keyboard focus", async ({ page }) => {
  await page.route("**/api/chat", (route) => route.fulfill({ contentType: "application/json", body: '{"aiEnabled":false}' }));
  await page.goto("/learning?skipIntro=1");
  const launcher = page.getByRole("button", { name: "Ask about this site" });
  await launcher.click();
  const dialog = page.getByRole("dialog", { name: "Ask about this site" });
  await expect(dialog).toBeVisible();
  await page.getByLabel("Your question", { exact: true }).fill("Explain Two Sum");
  await page.getByLabel("Your question", { exact: true }).press("Enter");
  await expect(dialog.getByRole("link", { name: "Two Sum", exact: true })).toHaveAttribute("href", "/dsa/two-sum");
  const bounds = await dialog.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
  const results = await new AxeBuilder({ page }).include(".site-chat").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(results.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(launcher).toBeFocused();
});
