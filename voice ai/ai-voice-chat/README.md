# AI Voice Chat — MVP

A conversational AI web app using the Claude API, with typed and spoken input/output.

## Structure

```
ai-voice-chat/
  server/   Express backend — holds the Anthropic API key, calls Claude
  client/   React (Vite) frontend — chat UI, mic input, spoken output
```

## Run it locally

**1. Backend**
```bash
cd server
npm install
cp .env.example .env    # paste your real ANTHROPIC_API_KEY in .env
npm run dev              # runs on http://localhost:3001
```

**2. Frontend** (in a second terminal)
```bash
cd client
npm install
cp .env.example .env     # defaults are fine for local dev
npm run dev               # runs on http://localhost:5173
```

Open http://localhost:5173. Type a message, or click the mic icon and speak
(Chrome or Edge recommended — see Known Limitations below).

## Deploying to make it a live website

You need to deploy the two pieces separately: a Node host for the backend,
a static host for the frontend.

### Backend (pick one: Render, Railway, or Fly.io — Render shown here)

1. Push this project to a GitHub repo.
2. In Render: **New → Web Service**, connect the repo, set root directory to `server`.
3. Build command: `npm install` — Start command: `npm start`.
4. Add environment variables in Render's dashboard: `ANTHROPIC_API_KEY`,
   `CLAUDE_MODEL` (optional), `CORS_ORIGIN` (set this to your deployed
   frontend URL once you have it, e.g. `https://your-app.vercel.app`).
5. Deploy. Note the resulting URL, e.g. `https://your-api.onrender.com`.

### Frontend (Vercel or Netlify — Vercel shown here)

1. In Vercel: **New Project**, import the same repo, set root directory to `client`.
2. Framework preset: Vite. Build command: `npm run build`. Output dir: `dist`.
3. Add environment variable: `VITE_API_BASE_URL` = your backend URL from
   above (e.g. `https://your-api.onrender.com`).
4. Deploy. Vercel gives you a live URL, e.g. `https://your-app.vercel.app`.
5. Go back to Render and set `CORS_ORIGIN` to that exact URL, then redeploy
   the backend so it accepts requests from it.

Your site is now live. HTTPS is required for microphone access in the
browser — both Render and Vercel provide HTTPS automatically.

## Environment variables

**server/.env**
| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Your secret key from console.anthropic.com — never expose this in frontend code |
| `CLAUDE_MODEL` | Model ID, e.g. `claude-sonnet-5` |
| `CORS_ORIGIN` | Your deployed frontend URL(s), comma-separated |
| `PORT` | Defaults to 3001 |

**client/.env**
| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | URL of your deployed backend |

## Privacy & security notes

- The Anthropic API key lives only in the backend's environment variables —
  it is never sent to or readable from the browser.
- Voice input is transcribed by the browser's built-in speech recognition
  (Web Speech API), which sends audio to the browser vendor's speech
  service (e.g. Google's, in Chrome) to produce text. This app itself does
  not record or store raw audio.
- Conversation history is stored only in the browser's `localStorage` in
  this MVP — not on any server. "New chat" clears it. For production, you
  may want to move history to a real database with proper user auth and a
  clear retention policy instead.
- Rate limiting is IP-based and basic — fine for an MVP, not abuse-proof at scale.

## Known limitations & next steps

- **No streaming yet** — replies arrive all at once. Adding
  server-sent events / streaming would let speech start before the full
  reply finishes generating, which will make voice conversations feel much
  more natural.
- **No web search / live data** — the model can't look up current
  events on its own yet. Next step: add Anthropic's web search tool on the
  backend and pass results into context.
- **No document upload / retrieval** — for private/uploaded knowledge,
  add a retrieval step (embed documents, search them, inject relevant
  chunks into the system prompt) before calling Claude.
- **Browser STT/TTS quality varies by browser** — Safari and Firefox
  have weaker or no support for `SpeechRecognition`. For production quality
  and cross-browser consistency, swap in a paid STT provider (e.g.
  Deepgram, AssemblyAI) and TTS provider (e.g. ElevenLabs, Anthropic-adjacent
  TTS APIs) — the `useSpeech.js` hook is written so you can replace its
  internals without touching the rest of the UI.
- **No auth** — anyone with the URL can chat and consume your API
  budget. Add login (or at least a shared password/invite code) before
  sharing the link widely.
- **No automated tests yet** — worth adding once the feature set stabilizes.

## Testing checklist before sharing the live link

- [ ] Send a text message, confirm a reply appears
- [ ] Click mic, speak, confirm transcript appears and gets sent
- [ ] Toggle "Speak responses" off, confirm no audio plays
- [ ] Start a reply speaking, then click mic again — confirm it stops speaking and starts listening (interrupt flow)
- [ ] Turn off wifi mid-request — confirm a friendly error shows, not a crash
- [ ] Deny microphone permission — confirm a clear message, not a silent failure
- [ ] Open on a phone browser — confirm layout and mic button work
- [ ] Click "New chat" — confirm history clears
