# Free hosting and Google sign-in

This version runs as a static React app on Vercel. Revision scheduling, JSON
backups and offline lessons do not need a database or a paid backend. Google
sign-in is implemented but stays unavailable until you configure your project.

Site chat also works locally without an account or paid service. Its optional
Gemini replies use a Vercel function; see [chat setup](CHAT_SETUP.md). Firebase
Google sign-in and the Gemini API key are separate configurations.

## Enable Google sign-in

1. Create a project in the [Firebase console](https://console.firebase.google.com/)
   using the no-cost **Spark** plan. Register a Web app in Project settings.
   Analytics is not required for this integration.
2. Under Authentication, enable the Google provider and select a support email.
3. Under Authentication settings, add `rajamishra.vercel.app` to Authorized
   domains. Add your custom domain if you use one. For development, explicitly
   add `localhost`; do not assume new projects include it. Authorize only preview
   domains you actually use.
4. Copy `.env.example` to `.env.local` and fill in the four values from the Web
   app's Firebase configuration: `apiKey`, `authDomain`, `projectId`, `appId`.
   Keep the supplied Firebase auth domain (normally `PROJECT.firebaseapp.com`).
5. Add the same `REACT_APP_FIREBASE_*` values to Vercel's project environment
   variables. Redeploy: CRA reads these values at build time. Restart the local
   development server after changing `.env.local`.
6. Open `/learning`, select **Sign in with Google**, and test a successful login,
   cancelling the popup, sign-out and account deletion. Test on a phone too.

These four Firebase web configuration values are public client configuration.
Never put a Google client secret, service-account private key or Admin SDK
credential in a `REACT_APP_*` variable. This integration does not require one.
Firebase handles the Google OAuth provider setup; there is no custom password
form. First Google sign-in creates the Firebase authentication account.

The SDK loads only from the learning page when configured. Authentication uses
session persistence and requests no Gmail, Drive or Calendar access. The app
supports sign-out and deleting its Firebase account; neither action deletes a
Google account or local learning progress. Progress is shared within the browser
profile, is not owned by the signed-in account, and does not sync automatically.
Use JSON export/import to transfer it. Do not describe this release as cloud sync.

See [Firebase's Google sign-in guide](https://firebase.google.com/docs/auth/web/google-signin)
and [pricing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans).
Keep Spark selected and check the console's current limits before enabling other
services. No paid Firebase service is needed for the features in this release.

## Backend options for a later phase

Checked against provider documentation on 15 October 2026. Free plans have
resource limits; they are not a promise of unlimited or permanently free hosting.

| Option | Suitable use | Limit to plan around |
| --- | --- | --- |
| Vercel static hosting | This portfolio and browser-based arcades | Stay within Hobby eligibility and usage limits; the app has no server-side progress API |
| Firebase Spark Authentication | Google login in this implementation | Requires provider/domain configuration; authentication alone does not store progress |
| Render Free web service | A later small API or containerized Spring Boot demo | Sleeps after 15 minutes idle; startup can take about a minute; local files are temporary |

[Render's free plan](https://render.com/docs/free) can host a demonstration backend.
Its free PostgreSQL database expires after 30 days, so it is not a lasting free
database choice for user progress. A Spring Boot deployment also needs memory
testing against the selected instance's limits. No Render service was created
as part of this change.

Before adding sync, choose durable storage, validate Firebase ID tokens on the
server, scope records by verified user ID, define access rules, and decide how
offline edits are merged. Do not trust a client-supplied email or score.

## Offline behavior

`npm run build` generates `/offline-assets.js` and `/offline-info.json`. Visitors
opt in from `/learning`. The worker saves the app HTML, favicon, JS and CSS as one
release. It excludes source maps, auth responses, API calls and external media.
Cache installation must finish before the release can activate. The update
button allows a waiting release to activate; activation removes older app caches.
An active worker may also check for updates during later visits.

Offline routes include `/learning`, `/engineering`, `/dsa` and `/java`. External
links, Google login and live GitHub calls require connectivity. Browser eviction
can remove downloads, and private browsing can restrict storage. The removal
button clears only this app's offline caches and worker, preserving progress.

For local production checks:

```sh
npm run build
node scripts/serve-build.mjs
```

Open `http://127.0.0.1:4173/learning`. Offline downloads are intentionally disabled
in the CRA development server to avoid caching development assets.

## Checks before deployment

```sh
npm run test:ci -- --runInBand
npm run build
npx playwright install chromium webkit
npm run test:browser
```

The production build enforces gzip budgets: 185 KiB initial JS, 25 KiB initial
CSS and 800 KiB total JS. CI browser tests cover desktop Chromium, a 320px mobile
viewport and mobile WebKit, including accessibility checks on the new pages.
Offline network simulation runs in Chromium. Lighthouse now fails its workflow
for a mobile performance score below 0.80 or accessibility below 0.90.

These workflow definitions are not evidence that a run has passed. Make the
relevant checks required in GitHub branch protection if merges must wait for
them. A Vercel deployment is not automatically blocked by a separate failed
GitHub workflow. Live Google OAuth needs the configured project and must be
verified separately from mocked tests.
