import { renderHook, waitFor } from "@testing-library/react";
import { useGithubData } from "./useGithubData";

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; sessionStorage.clear(); });

test("live totals exclude forked repositories, matching snapshot totals", async () => {
  sessionStorage.clear();
  global.fetch = jest.fn(async (url) => ({ ok: true, json: async () => {
    if (url === "/data/github.json") return { user: { login: "mishraraja" }, source: "snapshot" };
    if (url.includes("/repos?")) return [
      { id: 1, name: "original", fork: false, stargazers_count: 2, forks_count: 3, language: "Java" },
      { id: 2, name: "fork", fork: true, stargazers_count: 100, forks_count: 50, language: "Python" },
    ];
    return { login: "mishraraja", public_repos: 2 };
  } }));
  const { result } = renderHook(useGithubData);
  await waitFor(() => expect(result.current.data?.source).toBe("live"));
  expect(result.current.data.totals).toEqual({ repos: 1, stars: 2, forks: 3 });
  expect(result.current.data.repos.map((repo) => repo.name)).toEqual(["original"]);
});

test("reports offline when neither snapshot nor live data can load", async () => {
  sessionStorage.clear();
  global.fetch = jest.fn().mockRejectedValue(new Error("offline"));
  const { result } = renderHook(useGithubData);
  await waitFor(() => expect(result.current.status).toBe("offline"));
  expect(result.current.data).toBeNull();
});
