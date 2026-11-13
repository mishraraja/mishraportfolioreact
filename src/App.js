import { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { ExperienceProvider, useExperience } from "./context/ExperienceContext";
import ChatLauncher from "./chat/ChatLauncher";
import { Loader } from "./components/Loader";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { CommandPalette } from "./components/CommandPalette";
import { ControlDock } from "./components/ControlDock";
import { CosmicBackground } from "./components/background/CosmicBackground";
import { Confetti } from "./components/fx/Confetti";
import { AchievementToast } from "./components/fx/AchievementToast";
import { Terminal } from "./components/easter/Terminal";
import { IdleNudge } from "./components/easter/IdleNudge";
import { Hero } from "./sections/Hero";
import { MissionControl } from "./sections/MissionControl";
import { About } from "./sections/About";
import { Experience } from "./sections/Experience";
import { Projects } from "./sections/Projects";
import { ArcadeTeaser } from "./sections/Arcade";
import { Skills } from "./sections/Skills";
import { DeferredSection } from "./components/ui/DeferredSection";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { Contact } from "./sections/Contact";
import { NotFound } from "./sections/NotFound";
import { useKonami, useTypedWord } from "./hooks/useKonami";
import { installConsoleEgg } from "./lib/consoleEgg";
import "./styles/tokens.css";
import "./styles/themes.css";
import "./styles/base.css";
import "./styles/interface.css";

const TrophyCase = lazy(() => import("./components/TrophyCase").then((m) => ({ default: m.TrophyCase })));
const ChessPuzzle = lazy(() => import("./components/easter/ChessPuzzle").then((m) => ({ default: m.ChessPuzzle })));
const ApiConsole = lazy(() => import("./sections/ApiConsole").then((m) => ({ default: m.ApiConsole })));

const GithubActivity = lazy(() =>
  import("./sections/GithubActivity").then((m) => ({ default: m.GithubActivity }))
);

// The arcade is a whole app of its own — 75 problems and their animations —
// so it only downloads when someone actually opens it.
const DsaArcade = lazy(() => import("./dsa/DsaArcade"));

// The Backend Arcade — Java, Spring, SQL, testing and Git as cards, labs and
// games — loads the same way.
const JavaArcade = lazy(() => import("./java/JavaArcade"));
const Learning = lazy(() => import("./learning/Learning"));
const Engineering = lazy(() => import("./learning/Engineering"));

function Home() {
  const location = useLocation();

  // Section links followed from another page arrive with the section to land on.
  useEffect(() => {
    const target = location.hash.slice(1) || location.state?.scrollTo;
    if (!target) return undefined;
    const timer = setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }, 80);
    return () => clearTimeout(timer);
  }, [location.state, location.hash]);

  return (
    <>
      <Hero />
      <MissionControl />
      <About />
      <Experience />
      <Projects />
      <ArcadeTeaser />
      <Skills />
      <DeferredSection id="api" label="API console"><ApiConsole /></DeferredSection>
      <DeferredSection id="github" label="GitHub activity">
        <GithubActivity />
      </DeferredSection>
      <Contact />
    </>
  );
}

/** A new page starts at its top, unless the link asked for a particular section. */
function ScrollOnRouteChange() {
  const { pathname, state } = useLocation();

  useEffect(() => {
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      const url = new URL(pathname, canonical.href).href;
      canonical.href = url;
      document.querySelector('meta[property="og:url"]')?.setAttribute("content", url);
    }
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
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable) return;
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

function Shell() {
  const { chessOpen, trophyOpen } = useExperience();
  const reduced = useReducedMotion();
  const [loading, setLoading] = useState(() =>
    typeof window === "undefined" || new URLSearchParams(window.location.search).get("skipIntro") !== "1"
  );

  useEffect(() => {
    if (!loading) return undefined;
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, [loading, reduced]);

  return (
    <MotionConfig reducedMotion={reduced ? "always" : "user"}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      {loading && <Loader visible={loading} />}

      {/* The sky everything sits in */}
      <CosmicBackground />

      {/* Chrome */}
      <Navbar />
      <ControlDock />

      {/* Overlays */}
      <CommandPalette />
      <Terminal />
      <Suspense fallback={null}>
        {chessOpen && <ChessPuzzle />}
        {trophyOpen && <TrophyCase />}
      </Suspense>
      <IdleNudge />
      <Confetti />
      <AchievementToast />
      <GlobalInteractions />
      <ScrollOnRouteChange />

      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/learning" element={<Suspense fallback={<div className="section" role="status">Loading learning tools…</div>}><Learning /></Suspense>} />
          <Route path="/engineering" element={<Suspense fallback={<div className="section" role="status">Loading case study…</div>}><Engineering /></Suspense>} />
          <Route path="/java-project-guide" element={<Navigate to="/java/guide" replace />} />
          <Route
            path="/dsa/*"
            element={
              <Suspense fallback={<div className="section" style={{ minHeight: "100vh" }} aria-busy="true" />}>
                <DsaArcade />
              </Suspense>
            }
          />
          <Route
            path="/java/*"
            element={
              <Suspense fallback={<div className="section" style={{ minHeight: "100vh" }} aria-busy="true" />}>
                <JavaArcade />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
      <ChatLauncher />
    </MotionConfig>
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
