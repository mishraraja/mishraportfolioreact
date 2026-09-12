<h2 align="center">
  Raja Mishra — Portfolio<br/>
  <a href="https://rajamishra.vercel.app/" target="_blank">rajamishra.vercel.app</a>
</h2>

A single-page developer portfolio built as a dark, editorial, motion-driven
experience: cinematic hero, scroll-triggered reveals, a command palette
(⌘/Ctrl+K), and content kept out of the components in `src/data/`.

## Built With

- React 18
- React Router 6
- Framer Motion
- react-icons
- Plain CSS with design tokens (`src/styles/tokens.css`) — no CSS framework

## Project Structure

```
src/
  components/   shared UI (nav, footer, cursor, background, command palette, ui primitives)
  sections/     page sections (Hero, About, Experience, Projects, Skills, Contact)
  data/         personal content — edit here, not in components
  hooks/        small reusable hooks (reduced motion, scroll spy, tilt, ...)
  styles/       design tokens + global base styles
```

## Features

- Cinematic hero with staggered entrance animation
- Scroll-spy navigation with a floating pill navbar
- Command palette (⌘/Ctrl+K) for quick navigation
- Custom cursor (desktop only, disabled under reduced motion)
- Mouse-reactive aurora background (pure CSS, no canvas/WebGL)
- Filterable project showcase
- Fully responsive, accessible (semantic HTML, focus states, reduced-motion support)

## Getting Started

You'll need `node` and `git` installed.

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Editing Content

All personal content — bio, skills, experience, projects, social links,
resume URL — lives in `src/data/`. Update those files; the UI picks up the
changes automatically. Empty sections (e.g. no projects yet) render an
honest "coming soon" state instead of placeholder content.

## Build

```bash
npm run build
```
