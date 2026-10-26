# Project review — 26 October 2026

## Git synchronization

The initial checkout was 11 commits behind origin/main. All 11 commits only
refreshed public/data/github.json. They were fast-forwarded without discarding
local changes. Existing local chat, learning, offline and CI work is included
in this review and must be committed together because the app imports those files.

## Fixes

- Fix production chat search: CRA emitted the `.cjs` import as an asset URL,
  causing every send to throw. The shared CommonJS implementation now uses
  `.js`, which both the browser bundler and Node endpoint load as code.
- Validate saved DSA and Java progress before rendering, so malformed storage
  cannot crash the arcades. Added regression tests for both routes.
- Reject reserved review-record IDs to prevent corrupting answer history.
- Align asynchronous route test deadlines with their assertion wait periods.
- Ignore all environment-file variants while keeping the blank example tracked.
- Replace the template security policy with actual reporting and support details.
- Apply compatible npm updates. The lockfile updates 44 installed packages,
  including fixes for all three initially reported critical advisories.

## Validation

- Jest: 350 tests passed across 11 suites.
- Chat API and search: 9 tests passed, using a mocked AI provider.
- Offline service worker: 4 tests passed.
- Production build compiled successfully; sitemap contains 115 routes.
- Gzip budgets passed: initial JavaScript 146.8 KiB / 185 KiB, initial CSS
  16.9 KiB / 25 KiB, all JavaScript 510.9 KiB / 800 KiB.
- Playwright: 14 passed, 1 intentionally skipped. Desktop Chromium, 320px
  mobile Chromium and mobile WebKit passed chat, accessibility, layout and
  backup restoration checks. Both Chromium profiles passed offline navigation
  and download removal; the WebKit offline simulation is intentionally skipped.
  Command: `npm run test:browser -- --workers=2 --reporter=list --trace=off`.
  All cases finished, but the Windows runner stalled during teardown and was
  stopped manually; a clean runner exit is still unverified. Linux CI must be
  checked separately.
- Pattern scan found no matching Google API keys, private keys or GitHub tokens
  in the reviewed application, API, public assets, scripts and configuration.
  Pattern matching is not a complete secret audit.

## Remaining work and limits

The final npm audit reports 62 affected packages: 22 high, 31 moderate, 9 low,
and zero critical. Counts include transitive and build/test dependencies because
react-scripts is currently a production dependency. The initial production-only
scan and final full scan use different scopes and should not be compared as totals.
GitHub's push response separately reported 69 Dependabot findings (2 critical,
37 high, 26 moderate, 4 low). Its counts differ from the local npm scan and may
reflect a different advisory database or scan revision. Recheck GitHub's security
dashboard after it rescans the updated lockfile; critical alerts are not claimed
resolved there.

- react-scripts 5 brings older Webpack, Jest, PostCSS, SVG and service-worker
  tooling. Its suggested forced audit fix installs react-scripts 0.0.0, which
  would break the build. Plan a tested build-tool migration rather than using it.
- Firebase includes Firestore and its affected grpc dependency, although this
  app imports only Firebase app/auth. npm suggests a major Firebase downgrade;
  that was not applied. Review the SDK dependency separately.
- React Router 6.30.6 retains moderate advisories. The audit's fix requires a
  tested migration to React Router 7.18 or later. App navigation currently uses
  fixed routes and validated local learning links; SSR hydration is not used.
- Optional Google sign-in requires Firebase configuration and authorized domains.
  Mocked tests do not verify a live OAuth login. Sign-in does not sync progress.
- Optional Gemini replies require server-only credentials and an enabled model.
  Provider responses have not been verified live. Per-instance chat throttling
  is not a durable global quota.
- Learning progress is local to the browser, shared within its browser profile,
  and removable by clearing storage. Manual backups are implemented; account
  isolation and cloud synchronization are not implemented.
- The API console and Java labs are frontend simulations. The hire action opens
  an email link; it does not submit or persist an application.
- A Git push does not prove that Vercel deployment or GitHub CI has passed.
  Deployment, live external services and Lighthouse scores require separate checks.

This review checks the repository and automated behavior; it does not establish
that every possible security issue or content error has been eliminated.
