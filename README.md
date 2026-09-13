<h2 align="center">
  Raja Mishra — Portfolio<br/>
  <a href="https://rajamishra.vercel.app/" target="_blank">rajamishra.vercel.app</a>
</h2>

A single-page developer portfolio built on one idea: **a software system drawn
as a solar system.**

The stack orbits a star. Skills are a constellation chart. The whole page sits
in a parallax starfield that reacts to your cursor, stretches into streaks when
you scroll fast, and throws the occasional shooting star. Underneath the sky is
a working REST console you can send requests to, a real shell, twelve hidden
things worth finding, and a data pipeline that refreshes its own GitHub numbers
on a schedule so nothing goes stale.

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

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

| Command | What it does |
| --- | --- |
| `npm start` | Dev server |
| `npm run build` | Production build, then writes `sitemap.xml` and `robots.txt` |
| `npm test` | Test suite (watch mode) |
| `npm run test:ci` | Single run, for CI |
| `npm run data:refresh` | Pull fresh GitHub stats into `public/data/github.json` |

## What Makes It Different

### An API you can actually call

The `#api` section is a Spring-Boot-shaped service running entirely in the
browser. Seven endpoints — `/api/v1/health`, `/profile`, `/skills`,
`/projects`, `/experience`, `POST /hire` and a deliberately `403` `/secrets` —
return the real content of this site, with status codes, response headers and
simulated latency. It is defined in `src/lib/api.js`; the console renders it
with its own dependency-free JSON highlighter.

### A real shell

Press <kbd>`</kbd> anywhere. Commands include `whoami`, `skills`, `projects`,
`experience`, `contact`, `resume`, `theme`, `chess`, `secrets`, `retro`,
`coffee`, `hire` and a `sudo` that refuses politely. History with arrow keys,
tab completion, the lot.

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

## Automation

The point is that nobody has to maintain the numbers on this page.

| Workflow | Trigger | What it does |
| --- | --- | --- |
| `ci.yml` | push, PR | Tests and builds on Node 20 and 22, reports bundle size |
| `refresh-data.yml` | daily at 02:30 UTC | Pulls GitHub stats and commits the snapshot if it changed |
| `lighthouse.yml` | PR | Performance and accessibility budget |
| `dependabot.yml` | weekly | Grouped dependency updates |

The GitHub section uses three tiers so the numbers are never stale and never
blank: a session cache, the nightly-committed snapshot in
`public/data/github.json`, and a live API call that quietly upgrades both. If
the browser hits GitHub's rate limit, the snapshot stands and the page says so.

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
