# Design and delivery notes — 5 November 2026

## Baseline verification

The starting working tree was clean at `81d6912`. GitHub `main` was one scheduled
GitHub snapshot commit ahead (`701b797`); the checkout was fast-forwarded before
implementation. No source changes were missing from the remote.

The baseline build's complete asset manifest matched the manifest served from
the then-configured www host. The homepage returned HTTP 200. The hosted URL has
since been confirmed as `https://rajamishra.me`, and current canonical, social,
structured-data and sitemap settings now use that bare domain.

## Reference research and implementation

| Reference | Applied pattern | Local implementation |
| --- | --- | --- |
| [Watermelon UI catalog](https://ui.watermelon.sh/) and [Continuous Tabs](https://ui.watermelon.sh/animated-components/category/tabs) | Sliding selection, compact stateful controls, consistent component surfaces | Project filters, systems-view selector, shared interface CSS |
| [Motion bundle guidance](https://motion.dev/docs/react-reduce-bundle-size) and [accessibility](https://motion.dev/docs/react-accessibility) | Reuse existing Framer Motion; layout transitions; reduced-motion policy; avoid duplicate runtimes | Project layout transitions, `MotionConfig`, shared motion preference context |
| [Haikei](https://haikei.app/) | Layered waves and low-cost vector scenery | Original `SignalTerrain` SVG with inherited theme colours |
| [Lusion](https://lusion.co/) | Continuous visual storytelling, large typography, work-led progression | Open hero canvas, oversized name, alternating project stories, shared chapter rules |
| [Bruno Simon](https://bruno-simon.com/) | Exploration through meaningful interactive objects and clear visitor controls | Stack exploration, request tracing and a connected engineering atlas; implemented as small SVGs rather than a 3D world |

Watermelon is a source-first component catalog, not a reason to install a second
UI framework. This project already uses plain CSS and Framer Motion, so the
patterns are implemented from scratch using its existing stack. The SVG terrain
is original artwork inspired by Haikei's generators, not a claim of an export
from its app. No third-party component source or graphics were copied.

## Interface changes

- Observatory is the light first-paint default. Remember explicit theme choices,
  and migrate older automatic dark defaults. One dedicated picker controls all
  six themes; keyboard cycling, the command palette and terminal share the registry.
- Use a large typographic masthead, an original contour field and an unframed
  systems scene that transitions between the orbit and a finite request simulation.
  The laptop refinement reduces the name to at most 68px and removes the crossing
  horizon, fixed top progress line, and decorative rules below the hero copy,
  retaining the curved field.
- Keep the hero copy first on narrow screens, followed by the orbital scene.
- Collapse the floating chat launcher to its orbit icon on small phones so it
  covers less content while keeping its accessible name.
- Replace project initials with project-specific architecture sketches. Preserve
  the real government portal image, project facts, links and expandable details.
- Use alternating editorial project rows, pressed-state filters, stable numbering,
  result counts and Motion layout/height transitions for project disclosures.
- Restore correctly spelled ASCII Raja Mishra lettering. All terminal colours
  use shared tokens. Add functioning close/minimize/maximize controls, session
  preservation on minimize, suggestions, focus containment and restoration.
- Share the same functional red close control across terminal, command palette,
  site chat, chess and secrets. Only the terminal needs minimize/maximize actions;
  other overlays do not display decorative inactive controls.
- Desktop window dots are 12px with 20px centre spacing. Glyphs appear on group
  hover or visible keyboard focus; touch controls retain visible glyphs and larger targets.
- Expand chess into 24 source-credited, rules-validated puzzles, difficulty sets,
  three attempts, automatic replies and solution review. See [chess notes](CHESS_PUZZLES.md).
- Replace the About focus cards with an interactive, connected engineering atlas.
- Use open chapter headers and ruled sections through the portfolio, DSA, Java,
  learning and engineering. Keep actual controls and data structures bounded.
- Suppress achievement toasts while terminal, chess or secrets are open, so they
  do not cover window controls or command output.
- Award console exploration only after an explicit console function call.
  Remove the image-preview getter that Safari can trigger during ordinary loading.

## Performance and accessibility

- No remote visual assets. Add only chess.js 1.4.0, confined to the lazy chess chunk.
- Remove the default 1.75-second boot delay; preserve the log with `?intro=1`.
- Defer API and GitHub components until within 600px of the viewport, with
  explicit load buttons as a fallback.
- Load chess, trophies and the optional intro only on demand.
- Paint the starfield only on resize/theme changes, at a pixel ratio capped at 1.25.
  Remove cursor-driven background repainting, per-star scroll gradients, full-screen
  blur, and scroll-linked contour transforms. Keep the nebula's compositor opacity pulse.
- Cap orbital SVG placement at 30fps and stabilize the navigation observer inputs.
- Stop orbital frames offscreen, in hidden tabs, and when motion is reduced.
- Persist a motion pause preference, while always respecting OS reduced motion.
- Move font discovery into the HTML head with preconnects and `display=swap`.
- Keep native controls, keyboard focus, labels, and forced-colour states.
- Use spring press feedback instead of moving button targets under the pointer.
  Magnetic interaction loops stop once settled instead of running while idle.
- Ordinary first scrolling records its discovery silently instead of covering
  the work with a celebratory toast.

Baseline initial transfer: **178.2 KiB JavaScript + 16.6 KiB CSS gzip**.
Use the build output for final values; the existing 185/25 KiB budgets are
unchanged. Bundle size is not a measured Lighthouse or Core Web Vitals result.

The laptop refinement's initial JavaScript is **173.3 KiB gzip** (178.5 KiB before
this revision), with chess remaining a separate, on-demand chunk. In a local
1366×768 Chrome comparison over three idle seconds, script work fell from
64.6ms to 19.9ms, and style/layout counts from 118 to 80. This is a bounded local
measurement, not a frame-rate or Core Web Vitals claim. The browser test saves
its current measurements as `laptop-idle-metrics.json` for review.

## Delivery checks

`npm run build` emits `/deployment.json`, with a source SHA supplied by Vercel
or GitHub Actions. `npm run verify:live` checks the homepage, the full asset
manifest, all manifest asset SHA-256 hashes, public data, offline files and
representative route documents. It also checks the deployed source commit
against the local HEAD when the host supplies it. It
fails when the local build differs from production. Browser interactions,
accessibility and offline behavior are checked separately in the test suite.

The canonical URL, Open Graph URL, structured data and sitemap now point to
the confirmed hosted URL, `https://rajamishra.me`. Vercel hosting and domain
ownership are unchanged.

## Development-tool security maintenance

The existing CI audit found moderate vulnerabilities in transitive `glob` and
`minimatch` versions used by Jest and ESLint. Overrides select `glob ^14.0.2`
and `minimatch ^11.0.1`, the patched versions identified in the
[glob advisory](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) and
[minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249).
The lockfile is updated and the unit suite and lint checks verify compatibility.
There are no added application runtime dependencies. Low-severity advisories in
the development dependency tree remain; the required moderate audit threshold
passes.
