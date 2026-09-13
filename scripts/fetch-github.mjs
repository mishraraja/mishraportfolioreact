#!/usr/bin/env node
/**
 * Builds public/data/github.json — the snapshot the site renders instantly
 * before (and instead of, when rate limited) the live API call.
 *
 * Run locally with `npm run data:refresh`, or automatically every day by
 * .github/workflows/refresh-data.yml, which commits the result.
 *
 * Set GITHUB_TOKEN to lift the 60 req/hour unauthenticated rate limit.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../public/data/github.json");
const USERNAME = process.env.GH_USERNAME || "mishraraja";

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "raja-portfolio-refresh",
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

async function api(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub ${path} -> ${res.status} ${res.statusText}`);
  return res.json();
}

async function main() {
  console.log(`Fetching GitHub data for @${USERNAME}…`);

  const user = await api(`/users/${USERNAME}`);
  const repos = await api(`/users/${USERNAME}/repos?per_page=100&sort=pushed`);

  const own = repos.filter((r) => !r.fork);

  const languages = {};
  own.forEach((r) => {
    if (r.language) languages[r.language] = (languages[r.language] || 0) + 1;
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "snapshot",
    user: {
      login: user.login,
      name: user.name,
      avatar: user.avatar_url,
      bio: user.bio,
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      createdAt: user.created_at,
      url: user.html_url,
    },
    totals: {
      repos: own.length,
      stars: own.reduce((s, r) => s + (r.stargazers_count || 0), 0),
      forks: own.reduce((s, r) => s + (r.forks_count || 0), 0),
    },
    languages: Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count })),
    repos: own
      .filter((r) => !r.archived)
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
      .slice(0, 6)
      .map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        url: r.html_url,
        homepage: r.homepage,
        language: r.language,
        stars: r.stargazers_count,
        forks: r.forks_count,
        pushedAt: r.pushed_at,
        topics: r.topics || [],
      })),
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(
    `Wrote ${OUT}\n  repos: ${payload.totals.repos}  stars: ${payload.totals.stars}  followers: ${payload.user.followers}`
  );
}

main().catch((err) => {
  console.error(`Refresh failed: ${err.message}`);
  // Never fail the build over a rate limit — the committed snapshot stands.
  process.exit(process.env.STRICT === "1" ? 1 : 0);
});
