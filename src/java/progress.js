import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useExperience } from "../context/ExperienceContext";
import { dayKey, streakOf } from "../dsa/progress";
import { sfx } from "../lib/sound";

/**
 * Progress for the Backend Arcade: concepts understood, lab missions cleared,
 * boss fights won and game scores. Lives in localStorage, like the DSA Arcade.
 */

const STORAGE_KEY = "rm.java.progress.v1";

export const XP = { concept: 5, mission: 5, lab: 20, boss: 30, perfect: 10, gamePerHit: 2, gameCap: 20 };

export const LEVELS = [
  { min: 0, name: "Fresher", emoji: "🐣" },
  { min: 50, name: "Syntax Sprinter", emoji: "☕" },
  { min: 150, name: "Object Whisperer", emoji: "🧩" },
  { min: 300, name: "Collection Curator", emoji: "🗂️" },
  { min: 500, name: "Thread Tamer", emoji: "🧵" },
  { min: 750, name: "Bean Wrangler", emoji: "🫘" },
  { min: 1050, name: "Transaction Guardian", emoji: "🛡️" },
  { min: 1400, name: "Backend Architect", emoji: "🏛️" },
];

/** A boss fight is won with at most one mistake. */
export function passMark(total) {
  return Math.max(1, total - 1);
}

const EMPTY = {
  xp: 0,
  concepts: {},
  labs: {},
  bosses: {},
  games: {},
  days: [],
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

const ProgressContext = createContext(null);

export function JavaProgressProvider({ children }) {
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

  const visit = useCallback((where) => {
    setState((prev) => (prev.last === where ? withToday(prev) : withToday({ ...prev, last: where })));
  }, []);

  /** Marks a concept understood, or takes the mark (and its XP) back. */
  const toggleConcept = useCallback((id) => {
    const learned = Boolean(stateRef.current.concepts[id]);
    setState((prev) => {
      const concepts = { ...prev.concepts };
      if (learned) delete concepts[id];
      else concepts[id] = true;
      return withToday({ ...prev, concepts, xp: Math.max(0, prev.xp + (learned ? -XP.concept : XP.concept)) });
    });
    if (!learned) sfx.success();
    return !learned;
  }, []);

  /** Records one lab mission; clearing the last one clears the lab. */
  const mission = useCallback(
    (labId, missionId, total) => {
      const record = stateRef.current.labs[labId] || { missions: [], done: false };
      if (record.missions.includes(missionId)) return false;
      const missions = [...record.missions, missionId];
      const clears = !record.done && missions.length >= total;
      // Keep the ref current so two missions reached in one click both count.
      const next = { missions, done: record.done || clears };
      stateRef.current = { ...stateRef.current, labs: { ...stateRef.current.labs, [labId]: next } };
      setState((prev) =>
        withToday({
          ...prev,
          xp: prev.xp + XP.mission + (clears ? XP.lab : 0),
          labs: { ...prev.labs, [labId]: next },
        })
      );
      if (clears) {
        notify("+" + (XP.mission + XP.lab) + " XP — lab cleared, every mission done", "🏆");
        sfx.unlock();
        fireConfetti();
      } else {
        notify("+" + XP.mission + " XP — mission complete", "🎯");
        sfx.success();
      }
      return true;
    },
    [notify, fireConfetti]
  );

  /** Returns { won, firstWin, gained } for the boss fight that just ended. */
  const boss = useCallback(
    (worldId, score, total) => {
      const record = stateRef.current.bosses[worldId] || { best: 0, won: false, perfect: false };
      const won = score >= passMark(total);
      const firstWin = won && !record.won;
      const firstPerfect = score === total && !record.perfect;
      const gained = (firstWin ? XP.boss : 0) + (firstPerfect ? XP.perfect : 0);
      setState((prev) =>
        withToday({
          ...prev,
          xp: prev.xp + gained,
          bosses: {
            ...prev.bosses,
            [worldId]: { best: Math.max(record.best, score), won: record.won || won, perfect: record.perfect || score === total },
          },
        })
      );
      if (firstWin) fireConfetti();
      return { won, firstWin, gained };
    },
    [fireConfetti]
  );

  const game = useCallback((gameId, score, hits) => {
    const gained = Math.min(hits * XP.gamePerHit, XP.gameCap);
    setState((prev) =>
      withToday({
        ...prev,
        xp: prev.xp + gained,
        games: { ...prev.games, [gameId]: Math.max(prev.games[gameId] || 0, score) },
      })
    );
    return gained;
  }, []);

  const reset = useCallback(() => setState(EMPTY), []);

  const value = useMemo(() => {
    const index = levelIndex(state.xp);
    const level = LEVELS[index];
    const next = LEVELS[index + 1] || null;
    const levelProgress = next ? (state.xp - level.min) / (next.min - level.min) : 1;
    return {
      state,
      xp: state.xp,
      level,
      next,
      levelProgress,
      streak: streakOf(state.days),
      learned: (id) => Boolean(state.concepts[id]),
      labRecord: (id) => state.labs[id] || { missions: [], done: false },
      bossRecord: (id) => state.bosses[id] || null,
      visit,
      toggleConcept,
      mission,
      boss,
      game,
      reset,
      notify,
    };
  }, [state, visit, toggleConcept, mission, boss, game, reset, notify]);

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

export function useJavaProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useJavaProgress must be used inside <JavaProgressProvider>");
  return ctx;
}
