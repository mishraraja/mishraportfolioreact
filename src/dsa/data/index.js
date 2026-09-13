import { WORLDS } from "./worlds";
import { arrays } from "./problems/arrays";
import { stringProblems } from "./problems/strings";
import { listProblems } from "./problems/lists";
import { treeProblems } from "./problems/trees";
import { graphProblems } from "./problems/graphs";
import { matrixProblems } from "./problems/matrix";
import { intervalProblems } from "./problems/intervals";
import { heapProblems } from "./problems/heaps";
import { bitProblems } from "./problems/bits";
import { dpProblems } from "./problems/dp";

const ALL = [
  ...arrays,
  ...stringProblems,
  ...listProblems,
  ...treeProblems,
  ...graphProblems,
  ...matrixProblems,
  ...intervalProblems,
  ...heapProblems,
  ...bitProblems,
  ...dpProblems,
];

const worldOrder = new Map(WORLDS.map((w, i) => [w.id, i]));

/** Every problem, grouped in world order. */
export const PROBLEMS = [...ALL].sort((a, b) => worldOrder.get(a.world) - worldOrder.get(b.world));

const bySlug = new Map(PROBLEMS.map((p) => [p.slug, p]));

export function getProblem(slug) {
  return bySlug.get(slug);
}

export function problemsInWorld(worldId) {
  return PROBLEMS.filter((p) => p.world === worldId);
}

export function problemsForPattern(patternId) {
  return PROBLEMS.filter((p) => p.pattern === patternId);
}

/** The problems either side of this one in arcade order. */
export function neighbours(slug) {
  const i = PROBLEMS.findIndex((p) => p.slug === slug);
  return { prev: PROBLEMS[i - 1] || null, next: PROBLEMS[i + 1] || null };
}

export const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export function leetcodeUrl(problem) {
  return "https://leetcode.com/problems/" + problem.slug + "/";
}
