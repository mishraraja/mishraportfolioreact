# Design and delivery notes — 5 November 2026

## Baseline verification

The starting working tree was clean at `81d6912`. GitHub `main` was one scheduled
GitHub snapshot commit ahead (`701b797`); the checkout was fast-forwarded before
implementation. No source changes were missing from the remote.

The baseline build's complete asset manifest matched the manifest served from
`https://www.rajamishra.me/asset-manifest.json`. The homepage returned HTTP 200.
The previous Vercel address redirected to the www custom domain. Requests to the
bare `https://rajamishra.me` timed out from this execution environment; this is
a verification limit, not proof of a DNS outage.

## Reference research and implementation

| Reference | Applied pattern | Local implementation |
| --- | --- | --- |
| [Watermelon UI catalog](https://ui.watermelon.sh/) and [Continuous Tabs](https://ui.watermelon.sh/animated-components/category/tabs) | Sliding selection, compact stateful controls, consistent component surfaces | Project filters, systems-view selector, shared interface CSS |
| [Motion bundle guidance](https://motion.dev/docs/react-reduce-bundle-size) and [accessibility](https://motion.dev/docs/react-accessibility) | Reuse existing Framer Motion; layout transitions; reduced-motion policy; avoid duplicate runtimes | Project layout transitions, `MotionConfig`, shared motion preference context |
| [Haikei](https://haikei.app/) | Layered waves and low-cost vector scenery | Original `SignalTerrain` SVG with inherited theme colours |

Watermelon is a source-first component catalog, not a reason to install a second
UI framework. This project already uses plain CSS and Framer Motion, so the
patterns are implemented from scratch using its existing stack. The SVG terrain
is original artwork inspired by Haikei's generators, not a claim of an export
from its app. No third-party component source or graphics were copied.

## Interface changes

- Observatory is the light first-paint default. Remember explicit theme choices,
  and migrate older automatic dark defaults. One dedicated picker controls all
  six themes; keyboard cycling, the command palette and terminal share the registry.
- Use staggered readable hero text and a systems panel that transitions between
  the existing orbit and a finite, visitor-triggered request simulation.
- Keep the hero copy first on narrow screens, followed by the orbital scene.
- Collapse the floating chat launcher to its orbit icon on small phones so it
  covers less content while keeping its accessible name.
- Replace project initials with project-specific architecture sketches. Preserve
  the real government portal image, project facts, links and native details.
- Use a responsive project grid, pressed-state filters, stable numbering, result
  counts and Motion layout/height transitions for project disclosures.
- Replace the terminal ASCII banner with a readable Raja Mishra identity. All
  terminal colours use the shared tokens. Add command suggestions, proper focus
  containment, focus restoration and body-scroll locking.
- Apply shared edge lighting and surfaces to portfolio cards, DSA, Java,
  concept cards, labs, learning and engineering. Add distinct static signal
  diagrams to the two arcade headers.

## Performance and accessibility

- No new dependencies or remote visual assets.
- Remove the default 1.75-second boot delay; preserve the log with `?intro=1`.
- Defer API and GitHub components until within 600px of the viewport, with
  explicit load buttons as a fallback.
- Load chess, trophies and the optional intro only on demand.
- Limit ambient canvas drawing to 30fps and device pixel ratio to 1.5.
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

## Delivery checks

`npm run build` emits `/deployment.json`, with a source SHA supplied by Vercel
or GitHub Actions. `npm run verify:live` checks the homepage, the full asset
manifest, all manifest asset SHA-256 hashes, public data, offline files and
representative route documents. It also checks the deployed source commit
against the local HEAD when the host supplies it. It
fails when the local build differs from production. Browser interactions,
accessibility and offline behavior are checked separately in the test suite.

The canonical URL, Open Graph URL, structured data and sitemap now point to
`https://www.rajamishra.me`. Vercel hosting and domain ownership are unchanged.

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
