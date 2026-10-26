# Site chat

The chat launcher opens a separate bundle. By default it searches 171 public
content entries locally and shows matching excerpts with page links. It works
without an account, database or API key. The count changes as content is added.
This is keyword search, not a language model running in the browser.

The chat shares the site's theme colors and space-themed controls. Press Enter
or the send arrow to submit; Shift+Enter adds a line. The X button and Escape
close it. Topic cards fill the input for editing before sending. Decorative
motion respects the system's reduced-motion setting.

## Optional Gemini replies on Vercel

1. Create an API key in [Google AI Studio](https://aistudio.google.com/).
   Choose a project on the free tier. Check its available models and active
   quotas; do not enable paid billing for a zero-payment deployment.
2. In **Vercel → Project → Settings → Environment Variables**, set:

   | Variable | Value |
   | --- | --- |
   | `CHAT_AI_ENABLED` | `true` |
   | `GEMINI_API_KEY` | Your private Gemini API key |
   | `GEMINI_MODEL` | A text model ID currently available on your project's free tier |

3. Redeploy the project. Open `/api/chat`: it should return only
   `{"aiEnabled":true}`, never credentials.
4. Open the chat, opt into AI replies, and ask about a named project or Two Sum.
   Check that the answer links to supporting site pages. Also test an unrelated
   question, a phone viewport and a failed provider request.

Never prefix the API key with `REACT_APP_`, put it in source control, or paste it
into a public chat. These variables are read by `api/chat.js` on the server.
Leave `CHAT_AI_ENABLED=false` to keep local search only. No model is selected
automatically, to avoid assuming a model is free for your project.

The [Gemini pricing page](https://ai.google.dev/gemini-api/docs/pricing) lists
free-tier availability and data-use terms. Quotas vary by project/model and can
be checked in [AI Studio](https://ai.google.dev/gemini-api/docs/rate-limits).
Free-tier inputs may be used to improve Google's products; the UI explains this
before visitors opt in. Only the current question and selected public passages
are sent, not Google sign-in details, progress, backups or prior messages.

Vercel Hobby's [eligibility and usage limits](https://vercel.com/docs/plans/hobby)
still apply. Provider failures, exhausted quotas and timeouts fall back to local
excerpts. If Vercel's function allowance is exhausted, local search still works
as long as static hosting remains available. There is no unlimited free-AI claim.

## Content and behavior

`npm run chat:index` reads literal public fields from the existing profile,
projects, DSA problems and Java topic files. It does not execute the lesson
code or read environment files. It writes `src/chat/site-index.json`, shared by
the browser and endpoint. Generation runs before `npm start` and `npm run build`.
Commit the generated file alongside source content changes. The small summaries
for learning tools and architecture live in the generator and need updating if
those features change.

The endpoint performs retrieval itself. It accepts no client-provided passages,
system prompts or model selection. No-match questions do not call Gemini. AI
answers must reference IDs in the retrieved sources; the app supplies the actual
links, and renders text without executing HTML or Markdown. Instructions restrict
answers to the supplied sources, but citation validation cannot prove every
generated sentence is accurate. The interface labels AI answers and asks readers
to check the sources. For strictly verbatim content, leave AI disabled.

Each question is independent; conversation history is displayed but not sent to
the model. The panel keeps the latest six exchanges in memory and clears on
close. It does not save chats to localStorage or a database. Hosting and provider
logging policies remain separate from that browser behavior.

## Limits and validation

- Maximum question length: 600 characters.
- Provider timeout: 12 seconds; Vercel function maximum: 20 seconds.
- At most three public passages sent; each is capped at 2,200 characters.
- Warm-instance limits: five AI requests per IP per minute, twenty total per
  minute. Counters reset on cold starts and are not shared across instances.
  They reduce casual overuse, but are not a durable quota or billing safeguard.
- Use Google's free-tier provider quotas as the external usage ceiling. Review
  shared rate limiting and bot protection before increasing public traffic or
  attaching a paid billing account.

The implementation uses the Gemini
[generateContent API](https://ai.google.dev/api/generate-content) and a
[Vercel Node function](https://vercel.com/docs/functions/runtimes/node-js).
No additional runtime dependency or separate backend host is needed.

```sh
npm run chat:index
npm run test:chat
npm run test:ci -- --runInBand
npm run build
```

`npm start` and the static production preview serve local search. They do not run
Vercel functions. Test the optional AI endpoint on a Vercel preview deployment
with the three server-side variables configured. Unit tests mock the provider;
they are not evidence of a successful live Gemini request.
