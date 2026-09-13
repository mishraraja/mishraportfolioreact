<h2 align="center">
  Raja Mishra — Portfolio<br/>
  <a href="https://rajamishra.vercel.app/" target="_blank">rajamishra.vercel.app</a>
</h2>

A single-page developer portfolio that behaves less like a brochure and more
like a piece of software. It boots with a Spring Boot startup log, ships a
working REST console you can send requests to, hides twelve things worth
finding, repaints itself in five themes, and refreshes its own GitHub numbers
on a schedule so nothing on the page goes stale.

No UI kit, no chart library, no confetti package, and not a single audio file.

## Built With

- React 18 + React Router 6
- Framer Motion for choreography
- react-icons
- Plain CSS with design tokens (`src/styles/tokens.css`) — no CSS framework
- Canvas, WebAudio and the GitHub REST API, all hand-wired

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

### Five themes and a sixth you unlock

Midnight, Solar, Matrix, Blueprint and Daylight all swap one set of tokens, so
every component follows automatically. The Konami code boots **retro mode** — a
1983 CRT with phosphor green, scanlines, flicker and a vignette.

### Sound with no sound files

Every tone — hovers, clicks, the achievement fanfare — is synthesised live with
WebAudio oscillators in `src/lib/sound.js`. Off by default, opt in from the
control dock.

### Other things worth finding

- A Spring Boot startup log on first load, once per session
- A playable mate-in-one chess puzzle
- A cursor-reactive constellation canvas behind the whole page
- A clickable request-flow diagram in the hero
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
    easter/     terminal, chess puzzle, idle nudge
    fx/         confetti, particle field, achievement toast
    ui/         buttons, headings, reveal primitives
  sections/     Hero, About, Experience, Projects, Skills, ApiConsole,
                GithubActivity, Contact, NotFound
  context/      global state — theme, sound, the secret hunt
  lib/          api, sound, achievements, console egg
  data/         personal content — edit here, not in components
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
scramble, the particle field, confetti, the cursor and the boot log. The hero
headline carries its real text for screen readers while it decrypts visually.
Focus states are never removed, every overlay is a labelled dialog, and the
keyboard shortcuts ignore keystrokes aimed at inputs.
