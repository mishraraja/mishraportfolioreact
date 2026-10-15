<h2 align="center">
  Raja Mishra — Portfolio<br/>
  <a href="https://rajamishra.vercel.app/" target="_blank">rajamishra.vercel.app</a>
</h2>

A React developer portfolio and interview-learning app built around **a software
system drawn as a solar system**, with separate DSA and Java Backend Arcades.

The stack orbits a star. Skills are a constellation chart. The whole page sits
in a parallax starfield that reacts to your cursor, stretches into streaks when
you scroll fast, and throws the occasional shooting star. Underneath the sky is
a browser-based REST simulator, an interactive terminal, twelve hidden
things worth finding, and a data pipeline that refreshes its own GitHub numbers
on a schedule, with a saved snapshot available when live requests fail.

## Current Project Status

Repository review: **15 October 2026**. This README describes the local working
tree, including work that has not yet been committed or deployed.

| Area | Current implementation |
| --- | --- |
| Portfolio (`/`) | Hero, about, experience, four project entries, skills, API simulator, GitHub activity and contact links |
| DSA Arcade (`/dsa`) | 75 animated problems, Java/Python solutions, quizzes, pattern practice, roadmap and browser-saved progress |
| Backend Arcade (`/java`) | 10 topic worlds, concept cards, 16 interactive labs, boss quizzes, two games and a revision sheet; currently uncommitted |
| Runtime | React frontend; API responses and Java labs are JavaScript simulations |
| Persistence | Browser storage for preferences and learning progress; no accounts or server-side progress sync |
| Delivery | Production build and sitemap scripts, Vercel configuration, GitHub Actions workflows |

At review time, local `main` was at `0b5ca51`, **31 commits behind `origin/main`**
after fetching, with no local commits ahead. Those remote commits change only
`public/data/github.json`. There were **14 modified tracked files** and **65
untracked files under `src/java/`**, with nothing staged. These working-tree
changes are not part of the `main` commit history yet. This review updates the
README only; it does not commit, merge, push or verify the live deployment.

No UI kit, no chart library, no confetti package, no 3D engine, and not a single
audio file. The starfield is hand-rolled canvas, the solar system is SVG driven
by an orbit loop, and every sound is synthesised at runtime.

## Built With

- React 18 + React Router 6
- Framer Motion for choreography
- react-icons
- Plain CSS with design tokens (`src/styles/tokens.css`) — no CSS framework
- Canvas, SVG, WebAudio and the GitHub REST API, all hand-wired

## Getting Started

Use Node.js 22 with npm to match one of the configured CI environments (CI also
tests Node 20). The repository includes `package-lock.json`.

```bash
npm ci
npm start
```

Open [http://localhost:3000](http://localhost:3000).

On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.
Append `?skipIntro=1` to skip the startup animation during development.

| Command | What it does |
| --- | --- |
| `npm start` | Dev server |
| `npm run build` | Production build, then writes `sitemap.xml` and `robots.txt` |
| `npm test` | Test suite (watch mode) |
| `npm run test:ci` | Single run, for CI |
| `npm run data:refresh` | Pull fresh GitHub stats into `public/data/github.json` |
| `npm run sitemap` | Regenerate sitemap and robots files in an existing `build/` directory |

No environment variables are required to start the app. Optional script settings:

| Variable | Used by | Default / purpose |
| --- | --- | --- |
| `GH_USERNAME` | GitHub refresh script | `mishraraja` |
| `GITHUB_TOKEN` | GitHub refresh script | Optional authentication for GitHub requests; keep it out of frontend code |
| `STRICT` | GitHub refresh script | Set to `1` to exit with failure if refreshing fails |
| `SITE_URL` | Sitemap script | `https://rajamishra.vercel.app` |

## What Makes It Different

### Mission Control on the homepage

The hero now offers three entry points: selected work, a quick coding challenge,
and the developer's story, with a greeting based on the visitor's local time.
Below the hero, an interactive lab follows a simulated request through API,
service, database and response stages. A rotating set of three Java/DSA questions
offers explanations and links into the existing arcades. The opening question
changes with the day of the month; visitors can cycle through all three.

The lab loads as a separate chunk when its section approaches the viewport, with
an explicit load button as a fallback. Request playback pauses offscreen or in
hidden tabs; reduced-motion visitors advance manually. Sounds use the existing
opt-in sound setting. No new packages, external APIs or media downloads are
needed for these additions.

Project cards retain their existing destinations and add a native expandable
"Behind the build" story using the existing problem, contribution and delivered
functionality descriptions. No performance or business metrics are invented.

### An API simulator you can interact with

The `#api` section is a Spring-Boot-shaped service running entirely in the
browser. Seven endpoints — `/api/v1/health`, `/profile`, `/skills`,
`/projects`, `/experience`, `POST /hire` and a deliberately `403` `/secrets` —
return the real content of this site, with status codes, response headers and
simulated latency. It is defined in `src/lib/api.js`; the console renders it
with its own dependency-free JSON highlighter.

These paths are handled by JavaScript functions, not HTTP server routes.
`POST /hire` produces a simulated response and an email link; it does not send
or store a hiring request. Contact uses email and social links.

### An in-browser terminal

Press <kbd>`</kbd> anywhere. Commands include `whoami`, `skills`, `projects`,
`experience`, `contact`, `resume`, `theme`, `chess`, `secrets`, `retro`,
`coffee`, `hire` and a `sudo` that refuses politely. History with arrow keys,
tab completion, the lot.

The terminal dispatches predefined app commands; it does not execute operating
system commands. It also provides navigation into both arcades.

### Twelve secrets

A tracked hunt with ranks from Visitor to Completionist. Progress lives in
`localStorage`, the trophy case shows a hint for anything still locked, and the
footer tells every visitor the hunt exists so nobody leaves without knowing.

### The stack as a solar system

The hero is an orrery. A star labelled JVM sits at the centre and five bodies
orbit it on tilted ellipses — Java closest, AWS furthest out, each with a period
that follows its distance the way a real system does. Bodies scale with depth so
they pass visibly in front of and behind the star. Hover or focus one for detail,
drag the background to spin the whole system, scrub the slider to change time.

### Skills as a star chart

Nineteen technologies in five constellations, each star hand-placed by its
group and jittered by a seed of its own name, so the chart is identical on every
visit. Hover a star to read what that technology is actually used for.

### Five skies and a sixth you unlock

Nebula, Supernova, Deep Field, Solar and Observatory each swap one set of tokens,
so every component — including the starfield canvas and the orrery — repaints
automatically. The Konami code boots **retro mode**: a 1983 CRT with phosphor
green, scanlines, flicker and a vignette.

### Sound with no sound files

Every tone — hovers, clicks, the achievement fanfare — is synthesised live with
WebAudio oscillators in `src/lib/sound.js`. Off by default, opt in from the
control dock.

### Other things worth finding

- A Spring Boot startup log on first load, once per session
- A playable mate-in-one chess puzzle
- A parallax starfield that brightens near the cursor and warps when you scroll
- Shooting stars, on their own schedule
- Magnetic buttons, spotlight cards, a decrypting headline
- A live clock in the author's timezone
- A nudge if you stand still too long
- ASCII art and callable functions in the DevTools console
- A Whitelabel Error Page parody on 404

### Keyboard

| Key | Action |
| --- | --- |
| <kbd>`</kbd> | Terminal |
| <kbd>⌘/Ctrl</kbd> + <kbd>K</kbd> | Command palette |
| <kbd>T</kbd> | Next theme |
| <kbd>?</kbd> | Trophy case |
| Konami code | Retro CRT mode |
| Type `chess` / `hire` | You will find out |

## DSA Arcade

`/dsa` is a free practice space for the 75 interview problems product companies
keep asking (the "Blind 75"), built so learning them feels like playing.

- **Every problem is animated.** A tracer runs the real algorithm and records
  each moment worth seeing; the player lets you play, pause, scrub, step
  backwards and run it on your own input. Arrays, grids, trees, tries, linked
  lists, graphs, heaps, intervals and bits each have their own view.
- **Predict mode** pauses before key decisions and asks what happens next.
- **Each problem** has a story that makes the trick memorable, the one-line
  insight, Java and Python solutions, complexity, and a mastery question.
- **Beyond the 75:** a 24-pattern playbook with templates, a Pattern Radar
  recognition game, an 8-week roadmap with spaced reviews, a Big-O lab and an
  interview playbook.
- **Progress** (XP, levels, streaks, reviews) lives in `localStorage` — no
  account, no server.

The arcade is lazy-loaded, so the portfolio's first load doesn't pay for it.
Problem content lives in `src/dsa/data/problems/`; the test suite runs every
example through its animation and checks the answer, so a broken tracer fails CI.

## Backend Arcade

`/java` does the same for the rest of a Java backend interview: Core Java, OOP
and design patterns, collections, multithreading, Spring Boot, microservices,
SQL/JPA/Hibernate, testing, Git and Agile.

- **Ten worlds of concept cards.** Every card has three tabs: the idea in plain
  words (an analogy, no jargon), how it really works with a code sample, and
  the one line to say in the interview plus the follow-up that trips people up.
- **Sixteen labs** where you cause the bug yourself: schedule two threads until
  `count++` loses an update, deadlock two transfers, force a HashMap collision
  and resize, watch a thread pool reject a task, trip a circuit breaker, catch
  dirty and phantom reads, count N+1 queries, stub a spy the wrong way, and
  merge/rebase/reset on a live commit graph. Each lab has missions.
- **A boss fight per world** — five interview questions, one mistake allowed.
- **Games:** This or That (rapid-fire trade-offs) and Guess the Output (Java
  snippets with a twist, every answer traced by hand).
- **A revision sheet** with every one-liner and trap, searchable and printable.

Content lives in `src/java/data/topics/` (one file per world) and labs in
`src/java/labs/`. The tests check every card, quiz and puzzle for valid answers,
verify the HashMap lab's hashing matches Java's `String.hashCode`, render every
lab, and play through the key missions.

The labs simulate backend concepts in React; they do not start a JVM, database,
Spring service or Git process. Progress is stored separately from DSA progress
under `rm.java.progress.v1`; DSA uses `rm.dsa.progress.v1`. Clearing browser
storage removes saved progress, and progress does not sync across devices.

### Main routes

| Route | Page |
| --- | --- |
| `/dsa/:slug` | Individual problem and animation player |
| `/dsa/learn/patterns` | Pattern templates and related problems |
| `/dsa/learn/roadmap` | Eight-week plan and reviews |
| `/dsa/learn/big-o` | Complexity lab |
| `/dsa/learn/interview` | Interview playbook |
| `/dsa/radar` | Pattern recognition game |
| `/java/:worldId` | Topic cards and boss quiz |
| `/java/labs` | All labs |
| `/java/lab/:labId` | Individual lab |
| `/java/play/this-or-that` | Trade-off game |
| `/java/play/guess-output` | Output prediction game |
| `/java/revise` | Searchable, printable revision sheet |

## Automation

The point is that nobody has to maintain the numbers on this page.

| Workflow | Trigger | What it does |
| --- | --- | --- |
| `ci.yml` | push, PR | Tests and builds on Node 20 and 22, reports bundle size |
| `refresh-data.yml` | daily at 02:30 UTC | Pulls GitHub stats and commits the snapshot if it changed |
| `lighthouse.yml` | PR, manual | Performance/accessibility audit; configured with `continue-on-error`, so it is advisory |
| `dependabot.yml` | weekly | Grouped dependency updates |

The GitHub section uses three tiers: a six-hour session cache, the daily snapshot in
`public/data/github.json`, and a live API call that quietly upgrades both. If
the live call fails, existing cached or snapshot data remains available; if no
data loads, the hook reports an offline state. A snapshot can become stale.

## Build, Tests and Deployment

Local validation on 15 October 2026 (Node `v24.19.0`, npm `9.8.1`):

- **Tests:** all 316 tests across 5 suites passed. Test output includes React
  `act` deprecation and React Router future-flag warnings.
- **Build:** completed successfully, with CSS ordering warnings involving
  `DsaArcade.css`, `Hub.css`, `CodeBlock.css` and `Player.css` in shared chunks.
- **Postbuild:** generated a 113-page sitemap and `robots.txt`.
- **Scope:** automated local checks; visual browser QA and live deployment
  verification were not performed in this review.

`npm run test:ci -- --runInBand` runs the existing Jest/React Testing Library
suite once. It covers app rendering, all DSA example traces and input round
trips, animation frames, arcade navigation, Java content integrity, lab rendering
and selected interactive missions.

`npm run build` writes the static app to `build/`, then runs the sitemap script
for portfolio, DSA and Backend Arcade pages. The build script sets `CI=false`,
so compiler warnings do not automatically fail the build.

Vercel configuration is in `vercel.json`. When hosting elsewhere, configure SPA
fallback to `index.html` so direct visits to nested routes work. The configured
site address is linked above; local implementation does not establish which
features are deployed there.

Known documentation follow-up: `SECURITY.md` still contains template policy text
and example version numbers unrelated to package version `2.0.0`.

## Project Structure

```
src/
  components/   nav, footer, cursor, control dock, trophy case, command palette
    background/ the cosmic sky: starfield, nebula, grid, warp
    orbital/    the hero orrery
    easter/     terminal, chess puzzle, idle nudge
    fx/         confetti, achievement toast
    ui/         buttons, headings, reveal primitives
  sections/     Hero, About, Experience, Projects, Arcade teaser, Skills,
                ApiConsole, GithubActivity, Contact, NotFound
  dsa/          the DSA Arcade (lazy-loaded)
    engine/     tracer recorder, input parsing, step player, data-structure views
    data/       75 problems, patterns, worlds, roadmap
    pages/      hub, problem page, patterns, radar, roadmap, Big-O, interview
  java/         the Backend Arcade (lazy-loaded)
    data/       worlds, concept cards + bosses per topic, games content
    labs/       16 interactive labs and their registry
    pages/      hub, world, lab, This or That, Guess the Output, revision sheet
  context/      global state — theme, sound, the secret hunt
  lib/          api, sound, achievements, console egg
  data/         personal content + the orbital system's bodies
  hooks/        reduced motion, scroll spy, konami, magnetic, scramble, idle
  styles/       design tokens, themes, global base
scripts/        GitHub fetch + sitemap generation
```

## Editing Content

All personal content — bio, skills, experience, projects, social links, resume
URL — lives in `src/data/`. Update those files; the UI and the API console both
pick up the change. Empty sections render an honest "coming soon" state instead
of placeholder content.

## Accessibility

Everything decorative gets out of the way. `prefers-reduced-motion` disables the
scramble, the starfield, orbital motion, confetti, the cursor and the boot log. The hero
headline carries its real text for screen readers while it decrypts visually.
Focus states are never removed, every overlay is a labelled dialog, and the
keyboard shortcuts ignore keystrokes aimed at inputs.
