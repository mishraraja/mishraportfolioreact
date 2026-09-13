import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ACHIEVEMENTS, TOTAL_ACHIEVEMENTS, getAchievement, rankFor } from "../lib/achievements";
import { setSoundEnabled, sfx } from "../lib/sound";

export const THEMES = [
  { id: "midnight", label: "Midnight", swatch: "#8b7bff" },
  { id: "solar", label: "Solar", swatch: "#ffa83d" },
  { id: "matrix", label: "Matrix", swatch: "#3dff96" },
  { id: "blueprint", label: "Blueprint", swatch: "#4db8ff" },
  { id: "daylight", label: "Daylight", swatch: "#5b46e5" },
];

const STORAGE_KEY = "rm.portfolio.state.v1";

const ExperienceContext = createContext(null);

function readStored() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch {
    // Private browsing, blocked storage, corrupted JSON — all non-fatal.
    return {};
  }
}

function writeStored(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — the site still works, it just forgets */
  }
}

export function ExperienceProvider({ children }) {
  const stored = useRef(readStored()).current;

  const [theme, setThemeState] = useState(stored.theme || "midnight");
  const [soundOn, setSoundOn] = useState(Boolean(stored.soundOn));
  const [retro, setRetro] = useState(false);
  const [unlocked, setUnlocked] = useState(() => new Set(stored.unlocked || []));
  const [seenThemes, setSeenThemes] = useState(() => new Set(stored.seenThemes || [stored.theme || "midnight"]));
  const [toast, setToast] = useState(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [trophyOpen, setTrophyOpen] = useState(false);
  const [chessOpen, setChessOpen] = useState(false);
  const [confettiBurst, setConfettiBurst] = useState(0);

  const toastTimer = useRef(null);

  /* ---------------- persistence ---------------- */
  useEffect(() => {
    writeStored({
      theme,
      soundOn,
      unlocked: [...unlocked],
      seenThemes: [...seenThemes],
    });
  }, [theme, soundOn, unlocked, seenThemes]);

  /* ---------------- theme -> DOM ---------------- */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    const swatch = THEMES.find((t) => t.id === theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && swatch) {
      meta.setAttribute("content", theme === "daylight" ? "#f7f6f3" : "#08080b");
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-retro", retro ? "on" : "off");
  }, [retro]);

  useEffect(() => {
    setSoundEnabled(soundOn);
  }, [soundOn]);

  /* ---------------- achievements ---------------- */
  const unlock = useCallback(
    (id) => {
      const meta = getAchievement(id);
      if (!meta) return;
      setUnlocked((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);

        // Defer the celebration out of the state updater.
        queueMicrotask(() => {
          sfx.unlock();
          setToast({ ...meta, count: next.size });
          clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setToast(null), 4200);
          if (next.size === TOTAL_ACHIEVEMENTS) {
            setConfettiBurst((c) => c + 1);
          }
        });

        return next;
      });
    },
    []
  );

  const hasUnlocked = useCallback((id) => unlocked.has(id), [unlocked]);

  const resetProgress = useCallback(() => {
    setUnlocked(new Set());
    setSeenThemes(new Set([theme]));
    setRetro(false);
  }, [theme]);

  /* ---------------- theme switching ---------------- */
  // Mirrors `theme` but advances synchronously, so several presses of T in the
  // same tick step through several themes instead of all reading one stale value.
  const themeRef = useRef(theme);

  const setTheme = useCallback(
    (id) => {
      themeRef.current = id;
      setThemeState(id);
      sfx.click();
      setSeenThemes((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        if (next.size >= THEMES.length) queueMicrotask(() => unlock("chromatic"));
        return next;
      });
    },
    [unlock]
  );

  const cycleTheme = useCallback(() => {
    const i = THEMES.findIndex((t) => t.id === themeRef.current);
    setTheme(THEMES[(i + 1) % THEMES.length].id);
  }, [setTheme]);

  /* ---------------- sound ---------------- */
  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      if (next) {
        sfx.open();
        queueMicrotask(() => unlock("audiophile"));
      }
      return next;
    });
  }, [unlock]);

  const fireConfetti = useCallback(() => setConfettiBurst((c) => c + 1), []);

  const toggleRetro = useCallback(() => {
    setRetro((r) => {
      const next = !r;
      if (next) {
        sfx.konami();
        queueMicrotask(() => {
          unlock("konami");
          setConfettiBurst((c) => c + 1);
        });
      }
      return next;
    });
  }, [unlock]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      cycleTheme,
      themes: THEMES,
      soundOn,
      toggleSound,
      retro,
      setRetro,
      toggleRetro,
      unlocked,
      unlockedCount: unlocked.size,
      total: TOTAL_ACHIEVEMENTS,
      rank: rankFor(unlocked.size),
      achievements: ACHIEVEMENTS,
      unlock,
      hasUnlocked,
      resetProgress,
      toast,
      dismissToast: () => setToast(null),
      terminalOpen,
      setTerminalOpen,
      trophyOpen,
      setTrophyOpen,
      chessOpen,
      setChessOpen,
      confettiBurst,
      fireConfetti,
    }),
    [
      theme, setTheme, cycleTheme, soundOn, toggleSound, retro, toggleRetro, unlocked,
      unlock, hasUnlocked, resetProgress, toast, terminalOpen, trophyOpen, chessOpen,
      confettiBurst, fireConfetti,
    ]
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience() {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error("useExperience must be used inside <ExperienceProvider>");
  return ctx;
}
