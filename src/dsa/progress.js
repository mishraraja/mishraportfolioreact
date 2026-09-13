import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useExperience } from "../context/ExperienceContext";
import { sfx } from "../lib/sound";

/**
 * Progress for the arcade: XP, levels, a daily streak and spaced review.
 * Everything lives in localStorage — no account, no server, nothing to sign up for.
 */

const STORAGE_KEY = "rm.dsa.progress.v1";
const DAY_MS = 24 * 60 * 60 * 1000;

export const XP = { watch: 10, master: 25, review: 10, predict: 3, radarPerHit: 2, radarCap: 20 };

export const LEVELS = [
  { min: 0, name: "Hello, World", emoji: "🌱" },
  { min: 60, name: "Loop Rookie", emoji: "🔁" },
  { min: 180, name: "Pointer Pilot", emoji: "🛩️" },
  { min: 360, name: "Window Wizard", emoji: "🪟" },
  { min: 600, name: "Recursion Ranger", emoji: "🌀" },
  { min: 900, name: "Graph Explorer", emoji: "🧭" },
  { min: 1300, name: "DP Sensei", emoji: "🥋" },
  { min: 1800, name: "Algorithm Astronaut", emoji: "🧑‍🚀" },
];

/** Days to wait before each successive review of a mastered problem. */
export const REVIEW_DAYS = [2, 5, 12, 30];

const EMPTY = {
  xp: 0,
  problems: {},
  days: [],
  predict: { right: 0, total: 0 },
  radarBest: 0,
  last: null,
};

function read() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    return parsed && typeof parsed === "object" ? { ...EMPTY, ...parsed } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function write(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage blocked — progress lasts for this visit only */
  }
}

function dayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

function withToday(state) {
  const today = dayKey(new Date());
  if (state.days[state.days.length - 1] === today) return state;
  return { ...state, days: [...state.days, today].slice(-120) };
}

export function levelIndex(xp) {
  let index = 0;
  LEVELS.forEach((level, i) => {
    if (xp >= level.min) index = i;
  });
  return index;
}

export function streakOf(days) {
  const all = new Set(days);
  const cursor = new Date();
  if (!all.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (all.has(dayKey(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function isDue(record, now = Date.now()) {
  if (!record || !record.mastered) return false;
  const wait = REVIEW_DAYS[Math.min(record.reviews || 0, REVIEW_DAYS.length - 1)];
  return now - (record.reviewedAt || 0) >= wait * DAY_MS;
}

export function daysUntilDue(record, now = Date.now()) {
  const wait = REVIEW_DAYS[Math.min(record.reviews || 0, REVIEW_DAYS.length - 1)];
  return Math.max(0, Math.ceil((record.reviewedAt + wait * DAY_MS - now) / DAY_MS));
}

const ProgressContext = createContext(null);

export function DsaProgressProvider({ children }) {
  const { fireConfetti } = useExperience();
  const [state, setState] = useState(read);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    write(state);
  }, [state]);

  const notify = useCallback((message, icon = "✨") => {
    setToast({ message, icon, key: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Level-ups are detected from the committed value, so a double-invoked
  // state updater can never celebrate twice.
  const levelRef = useRef(levelIndex(state.xp));
  useEffect(() => {
    const now = levelIndex(state.xp);
    if (now > levelRef.current) {
      const level = LEVELS[now];
      notify("Level up — you are now a " + level.name, level.emoji);
      sfx.unlock();
      fireConfetti();
    }
    levelRef.current = now;
  }, [state.xp, notify, fireConfetti]);

  const patchProblem = useCallback((slug, patch, xp = 0) => {
    setState((prev) => {
      const current = prev.problems[slug] || {};
      return withToday({
        ...prev,
        xp: prev.xp + xp,
        problems: { ...prev.problems, [slug]: { ...current, ...patch } },
      });
    });
  }, []);

  const visit = useCallback(
    (slug) => {
      setState((prev) => {
        const current = prev.problems[slug] || {};
        if (current.seen && prev.last === slug) return withToday(prev);
        return withToday({
          ...prev,
          last: slug,
          problems: { ...prev.problems, [slug]: { ...current, seen: true } },
        });
      });
    },
    []
  );

  const watched = useCallback(
    (slug) => {
      if (stateRef.current.problems[slug]?.watched) return;
      patchProblem(slug, { watched: true, seen: true }, XP.watch);
      notify("+" + XP.watch + " XP — watched it all the way through", "🎬");
      sfx.success();
    },
    [patchProblem, notify]
  );

  const predicted = useCallback((correct) => {
    setState((prev) =>
      withToday({
        ...prev,
        xp: prev.xp + (correct ? XP.predict : 0),
        predict: { right: prev.predict.right + (correct ? 1 : 0), total: prev.predict.total + 1 },
      })
    );
  }, []);

  /** Returns what happened: "mastered" | "reviewed" | "early" */
  const mastered = useCallback(
    (slug) => {
      const record = stateRef.current.problems[slug] || {};
      const now = Date.now();

      if (!record.mastered) {
        patchProblem(slug, { mastered: true, seen: true, masteredAt: now, reviewedAt: now, reviews: 0 }, XP.master);
        notify("+" + XP.master + " XP — problem mastered", "⭐");
        fireConfetti();
        sfx.unlock();
        return "mastered";
      }

      if (isDue(record, now)) {
        patchProblem(slug, { reviewedAt: now, reviews: (record.reviews || 0) + 1 }, XP.review);
        notify("+" + XP.review + " XP — review done, memory strengthened", "🧠");
        sfx.success();
        return "reviewed";
      }

      return "early";
    },
    [patchProblem, notify, fireConfetti]
  );

  const radar = useCallback(
    (score, hits) => {
      const gained = Math.min(hits * XP.radarPerHit, XP.radarCap);
      setState((prev) => withToday({ ...prev, xp: prev.xp + gained, radarBest: Math.max(prev.radarBest, score) }));
      return gained;
    },
    []
  );

  const reset = useCallback(() => setState(EMPTY), []);

  const value = useMemo(() => {
    const index = levelIndex(state.xp);
    const level = LEVELS[index];
    const next = LEVELS[index + 1] || null;
    const levelProgress = next ? (state.xp - level.min) / (next.min - level.min) : 1;

    const statusOf = (slug) => {
      const record = state.problems[slug];
      if (!record) return "new";
      if (record.mastered) return "mastered";
      if (record.watched) return "watched";
      if (record.seen) return "seen";
      return "new";
    };

    return {
      state,
      xp: state.xp,
      level,
      next,
      levelProgress,
      streak: streakOf(state.days),
      statusOf,
      record: (slug) => state.problems[slug],
      visit,
      watched,
      predicted,
      mastered,
      radar,
      reset,
      notify,
    };
  }, [state, visit, watched, predicted, mastered, radar, reset, notify]);

  return (
    <ProgressContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.key}
            className="arcade-toast"
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="arcade-toast__icon" aria-hidden="true">
              {toast.icon}
            </span>
            {toast.message}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside <DsaProgressProvider>");
  return ctx;
}
