import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { profile, focusAreas } from "../../data/profile";
import { skillGroups } from "../../data/skills";
import { projects } from "../../data/projects";
import { experience } from "../../data/experience";
import { useExperience } from "../../context/ExperienceContext";
import { sfx } from "../../lib/sound";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import { WindowControls } from "../ui/WindowControls";
import { ASCII_BRAND, asciiWord } from "./asciiBrand";
import "./Terminal.css";

const BANNER = [ASCII_BRAND, "Java Backend Developer / Portfolio shell"];

const ARCADE_PAGES = {
  radar: "/dsa/radar",
  roadmap: "/dsa/learn/roadmap",
  patterns: "/dsa/learn/patterns",
  bigo: "/dsa/learn/big-o",
  interview: "/dsa/learn/interview",
};

const JAVA_PAGES = {
  labs: "/java/labs",
  revise: "/java/revise",
  vs: "/java/play/this-or-that",
  output: "/java/play/guess-output",
  core: "/java/core-java",
  oop: "/java/oop",
  collections: "/java/collections",
  threads: "/java/concurrency",
  spring: "/java/spring",
  micro: "/java/microservices",
  sql: "/java/database",
  testing: "/java/testing",
  git: "/java/git",
  agile: "/java/agile",
};

/**
 * A genuine little shell. Every command returns real data from the site's own
 * content files, so nothing here is a mock-up of a mock-up.
 */
export function Terminal() {
  const {
    terminalOpen, setTerminalOpen, unlock, cycleTheme, setTheme,
    toggleSound, setChessOpen, fireConfetti, toggleRetro, setTrophyOpen,
    unlockedCount, total, themes, theme, retro,
  } = useExperience();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [lines, setLines] = useState([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [histIndex, setHistIndex] = useState(-1);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const welcomed = useRef(false);
  useLockBodyScroll(terminalOpen);
  function close() { setMinimized(false); setTerminalOpen(false); sfx.close(); }
  function minimize() { setMinimized(true); setTerminalOpen(false); sfx.close(); }
  function restore() { setMinimized(false); setTerminalOpen(true); sfx.open(); }
  const restoreFocus = useCallback(() => {
    const previous = openerRef.current;
    const target = previous?.isConnected && previous !== document.body
      ? previous : document.querySelector('.dock button[aria-label="Open terminal"]');
    target?.focus({ preventScroll: true });
  }, []);

  const print = useCallback((content, type = "out") => {
    setLines((prev) => [...prev, { id: Math.random().toString(36).slice(2), content, type }]);
  }, []);

  const printAll = useCallback(
    (arr, type = "out") => {
      setLines((prev) => [
        ...prev,
        ...arr.map((content) => ({ id: Math.random().toString(36).slice(2), content, type })),
      ]);
    },
    []
  );

  const commands = useMemo(() => {
    const list = {
      help: {
        desc: "list every command",
        run: () => [
          "Available commands:",
          "",
          ...Object.entries(list).map(([name, c]) => "  " + name.padEnd(12) + c.desc),
          "",
          "Tip: arrow keys walk your history, Tab completes.",
        ],
      },
      whoami: {
        desc: "who is this guy",
        run: () => [
          profile.name + " - " + profile.roles[0],
          "",
          profile.positioning,
          "",
          "  experience : " + profile.yearsExperience + "+ years",
          "  education  : " + profile.education.degree,
          "  status     : " + (profile.openToWork ? "open to opportunities" : "heads down building"),
        ],
      },
      skills: {
        desc: "print the tech stack",
        run: (args) => {
          const group = args[0];
          const groups = group
            ? skillGroups.filter((g) => g.id === group.toLowerCase())
            : skillGroups;
          if (groups.length === 0) {
            return ["No such group. Try: " + skillGroups.map((g) => g.id).join(", ")];
          }
          return groups.flatMap((g) => [
            g.label.toUpperCase(),
            "  " + g.skills.map((s) => s.name).join(" - "),
            "",
          ]);
        },
      },
      projects: {
        desc: "list shipped work",
        run: () =>
          projects.flatMap((p, i) => [
            String(i + 1).padStart(2, "0") + "  " + p.title + (p.featured ? "  [featured]" : ""),
            "    " + p.period + "  |  " + p.stack.join(", "),
            "    " + p.description,
            "",
          ]),
      },
      experience: {
        desc: "print work history",
        run: () =>
          experience.flatMap((e) => [
            e.role + "  (" + e.period + ")",
            "  " + e.summary,
            ...e.highlights.map((h) => "  - " + h),
            "",
          ]),
      },
      focus: {
        desc: "current areas of focus",
        run: () => focusAreas.map((f) => "  " + f.label.padEnd(24) + f.detail),
      },
      contact: {
        desc: "how to reach him",
        run: () => [
          "  email     " + profile.social.email,
          "  linkedin  " + profile.social.linkedin,
          "  github    " + profile.social.github,
          "  twitter   " + profile.social.twitter,
          "",
          "Run `hire` if you mean business.",
        ],
      },
      resume: {
        desc: "download the CV",
        run: () => {
          window.open(profile.resumeUrl, "_blank", "noopener");
          return ["Opening " + profile.resumeUrl + " ..."];
        },
      },
      hire: {
        desc: "start the conversation",
        run: () => {
          fireConfetti();
          sfx.success();
          setTimeout(() => {
            window.location.href = "mailto:" + profile.social.email + "?subject=Let%27s%20work%20together";
          }, 600);
          return [
            "  Excellent choice.",
            "",
            "  > opening your mail client",
            "  > recipient: " + profile.social.email,
            "  > status: 200 OK",
          ];
        },
      },
      goto: {
        desc: "jump to a section",
        run: (args) => {
          const id = (args[0] || "").toLowerCase();
          const valid = ["home", "about", "experience", "projects", "arcade", "api", "skills", "github", "contact"];
          if (!valid.includes(id)) return ["Usage: goto <" + valid.join("|") + ">"];
          if (pathname !== "/") {
            navigate("/", { state: { scrollTo: id } });
          } else {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
          }
          setTerminalOpen(false);
          return ["Navigating to #" + id];
        },
      },
      dsa: {
        desc: "practise 75 interview problems",
        run: (args) => {
          const target = ARCADE_PAGES[(args[0] || "").toLowerCase()] || "/dsa";
          setTimeout(() => {
            setTerminalOpen(false);
            navigate(target);
          }, 350);
          return [
            "Booting the DSA Arcade -> " + target,
            "  also try: dsa radar | dsa roadmap | dsa patterns | dsa bigo | dsa interview",
          ];
        },
      },
      java: {
        desc: "play the Java backend arcade",
        run: (args) => {
          const target = JAVA_PAGES[(args[0] || "").toLowerCase()] || "/java";
          setTimeout(() => {
            setTerminalOpen(false);
            navigate(target);
          }, 350);
          return [
            "Booting the Backend Arcade -> " + target,
            "  also try: java labs | java vs | java output | java revise | java threads | java spring | java sql | java git",
          ];
        },
      },
      theme: {
        desc: "change the colour scheme",
        run: (args) => {
          const name = (args[0] || "").toLowerCase();
          const valid = themes.map((item) => item.id);
          if (!name) {
            cycleTheme();
            return ["Cycled to the next theme."];
          }
          if (!valid.includes(name)) return ["Usage: theme <" + valid.join("|") + ">"];
          setTheme(name);
          return ["Theme set to " + name + "."];
        },
      },
      sound: {
        desc: "toggle synthesised audio",
        run: () => {
          toggleSound();
          return ["Audio toggled. Every tone is generated live - no files."];
        },
      },
      chess: {
        desc: "he plays. do you?",
        run: () => {
          setTimeout(() => {
            setTerminalOpen(false);
            setChessOpen(true);
          }, 500);
          return ["Setting up the board... you are White. Mate in one."];
        },
      },
      secrets: {
        desc: "open the trophy case",
        run: () => {
          setTimeout(() => {
            setTerminalOpen(false);
            setTrophyOpen(true);
          }, 300);
          return ["Found " + unlockedCount + " of " + total + ". Opening the case..."];
        },
      },
      retro: {
        desc: "boot 1983",
        run: () => {
          toggleRetro();
          return ["CRT mode toggled. Mind the burn-in."];
        },
      },
      coffee: {
        desc: "the most important dependency",
        run: () => [
          "       ( (",
          "        ) )",
          "     .______.",
          "     |      |]",
          "     \\      /",
          "      `----'",
          "",
          "HTTP 418 - I'm a teapot. Coffee unavailable, but the code still compiles.",
        ],
      },
      sudo: {
        desc: "nice try",
        run: (args) => {
          if (args.join(" ").includes("hire")) return commands.hire.run();
          sfx.error();
          return [
            profile.name.split(" ")[0].toLowerCase() +
              " is not in the sudoers file. This incident has been reported.",
          ];
        },
      },
      echo: { desc: "say it back", run: (args) => [args.join(" ")] },
      date: { desc: "current time in IST", run: () => [nowIST()] },
      banner: { desc: "redraw the logo", run: () => BANNER },
      clear: { desc: "wipe the screen", run: () => "CLEAR" },
      exit: { desc: "close the terminal", run: () => "EXIT" },
    };
    return list;
  }, [
    cycleTheme, setTheme, toggleSound, setChessOpen, setTerminalOpen,
    fireConfetti, toggleRetro, setTrophyOpen, unlockedCount, total,
    pathname, navigate, themes,
  ]);

  const run = useCallback(
    (raw) => {
      const trimmed = raw.trim();
      print(trimmed, "cmd");
      if (!trimmed) return;

      setHistory((h) => [trimmed, ...h].slice(0, 50));
      setHistIndex(-1);
      unlock("shell-access");

      const [name, ...args] = trimmed.split(/\s+/);
      const cmd = commands[name.toLowerCase()];

      if (!cmd) {
        sfx.error();
        print("command not found: " + name + " - type `help`", "err");
        return;
      }

      const result = cmd.run(args);
      if (result === "CLEAR") {
        setLines([]);
        return;
      }
      if (result === "EXIT") {
        setMinimized(false);
        setTerminalOpen(false);
        sfx.close();
        return;
      }
      sfx.click();
      printAll(Array.isArray(result) ? result : [String(result)], name.toLowerCase() === "banner" ? "banner" : "out");
    },
    [commands, print, printAll, unlock, setTerminalOpen]
  );

  /* Greet on first open */
  useEffect(() => {
    if (terminalOpen) setMinimized(false);
    if (terminalOpen && !welcomed.current) {
      welcomed.current = true;
      printAll([
        "Welcome. Explore the work, change the theme, or jump into a lab.",
        "Type help to see commands. Escape closes the shell.",
      ], "sys");
    }
  }, [terminalOpen, lines.length, printAll]);

  /* Keep keyboard focus in the dialog, then return it to the opener. */
  useEffect(() => {
    if (!terminalOpen) return undefined;
    const previous = document.activeElement;
    openerRef.current = previous;
    const dialog = dialogRef.current;
    inputRef.current?.focus();
    function onKey(event) {
      if (event.key === "Escape") {
        event.preventDefault(); event.stopPropagation(); setTerminalOpen(false); sfx.close();
      }
      if (event.key !== "Tab") return;
      const controls = [...dialog.querySelectorAll("button:not(:disabled), input")];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    dialog.addEventListener("keydown", onKey);
    return () => { dialog.removeEventListener("keydown", onKey); restoreFocus(); };
  }, [terminalOpen, setTerminalOpen, restoreFocus]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines]);

  /* Global open/close key */
  useEffect(() => {
    function onKey(e) {
      const tag = e.target?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable;

      if (e.key === "`" && !typing) {
        e.preventDefault();
        setTerminalOpen(true);
        sfx.open();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [terminalOpen, setTerminalOpen]);

  function onKeyDown(e) {
    if (e.key === "Enter") {
      run(input);
      setInput("");
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIndex + 1, history.length - 1);
      if (next >= 0) {
        setHistIndex(next);
        setInput(history[next]);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = histIndex - 1;
      setHistIndex(next);
      setInput(next < 0 ? "" : history[next]);
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const match = Object.keys(commands).find((c) => c.startsWith(input.toLowerCase()));
      if (match) setInput(match);
    }
  }

  return (
    <>
    {minimized && !terminalOpen && <div className="term-minimized">
      <WindowControls title="terminal" onClose={() => setMinimized(false)} />
      <button type="button" onClick={restore} aria-label="Restore terminal"><span aria-hidden="true">&gt;_</span> portfolio.shell <span aria-hidden="true">↗</span></button>
    </div>}
    <AnimatePresence onExitComplete={() => { if (!terminalOpen) restoreFocus(); }}>
      {terminalOpen ? (
        <motion.div
          className="term-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            ref={dialogRef}
            className={"term" + (maximized ? " term--maximized" : "")}
            role="dialog"
            aria-modal="true"
            aria-label="Interactive terminal"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.985 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <header className="term__bar">
              <WindowControls title="terminal" onClose={close} onMinimize={minimize} onResize={() => setMaximized((value) => !value)} expanded={maximized} />
              <span className="term__title">
                {profile.name.toLowerCase().replace(" ", "")}@portfolio: ~
              </span>
              <span className="term__session" aria-hidden="true">zsh / 01</span>
            </header>

            <div className="term__identity">
              <div className="term__boot"><span>RM.OS / PERSONAL SHELL</span><span>SESSION READY</span></div>
              <h2 className="term__brand" aria-label="Raja Mishra"><span aria-hidden="true">{asciiWord("RAJA")}<br /><br />{asciiWord("MISHRA")}</span></h2>
              <div className="term__spec"><p><span>ROLE</span>Java Backend Developer</p><p><span>STACK</span>Java · Spring · Cloud</p><p><span>MODE</span>Local portfolio shell</p></div>
              <span className="term__theme">{retro ? "Retro" : themes.find((item) => item.id === theme)?.label}</span>
            </div>
            <div className="term__quick" role="group" aria-label="Suggested terminal commands">
              <span>RUN /</span>
              {["help", "whoami", "projects", "skills", "theme", "clear"].map((command) => <button type="button" key={command} onClick={() => { run(command); inputRef.current?.focus(); }}>{command}<span aria-hidden="true">↵</span></button>)}
            </div>

            <div className="term__body" ref={bodyRef}>
              {lines.map((line) => (
                <pre key={line.id} className={"term__line term__line--" + line.type}>
                  {line.type === "cmd" ? <span className="term__prompt">$ </span> : null}
                  {line.content}
                </pre>
              ))}

              <div className="term__input-row">
                <span className="term__prompt"><span className="term__cwd">~ </span>❯</span>
                <input
                  ref={inputRef}
                  className="term__input"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    sfx.type();
                  }}
                  onKeyDown={onKeyDown}
                  spellCheck="false"
                  autoComplete="off"
                  autoCapitalize="off"
                  aria-label="Terminal input"
                />
              </div>
            </div>

            <footer className="term__foot">
              <span>enter run</span>
              <span>tab complete</span>
              <span>up/down history</span>
              <span>esc close</span>
              <span className="term__history-count">{history.length} {history.length === 1 ? "command" : "commands"}</span>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
    </>
  );
}

function nowIST() {
  const fmt = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "medium",
  });
  return fmt.format(new Date()) + " IST";
}
