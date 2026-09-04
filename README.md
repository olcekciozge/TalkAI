# TalkAI — Realtime AI Speaking Practice

TalkAI is a mobile MVP for practicing spoken English with an AI partner in
real-life scenarios (coffee shop, taxi ride, job interview, etc.) via live
voice conversation over WebRTC. After each session the user gets structured
feedback (grammar, fluency, vocabulary, corrections). Sessions, favorites,
and profile data are stored per-account in Supabase.

Built as a 3-week / 15-working-day internship MVP.

## Features

- Voice conversation with push-to-talk (hold to speak, release to send).
- Live transcript panel during the call, plus full transcript on Feedback
  and History screens.
- Confirmation prompt before ending a call.
- Post-session feedback (grammar / fluency / vocabulary, corrections, better
  expressions, summary) from a **separate** LLM call (`gpt-4o-mini`, JSON
  Schema-constrained, scored against an explicit rubric so scores use the
  full 1–10 range instead of clustering in the middle).
- **Account required to practice** (email/password via Supabase Auth, no
  social sign-in). Browsing the scenario catalog is free.
- **Favorites** — from the home grid or scenario detail page, synced via a
  shared hook (`hooks/useFavorites.ts`) so all screens agree.
- **Profile screen** — editable name, email, average score, per-skill
  averages, favorites list, link to History, Sign Out.
- **Cloud-synced history** in Supabase, protected by Row Level Security.
- **Premium paywall** via RevenueCat, with identity explicitly linked to the
  Supabase account (`Purchases.logIn`/`logOut` on auth changes) so
  entitlement follows the account, not the device.

## Tech Stack

- **Frontend:** Expo `~52.0.49`, React Native `0.76.9`, TypeScript, Expo
  Router. `react-native-webrtc`, `react-native-incall-manager`,
  `react-native-purchases`, `@supabase/supabase-js`.
- **Backend:** Django + DRF — mints OpenAI Realtime ephemeral tokens and
  calls the Chat Completions API for feedback.
- **Data/Auth:** Supabase (Postgres + Auth + RLS).
- **AI:** OpenAI Realtime (`gpt-realtime-mini`) for conversation,
  `gpt-4o-mini` (`temperature: 0.3`, structured output) for feedback.
- **Monetization:** RevenueCat, Test Store/sandbox.

## Architecture

```
Expo App ──POST /api/realtime/token/──▶ Django Backend ──▶ OpenAI (mints ephemeral key)
   │
   ├─ WebRTC session using that key ──▶ OpenAI Realtime API (gpt-realtime-mini)
   │  (live audio + transcript events)
   │
   └─ On "End Session" ──POST /api/realtime/feedback/──▶ Django ──▶ gpt-4o-mini
      (transcript)                                        (JSON Schema feedback)
              │
              └─ saveSession() ──▶ Supabase (profiles, sessions — RLS-protected)
```

Notable decisions:
- **Two separate AI calls**: the realtime model just role-plays; a second,
  rubric-driven call produces feedback.
- **Push-to-talk, not VAD** — automatic voice detection was falsely
  triggering on ambient noise, so `turn_detection` is disabled and the app
  manually commits the audio buffer on mic release.
- **Learner goals are woven into the prompt**, not read as a checklist —
  each scenario's `tasks` are injected into the AI's system prompt with an
  explicit "don't checklist this" instruction.
- **No AI secret in the mobile bundle** — `OPENAI_API_KEY` only lives in the
  Django backend; the app gets a short-lived ephemeral token per session.
- **RLS is the real access boundary**, not client-side filtering — every
  Supabase query relies on `auth.uid() = user_id` policies.

## Project Structure

```
.
├── app/                    # Expo Router screens
│   ├── (tabs)/index.tsx    # Home — grid, filters, favorites
│   ├── (tabs)/profile.tsx  # Session History list (linked from Profile)
│   ├── scenario/[id].tsx   # Scenario detail
│   ├── scenario/live.tsx   # Live voice session
│   ├── feedback/result.tsx
│   ├── history/[id].tsx
│   ├── account.tsx         # Profile screen
│   ├── auth.tsx             # Sign in / sign up (email + password)
│   └── _layout.tsx         # Top/bottom bars, stack
├── components/              # FeedbackView, PremiumPaywall, TranscriptModal
├── contexts/                 # AuthContext, SearchContext
├── hooks/useFavorites.ts
├── constants/                # scenarios, styles, layout
├── lib/                      # supabase, profile, purchases, sessionStorage
├── backend/                  # Django (config/, realtime/, requirements.txt)
├── schema.sql                # Supabase schema (tables, RLS, triggers)
└── eas.json                  # EAS Build profiles (preview → .apk)
```

## Setup

**Supabase:** create a project at [supabase.com](https://supabase.com), run
`schema.sql` in the SQL Editor, copy the Project URL + `anon` key from
Project Settings → API.

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # set OPENAI_API_KEY
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

**Frontend:**
```bash
npm install
cp .env.example .env
# set EXPO_PUBLIC_BACKEND_URL (your LAN IP), EXPO_PUBLIC_REVENUECAT_API_KEY,
# EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
npm run android
```

Requires a Development Build (not Expo Go — native modules like
`react-native-webrtc` aren't in Expo Go's fixed module set).

**APK:**
```bash
npx eas-cli build --platform android --profile preview
```
`eas.json`'s `preview` profile already outputs a `.apk`.

## Scenarios

| # | Scenario | AI role | Level |
|---|----------|---------|-------|
| 1 | Taxi Ride | Taxi driver | A2 |
| 2 | Coffee Shop | Barista | A1–A2 |
| 3 | Talk to Professor | Professor | B1 |
| 4 | Football With Friends | Friend | B1 |
| 5 | Airport Check-in *(premium)* | Airline staff | A2 |
| 6 | Job Interview *(premium)* | Interviewer | B1–B2 |

## Known Limitations

- Superwall not integrated — custom RevenueCat paywall only.
- Email/password sign-in only — no Google/Apple (needs external OAuth setup).
- Only OpenAI Realtime is wired up — no Gemini Live / Grok.
- Monetization is sandbox/Test-Store only, single platform.
- Django backend runs with `DEBUG = True`, `ALLOWED_HOSTS = ['*']` (local/demo only).
- Fluency scoring is text-based (from transcript), not audio-based.
- No swipe-back guard on the live call screen — only the on-screen End
  Session button triggers the confirmation dialog.
- **Not tested on iOS** — a Mac (Xcode) or paid Apple Developer account
  ($99/yr) is required to run an iOS build, and neither was available. iOS
  support exists in code but is unverified.
- `transcriptionKeywords` in `constants/scenarios.ts` is defined but unused
  (not sent in the realtime `session.update` payload).


## Demo Script

Home (grid, filters, favorites) → tap a locked scenario → paywall → sign up
→ open Taxi Ride → Start speaking → hold mic, talk → transcript panel → End
Session (confirm) → feedback screen → Profile (stats, favorites) → History.
