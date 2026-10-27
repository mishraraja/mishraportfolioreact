# Project review — 27 October 2026

This records the earlier Vite migration baseline. See the subsequent
[end-to-end audit](END_TO_END_AUDIT.md) for current dependencies and verification.

## Fixes completed

- Replaced Create React App / react-scripts with Vite 8 and standalone Jest 30,
  removing the vulnerable legacy Webpack, SVG, PostCSS and development-server tree.
- Updated React Router to 7.18.4. Added production-browser checks for homepage,
  direct lesson links and navigation between arcade pages.
- Overrode Firebase's pinned older gRPC dependency with patched gRPC 1.14.5 or newer
  within the same major. Keep this override until Firebase updates its pin.
  This app imports Firebase app/auth; Firestore is not used at runtime.
- Moved shared chat retrieval to an ES module consumed by the browser and server.
- Preserved the build output directory, sitemap, offline release manifests and
  existing gzip budgets through a Vite manifest adapter.
- Updated Vercel to use Vite, retain the chat function, and route deep links to
  the app without rewriting API requests.
- Retained the existing REACT_APP_FIREBASE_* settings through an explicit four-key
  allowlist. Server environment variables are not passed to client code.
- Added explicit lint and npm audit checks to CI. Removed stale CRA configuration.
- CI now validates supported Node 22 and 24 releases. The local minimum is
  Node 22.13 to match the build and lint tools.
- Confirmed the browser runner exits cleanly with normal process permissions.
  The earlier Windows teardown stall was caused by the restricted execution
  environment; no forced-exit workaround was added to the project.

The earlier progress-validation, reserved-ID, production-chat and security-policy
fixes remain in place.

## Verification

- All 350 Jest tests passed across 11 suites under Jest 30.
- ESLint checks application code, tests and tooling; CI rejects warnings as well
  as lint errors.
- All 9 chat API/search tests and all 4 offline-worker tests passed.
- Production Playwright suite: 17 passed, 1 intentionally skipped, clean exit.
  Desktop Chromium, 320px mobile Chromium and mobile WebKit covered chat, layout,
  accessibility, backup restoration and arcade navigation. Both Chromium profiles
  also passed offline navigation and download removal. The WebKit offline
  simulation remains intentionally skipped.
- Development server: learning page, Two Sum, Core Java and local chat passed a
  browser smoke check without runtime errors.
- Production build passed; sitemap contains 115 routes, offline bundle 24 files.
  Gzip budgets: initial JavaScript 147.7 / 185 KiB, initial CSS 16.8 / 25 KiB,
  all JavaScript 510.0 / 800 KiB.
- Build environment smoke check confirmed public Firebase config is included,
  while a server-key sentinel and an unlisted REACT_APP_* sentinel are excluded.
- npm install/audit reported zero advisories for the replacement dependency tree.
  Advisory databases change; CI checks the installed lockfile again on each run.

## Configuration still owned by the deployment

Google sign-in requires Firebase public settings, an enabled provider and authorized
hosting domains. Gemini replies require server-only credentials and an enabled
model. No real credentials were supplied or invented, and live OAuth / Gemini
requests have not been verified. Local search and learning work without them.

Progress remains browser-local and shared within a browser profile. Backups are
implemented; account-owned storage and cloud synchronization are not. The API
console and Java labs remain frontend simulations, and the hire action opens email.

A passing local build is not evidence of the final GitHub CI or Vercel deployment
status. Check those services after the pushed revision finishes processing.
