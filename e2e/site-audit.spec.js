const { test, expect } = require("@playwright/test");
const { readFileSync, writeFileSync } = require("node:fs");
const AxeBuilder = require("@axe-core/playwright").default;

test("every sitemap page renders with valid internal links and assets", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Full crawl runs once; interaction tests cover all browsers.");
  test.setTimeout(240000);
  const paths = [...readFileSync("build/sitemap.xml", "utf8").matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const known = new Set(paths);
  const links = new Set();
  const ids = new Map();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.url().startsWith("http://127.0.0.1:4173/") && response.status() >= 400 && !response.url().endsWith("/api/chat")) errors.push(`${response.status()} ${response.url()}`);
  });
  for (const path of paths) {
    await page.goto(path + "?skipIntro=1");
    await expect(page.locator("main h1").first()).toBeVisible();
    if (path === "/") await expect(page.locator("#github")).toBeAttached();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://rajamishra.vercel.app" + path);
    await expect(page.locator("main")).not.toContainText("Whitelabel Error Page");
    if (path === "/" || path === "/dsa/two-sum") {
      for (const theme of ["nebula", "supernova", "deepfield", "solar", "observatory"]) {
        await page.evaluate((value) => { document.documentElement.dataset.theme = value; }, theme);
        const accessibility = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
        expect(accessibility.violations, `${path} in ${theme}`).toEqual([]);
      }
      await page.evaluate(() => { document.documentElement.dataset.theme = "nebula"; });
    }
    const content = await page.evaluate(() => ({
      links: [...document.querySelectorAll("a[href]")].map((a) => a.href),
      ids: [...document.querySelectorAll("[id]")].map((el) => el.id),
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
    }));
    expect(content.overflow, `Horizontal overflow at ${path}`).toBe(false);
    ids.set(path, new Set(content.ids));
    content.links.forEach((link) => links.add(link));
  }
  const files = new Set();
  for (const link of links) {
    const url = new URL(link);
    if (url.origin !== "http://127.0.0.1:4173") continue;
    if (/\.[a-z0-9]+$/i.test(url.pathname)) { files.add(url.pathname); continue; }
    if (!known.has(url.pathname)) errors.push(`Unknown internal link: ${link}`);
    if (url.hash && !ids.get(url.pathname)?.has(decodeURIComponent(url.hash.slice(1)))) errors.push(`Missing anchor: ${link}`);
  }
  for (const file of files) expect((await request.get(file)).ok(), `Missing file: ${file}`).toBe(true);
  const report = testInfo.outputPath("site-crawl.json");
  writeFileSync(report, JSON.stringify({ pages: paths.length, links: [...links], files: [...files], errors }, null, 2));
  await testInfo.attach("site-crawl", { path: report, contentType: "application/json" });
  expect(errors).toEqual([]);
});
