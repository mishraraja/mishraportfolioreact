const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

test("the first paint is light and old automatic dark preferences migrate", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("rm.portfolio.state.v1", JSON.stringify({ theme: "nebula" })));
  await page.route("**/assets/index-*.js", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "observatory");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#f7f6f3");
});

test("the systems lab animates a complete request and supports manual exploration", async ({ page }, testInfo) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("group", { name: "System visualisation" }).getByRole("button", { name: "Request flow" }).click();
  await expect(page.getByRole("heading", { name: "A request arrives." })).toBeVisible();
  await page.locator(".hero__visual").scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("request-flow.png") });
  await page.getByRole("button", { name: "Trace a request" }).click();
  await expect(page.locator(".request-flow__actions [role=status]")).toHaveText("200 OK · simulation complete", { timeout: 12000 });
  await page.getByRole("group", { name: "Request stages" }).getByRole("button", { name: /API$/ }).click();
  await expect(page.getByRole("heading", { name: "A request arrives." })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Next step" }).click();
  await expect(page.getByRole("heading", { name: "Give the request a purpose." })).toBeVisible();
  await expect(page.locator(".request-flow__readout > div")).toHaveCSS("opacity", "1");
  const accessibility = await new AxeBuilder({ page }).include(".hero__visual").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("terminal follows every theme, stays readable and returns keyboard focus", async ({ page }, testInfo) => {
  test.setTimeout(120000);
  await page.goto("/");
  const opener = page.getByRole("button", { name: "Open terminal", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Interactive terminal" });
  await expect(dialog.getByRole("heading", { name: "Raja Mishra", exact: true })).toBeVisible();
  await expect(dialog).toHaveCSS("opacity", "1");
  const input = dialog.getByLabel("Terminal input");
  for (const theme of ["observatory", "nebula", "supernova", "deepfield", "solar", "cyberpunk"]) {
    await input.fill("theme " + theme); await input.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const colours = await page.evaluate(() => {
      const tokens = getComputedStyle(document.documentElement);
      const rgb = (name) => {
        const value = tokens.getPropertyValue(name).trim().replace("#", "");
        const hex = value.length === 3 ? [...value].map((digit) => digit + digit).join("") : value;
        return "rgb(" + [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)).join(", ") + ")";
      };
      return { bg: rgb("--color-surface"), fg: rgb("--color-fg") };
    });
    await expect(dialog).toHaveCSS("background-color", colours.bg);
    await expect(input).toHaveCSS("color", colours.fg);
    await expect(dialog.locator(".term__line--out").last()).toHaveCSS("color", colours.fg);
    const accessibility = await new AxeBuilder({ page }).include(".term").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(accessibility.violations, theme).toEqual([]);
    if (theme === "observatory") await page.screenshot({ path: testInfo.outputPath("terminal-observatory.png") });
  }
  await input.press("Tab"); await expect(dialog.getByRole("button", { name: "Close terminal" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible(); await expect(opener).toBeFocused();
});

test("window controls close, minimize, restore and expand without losing the session", async ({ page }, testInfo) => {
  test.setTimeout(90000);
  await page.goto("/");
  await page.getByRole("button", { name: "Open terminal", exact: true }).click();
  const terminal = page.getByRole("dialog", { name: "Interactive terminal" });
  const input = terminal.getByLabel("Terminal input");
  await input.fill("echo retained-session"); await input.press("Enter");
  const normal = await terminal.boundingBox();
  await terminal.getByRole("button", { name: "Maximize terminal", exact: true }).click();
  await expect(terminal.getByRole("button", { name: "Restore terminal", exact: true })).toHaveAttribute("aria-pressed", "true");
  const expanded = await terminal.boundingBox();
  expect(expanded.height).toBeGreaterThan(normal.height);
  await terminal.getByRole("button", { name: "Restore terminal", exact: true }).click();
  await terminal.getByRole("button", { name: "Minimize terminal", exact: true }).click();
  await expect(terminal).not.toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  if (page.viewportSize().width <= 880) {
    const minimized = await page.locator(".term-minimized").boundingBox();
    const dock = await page.locator(".dock").boundingBox();
    expect(minimized.y + minimized.height).toBeLessThan(dock.y);
  }
  await page.getByRole("button", { name: "Restore terminal", exact: true }).click();
  await expect(terminal.locator(".term__line--out")).toHaveText("retained-session");
  await input.press("ArrowUp"); await expect(input).toHaveValue("echo retained-session");
  await expect(terminal.getByRole("button", { name: "Close terminal", exact: true })).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath("working-terminal.png") });
  await terminal.getByRole("button", { name: "Close terminal", exact: true }).click();
  await expect(terminal).not.toBeVisible();
  await expect(page.locator(".term-minimized")).toHaveCount(0);
  await page.goto("/java");
  await page.getByRole("button", { name: "Open terminal", exact: true }).click();
  await terminal.getByLabel("Terminal input").fill("chess"); await terminal.getByLabel("Terminal input").press("Enter");
  const puzzle = page.getByRole("dialog", { name: "Chess puzzle studio" });
  await expect(puzzle).toBeVisible();
  await puzzle.getByRole("button", { name: "Close puzzle", exact: true }).click();
  await expect(puzzle).not.toBeVisible();
  await page.getByRole("button", { name: /^Secrets found:/ }).click();
  const secrets = page.getByRole("dialog", { name: "Secrets found" });
  await expect(secrets).toBeVisible();
  await secrets.getByRole("button", { name: "Close secrets", exact: true }).click();
  await expect(secrets).not.toBeVisible();
  await page.keyboard.press("Control+k");
  const palette = page.getByRole("dialog", { name: "Command palette" });
  await expect(palette).toBeVisible();
  await palette.getByRole("button", { name: "Close command palette", exact: true }).click();
  await expect(palette).not.toBeVisible();
  if (page.viewportSize().width < 768) {
    const menuOpener = page.getByRole("button", { name: "Open menu", exact: true });
    await menuOpener.click();
    const menu = page.getByRole("dialog", { name: "Mobile navigation" });
    await menu.getByRole("button", { name: "Close menu", exact: true }).click();
    await expect(menu).not.toBeVisible();
    await expect(menuOpener).toBeFocused();
  }
});

test("the engineering atlas connects each discipline with keyboard controls", async ({ page }, testInfo) => {
  await page.goto("/");
  const layers = page.getByRole("group", { name: "Engineering disciplines" });
  await layers.getByRole("button", { name: /Data & Messaging/ }).click();
  await expect(layers.getByRole("button", { name: /Data & Messaging/ })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Tab"); await page.keyboard.press("Enter");
  await expect(layers.getByRole("button", { name: /Full Stack Delivery/ })).toHaveAttribute("aria-pressed", "true");
  await page.locator("#about").scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("engineering-atlas.png") });
});

test("atmosphere and motion preferences persist without delaying the portfolio", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.getByText("Inspector", { exact: true })).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "observatory");
  await expect(page.getByText("Choose your atmosphere")).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Hero colour theme" })).toHaveCount(0);
  await expect(page.locator(".loader")).toHaveCount(0);
  const brand = await page.locator(".hero__name").boundingBox();
  const navigation = await page.locator("header.nav").boundingBox();
  expect(brand.y).toBeGreaterThan(navigation.y + navigation.height);
  await page.screenshot({ path: testInfo.outputPath("hero-observatory.png") });
  await page.getByRole("button", { name: "Change colour theme" }).click();
  await page.getByRole("button", { name: "Theme: Cyberpunk", exact: true }).click();
  await page.getByRole("button", { name: "Change colour theme" }).click();
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
  await page.getByRole("button", { name: /^Project details/ }).first().click();
  await expect(page.locator(".project-story__details dd").first()).toBeVisible();
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
