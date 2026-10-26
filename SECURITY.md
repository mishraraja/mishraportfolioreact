# Security Policy

Security fixes target the current `main` branch. Older snapshots are not maintained.

## Reporting a vulnerability

Email [rajamishra131297@gmail.com](mailto:rajamishra131297@gmail.com) with the
affected route or file, reproduction steps, and potential impact. Do not include
credentials or other people's personal data. Please report sensitive issues
privately before opening a public issue. Response times are not guaranteed.

## Deployment boundaries

Learning progress stays in browser storage; Google sign-in does not isolate or
sync it. Treat imported backups as untrusted data. The API console and Java labs
are simulations, not backend services.

Gemini credentials belong only in server environment variables. AI replies are
disabled by default. The chat endpoint's in-memory throttling is per function
instance and does not provide a global quota. See [chat setup](docs/CHAT_SETUP.md).

Run `npm audit` when updating dependencies. Build and test tooling advisories
must be reviewed separately from code shipped to visitors; a passing build is
not evidence that the dependency tree is free of vulnerabilities.
