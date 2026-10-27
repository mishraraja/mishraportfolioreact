# End-to-end audit — 27 October 2026

## Git and hosted baseline

The review started with a clean working tree on `main` at
`fd294392dadc9a9cb3054fbc02565a90b91342f1`. A live `git ls-remote`
confirmed GitHub's `main` pointed to the same commit. CI and Browser checks
were successful for that exact revision; GitHub returned no open Dependabot alerts.

The hosted site is <https://rajamishra.vercel.app/>. Before updating dependencies,
31 production files were compared with the existing local build. Every file
returned HTTP 200 and was byte-for-byte identical, including HTML, JS, CSS,
manifests, offline files, favicon, project image and resume. The paths and remote
SHA-256 values are saved in [deployment-baseline.json](deployment-baseline.json).
This proves parity for those files at the time of inspection, not server source
or environment parity. Hosted `GET /api/chat` returned `{"aiEnabled":false}`.

The fixes below were reviewed locally before publication. The user subsequently
authorized deployment; the deployment result and final local/hosted comparison
are reported in the deployment handoff. The baseline comparison remains historical.

## Review coverage

- Read the application entry points, routing, content, persistence, chat endpoint,
  build scripts, deployment settings, CI workflows and existing tests.
- Parsed the import graph of 217 tracked JS/MJS/CSS source modules;
  no non-test module lacked an inbound import except the expected entry points.
- Ran the algorithm/content/UI unit suite, chat endpoint tests, offline-worker
  tests, production build and browser suite.
- Crawled all 115 sitemap pages in a real Chromium browser, collecting links,
  IDs, public-file references, horizontal overflow and runtime/resource failures.
- Checked homepage and Two Sum content with axe in all five selectable themes.
  The learning page, engineering page and chat have additional browser axe checks.
  These are automated checks, not a complete manual screen-reader audit.
- Checked 88 external destinations, including case-study source links and saved
  repository links. Individual statuses are saved in
  [link-checks.json](link-checks.json).

## Updated dependencies

| Component | Previous installed version | Reviewed version |
| --- | --- | --- |
| React / React DOM | 18.3.1 | 19.3.1 |
| Framer Motion | 11.18.2 | 14.6.0 |
| react-github-calendar | 3.4.0 | 5.0.9 |
| react-icons | 4.12.0 | 5.7.0 |
| Testing Library React | 13.4.0 | 16.3.3 |
| Testing Library jest-dom | 5.17.0 | 7.0.1 |
| Testing Library DOM | Previously transitive | 10.4.2, explicit peer dependency |
| axe Playwright | 4.13.0 | 4.14.0 |
| Babel parser | 7.29.7 | 8.0.8 |
| globals | 16.5.0 | 17.13.0 |
| checkout / setup-node / upload-artifact actions | v4 | v7 |
| Lighthouse CLI in CI | 0.14.x | 0.15.1 |

Babel core and its env/react presets remain on the latest compatible **7.29.7**.
Babel 8 was evaluated, but Jest's current syntax plugins still declare Babel 7
peer requirements. Keeping the compatible compiler avoids an invalid dependency
tree. These three packages are the remaining major-version entries in
`npm outdated`; there are no pending updates within their declared ranges.

The Node requirement is now **22.18+ within Node 22, or 24.11+**, matching Babel
parser 8. Updated calendar/icon imports and Jest's ESM transformation allowlist
accompany the package changes. The calendar's CSS feature detection is modeled
in jsdom using its CSS property parser.

## Fixes and cleanup

### Cursor and follow-up review

- Removed the animated custom pointer, its `cursor: none` override, link labels,
  pointer-specific z-index and unused markup. Native arrows, link hands, text
  carets and drag cursors now work in every theme and respect system pointer
  accessibility settings. There is no trailing ring or expanding overlay.
- Added a normal-motion desktop browser regression across all five themes,
  terminal input and forced-color mode. Earlier reduced-motion-only checks
  disabled the old cursor and therefore did not exercise its failure mode.
- Ignore global shortcut keys inside dropdowns; reduced-motion preferences now
  also disable the shared button's magnetic movement.
- Invalidate stale API simulator responses when switching endpoints or leaving
  the page. Cancel its scheduled automatic health check after a visitor makes a
  selection, and clear the scheduled timer on unmount. Three regression tests
  cover these races.
- Configure `nosniff`, strict-origin referrer handling, and permissions restrictions
  for camera, microphone and geolocation. A baseline CSP forbids plugin objects,
  foreign base URLs and embedding the site. These headers share the Vercel
  configuration across the development and production-preview servers. This is
  a baseline CSP, not a complete script-source policy.
- A fresh npm audit reports zero known advisories and GitHub returns zero open
  Dependabot alerts. Application security cannot be established by npm audit alone;
  the chat/storage regression checks remain part of verification.

The user confirmed pushing and deployment after reviewing the local changes.
The publication check compares the resulting
hosted asset manifest, each production asset and public files against the final
local build; report any configuration-dependent differences separately. The
31-file comparison above belongs to the original baseline, not this updated build.

### Earlier audit fixes

- Validate saved theme, sound and achievement preferences before constructing
  state. Malformed arrays previously could crash the entire portfolio.
- Make pattern section IDs match their public fragment links.
- Honor direct homepage fragments, including chat source links; explicit hashes
  take precedence over older navigation state.
- Update canonical and Open Graph URLs when the client route changes.
- Count GitHub stars and forks from original repositories, consistent with the
  committed data snapshot. Correct the text shown when all data sources fail.
- Replace the API simulator's unrelated domain label with an explicit simulator label.
- Improve secondary-text contrast across themes and syntax colors in the light theme.
- Make sitemap generation fail when route discovery fails, rather than silently
  shipping an incomplete sitemap or swallowing a generation error.
- Clear the global achievement toast timer on unmount.
- Remove the unused CRA web-vitals wrapper and package. Its previous call had
  no callback, so it never collected metrics.
- Remove the unused user-event testing dependency, the unreferenced 424,540-byte
  legacy screenshot, and ignore entries for a server directory that no longer exists.
- Update documentation and the console greeting to reflect React 19.

## Verification

- ESLint passed with warnings treated as errors.
- **358 Jest tests passed across 13 suites**, including saved-preference,
  keyboard-field, API-request and GitHub totals/fallback regressions.
- **9 chat tests** and **4 offline-worker tests** passed.
- Production browser suite: **19 passed, 5 intentionally skipped**. The full
  crawl and native desktop-pointer test run only on desktop; WebKit's offline simulation remains skipped.
  Chromium desktop, 320px Chromium mobile and mobile WebKit cover navigation,
  chat, focus, backup restoration and accessible learning/engineering pages.
- All **115** sitemap routes rendered; **439 unique link URLs** were collected
  with **zero crawl errors**. The crawl checks internal route targets,
  fragment targets and referenced public files and rejects runtime/resource errors.
- npm audit reported **zero vulnerabilities**. `npm ls --all` found no invalid
  dependency tree. Registry checks are a dated snapshot, not a future guarantee.
- A fresh `npm ci --prefer-offline --no-audit` installed all 837 packages from the
  final lockfile; lint and all 353 unit tests passed again after installation.
- Production gzip budgets passed: approximately **178.2 / 185 KiB** initial JS,
  **16.6 / 25 KiB** initial CSS and **528.6 / 800 KiB** total JS.
- The development server also rendered homepage, Two Sum, Core Java and learning
  routes without browser runtime errors; the 320px homepage had no horizontal overflow.

Run locally with `npm start` (or `npm.cmd start` on PowerShell). The reviewed
development session uses <http://127.0.0.1:3000/>. To repeat the production checks:

```sh
npm ci
npm run lint
npm run test:ci -- --runInBand
npm run test:chat
npm run test:offline
npm run build
npm run test:browser -- --workers=1
```

Playwright browsers must be installed. Sequential workers avoided local WebKit
timeouts seen when concurrent browsers, dependency installation and Jest were
competing for resources. The crawl attaches `site-crawl.json` to the HTML report.
The updated GitHub action versions still need their own remote CI run after push.

## Remaining external/configuration limits

| Area | Observed status / remaining work |
| --- | --- |
| Government project link | Node TLS verification fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`; the host's certificate chain should be checked. Browser trust behavior may differ. No verified replacement URL was available. |
| LinkedIn | HTTP 999 automation restriction; destination health could not be established automatically. |
| All 75 LeetCode links | HTTP 403 automation restrictions; no 404 response, but these destinations remain unverified. |
| GitHub profile/repositories/source files, Instagram, Twitter | 11 HTTP 200 responses; Twitter redirects to X. A successful HTTP response does not prove a profile's contents. |
| Google sign-in | Requires Firebase project settings, enabled provider and authorized domains. No live OAuth flow was verified. |
| AI chat | Disabled on the hosted baseline; requires server-side Gemini configuration. Local site search works without it. |
| Progress sync | Browser-local progress and JSON backups are implemented. Account-linked/cloud progress is future work. |
| Three historical projects | No repository/live URLs are supplied. Their cards omit unavailable link buttons; destinations were not invented. |
| Performance | Initial JS remains under its enforced budget with limited headroom. Vite warns that the entry chunk exceeds 500 kB before gzip; further code splitting is a possible follow-up. |

The Java labs and API console are browser simulations. The contact action opens
email; it does not submit to a backend. No deployment credentials, provider keys,
personal project claims or missing project destinations were invented.
