import { useEffect, useState } from "react";
import { profile } from "../data/profile";

const USERNAME = (profile.social.github || "").split("/").filter(Boolean).pop() || "mishraraja";
const SNAPSHOT_URL = "/data/github.json";
const CACHE_KEY = "rm.gh.cache.v1";
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

function readCache() {
  try {
    const raw = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
    if (raw && Date.now() - raw.at < CACHE_TTL) return raw.data;
  } catch {
    /* ignore */
  }
  return null;
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* ignore */
  }
}

function shapeRepos(repos) {
  return repos
    .filter((r) => !r.fork && !r.archived)
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
    }));
}

/**
 * Live GitHub profile + repositories, with a three-tier strategy so the
 * numbers on the page are never stale and never blank:
 *
 *   1. session cache      — instant on repeat views
 *   2. build-time snapshot — committed daily by the refresh workflow
 *   3. live GitHub API     — the freshest data, fetched in the background
 *
 * The snapshot renders immediately; the live call quietly upgrades it.
 */
export function useGithubData() {
  const [data, setData] = useState(() => readCache());
  const [status, setStatus] = useState(() => (readCache() ? "ready" : "loading"));

  useEffect(() => {
    let alive = true;

    async function loadSnapshot() {
      try {
        const res = await fetch(SNAPSHOT_URL, { cache: "no-cache" });
        if (!res.ok) return null;
        const json = await res.json();
        if (alive && json && json.user) {
          setData((prev) => prev || json);
          setStatus((s) => (s === "loading" ? "ready" : s));
        }
        return json;
      } catch {
        return null;
      }
    }

    async function loadLive() {
      try {
        const headers = { Accept: "application/vnd.github+json" };
        const [userRes, repoRes] = await Promise.all([
          fetch(`https://api.github.com/users/${USERNAME}`, { headers }),
          fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=pushed`, { headers }),
        ]);

        // Unauthenticated GitHub calls are rate limited; fall back silently.
        if (!userRes.ok || !repoRes.ok) return null;

        const user = await userRes.json();
        const repos = await repoRes.json();
        if (!Array.isArray(repos)) return null;

        const languages = {};
        repos.forEach((r) => {
          if (r.language && !r.fork) languages[r.language] = (languages[r.language] || 0) + 1;
        });

        return {
          generatedAt: new Date().toISOString(),
          source: "live",
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
            repos: repos.filter((r) => !r.fork).length,
            stars: repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0),
            forks: repos.reduce((sum, r) => sum + (r.forks_count || 0), 0),
          },
          languages: Object.entries(languages)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name, count]) => ({ name, count })),
          repos: shapeRepos(repos),
        };
      } catch {
        return null;
      }
    }

    (async () => {
      if (!readCache()) await loadSnapshot();
      const live = await loadLive();
      if (!alive) return;

      if (live) {
        setData(live);
        writeCache(live);
        setStatus("ready");
      } else {
        setStatus((s) => (s === "loading" ? "offline" : s));
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { data, status, username: USERNAME };
}
