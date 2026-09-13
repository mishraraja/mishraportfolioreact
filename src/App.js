import { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { ExperienceProvider, useExperience } from "./context/ExperienceContext";
import { Loader } from "./components/Loader";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ScrollProgress } from "./components/ScrollProgress";
import { CustomCursor } from "./components/CustomCursor";
import { CommandPalette } from "./components/CommandPalette";
import { ControlDock } from "./components/ControlDock";
import { TrophyCase } from "./components/TrophyCase";
import { CosmicBackground } from "./components/background/CosmicBackground";
import { Confetti } from "./components/fx/Confetti";
import { AchievementToast } from "./components/fx/AchievementToast";
import { Terminal } from "./components/easter/Terminal";
import { ChessPuzzle } from "./components/easter/ChessPuzzle";
import { IdleNudge } from "./components/easter/IdleNudge";
import { Hero } from "./sections/Hero";
import { About } from "./sections/About";
import { Experience } from "./sections/Experience";
import { Projects } from "./sections/Projects";
import { ArcadeTeaser } from "./sections/Arcade";
import { Skills } from "./sections/Skills";
import { ApiConsole } from "./sections/ApiConsole";
import { Contact } from "./sections/Contact";
import { NotFound } from "./sections/NotFound";
import { useKonami, useTypedWord } from "./hooks/useKonami";
import { installConsoleEgg } from "./lib/consoleEgg";
import "./styles/tokens.css";
import "./styles/themes.css";
import "./styles/base.css";

const GithubActivity = lazy(() =>
  import("./sections/GithubActivity").then((m) => ({ default: m.GithubActivity }))
);

// The arcade is a whole app of its own — 75 problems and their animations —
// so it only downloads when someone actually opens it.
const DsaArcade = lazy(() => import("./dsa/DsaArcade"));

function Home() {
  const location = useLocation();

  // Section links followed from another page arrive with the section to land on.
  useEffect(() => {
    const target = location.state && location.state.scrollTo;
    if (!target) return undefined;
    const timer = setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
    }, 80);
    return () => clearTimeout(timer);
  }, [location.state]);

  return (
    <>
      <Hero />
      <About />
      <Experience />
      <Projects />
      <ArcadeTeaser />
      <Skills />
      <ApiConsole />
      <Suspense fallback={<div className="section" style={{ minHeight: "40vh" }} />}>
        <GithubActivity />
      </Suspense>
      <Contact />
    </>
  );
}

/** A new page starts at its top, unless the link asked for a particular section. */
function ScrollOnRouteChange() {
  const { pathname, state } = useLocation();

  useEffect(() => {
    if (state && state.scrollTo) return;
    // Instant, not smooth: the new page shouldn't visibly scroll up through itself.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    // Only a change of page should reset the scroll, not a change of state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}

/**
 * Everything that listens globally lives here: the keyboard shortcuts, the
 * Konami code, the typed-word triggers and the console greeting. Keeping them
 * in one component means one mount, one teardown, no duplicate listeners.
 */
function GlobalInteractions() {
  const {
    toggleRetro, cycleTheme, setChessOpen, setTrophyOpen, unlock,
  } = useExperience();

  useKonami(toggleRetro);
  useTypedWord("chess", () => setChessOpen(true));
  useTypedWord("hire", () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  });

  useEffect(() => {
    installConsoleEgg(unlock);
  }, [unlock]);

  useEffect(() => {
    function onKey(e) {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Single letters are reserved for the typed-word eggs ("chess", "hire"),
      // so only keys that cannot appear inside those words get a shortcut.
      const key = e.key.toLowerCase();
      if (key === "t") {
        e.preventDefault();
        cycleTheme();
      }
      if (key === "?") {
        e.preventDefault();
        setTrophyOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycleTheme, setTrophyOpen]);

  return null;
}

/**
 * The boot log is a great first impression and a bad third one. Play it once
 * per browser session, then get out of the way. `?skipIntro=1` skips it
 * outright, which is also what screenshot tooling wants.
 */
function introDuration() {
  if (typeof window === "undefined") return 0;

  const params = new URLSearchParams(window.location.search);
  if (params.get("skipIntro") === "1") return 0;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 300;

  try {
    if (sessionStorage.getItem("rm.booted") === "1") return 450;
    sessionStorage.setItem("rm.booted", "1");
  } catch {
    /* storage blocked — just play the full intro */
  }
  return 1750;
}

function Shell() {
  // Resolved exactly once — introDuration() marks the session as booted, so
  // calling it twice would always report a returning visitor.
  const [introMs] = useState(introDuration);
  const [loading, setLoading] = useState(introMs > 0);

  useEffect(() => {
    if (introMs === 0) return undefined;
    const timer = setTimeout(() => setLoading(false), introMs);
    return () => clearTimeout(timer);
  }, [introMs]);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <Loader visible={loading} />

      {/* The sky everything sits in */}
      <CosmicBackground />

      {/* Chrome */}
      <CustomCursor />
      <ScrollProgress />
      <Navbar />
      <ControlDock />

      {/* Overlays */}
      <CommandPalette />
      <Terminal />
      <ChessPuzzle />
      <TrophyCase />
      <IdleNudge />
      <Confetti />
      <AchievementToast />
      <GlobalInteractions />
      <ScrollOnRouteChange />

      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/dsa/*"
            element={
              <Suspense fallback={<div className="section" style={{ minHeight: "100vh" }} aria-busy="true" />}>
                <DsaArcade />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}

function App() {
  return (
    <ExperienceProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Shell />
      </Router>
    </ExperienceProvider>
  );
}

export default App;
