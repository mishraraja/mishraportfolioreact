const { test, expect } = require("@playwright/test");

test("atmosphere and motion preferences persist without delaying the portfolio", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator(".loader")).toHaveCount(0);
  if (testInfo.project.name === "chromium-desktop") await page.screenshot({ path: testInfo.outputPath("hero-nebula.png") });
  await page.getByRole("group", { name: "Hero colour theme" }).getByRole("button", { name: "Cyberpunk", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "cyberpunk");
  await page.getByRole("button", { name: "Pause ambient motion", exact: true }).click();
  await expect(page.locator(".cosmos__stars")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-motion", "paused");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "cyberpunk");
  await expect(page.getByRole("button", { name: "Resume ambient motion" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".cosmos__stars")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("hero-cyberpunk.png") });
  await page.getByRole("button", { name: "Resume ambient motion" }).click();
  await expect(page.locator(".cosmos__stars")).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".cosmos__stars")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("project filters, diagrams and details work together", async ({ page }, testInfo) => {
  await page.goto("/?skipIntro=1");
  const filters = page.getByRole("group", { name: "Filter projects" });
  await filters.getByRole("button", { name: /Desktop/ }).click();
  await expect(page.locator(".project-card")).toHaveCount(2);
  await expect(page.locator(".project-blueprint")).toHaveCount(2);
  await expect(page.locator(".projects__count")).toHaveText("02 projects / selected work");
  await page.locator(".project-story__details summary").first().click();
  await expect(page.locator(".project-story__details[open] dd").first()).toBeVisible();
  await filters.getByRole("button", { name: /All work/ }).click();
  await expect(page.locator(".project-card")).toHaveCount(4);
  await page.locator("#projects").scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("projects.png") });
});

test("API and activity downloads wait until their sections are approached", async ({ page }) => {
  const downloaded = [];
  page.on("request", (request) => downloaded.push(request.url()));
  await page.goto("/");
  await expect(page.locator("main h1")).toBeVisible();
  expect(downloaded.some((url) => /\/assets\/(ApiConsole|GithubActivity)-.*\.js/.test(url))).toBe(false);
  await page.locator("#api").scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Send", exact: true })).toBeVisible();
  await page.locator("#github").scrollIntoViewIfNeeded();
  await expect(page.locator("#github h2")).toBeVisible();
});

test("learning surfaces retain their new interface at every viewport", async ({ page }, testInfo) => {
  for (const path of ["/dsa", "/java", "/learning", "/engineering"]) {
    await page.goto(path);
    await expect(page.locator("main h1").first()).toBeVisible();
    if (path === "/dsa" || path === "/java") await expect(page.locator(".arcade-signal")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(path.slice(1) + ".png") });
  }
});
