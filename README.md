# TalkAI — Realtime AI Speaking Practice

TalkAI is a mobile MVP for practicing spoken English with an AI partner in
real-life scenarios (coffee shop, taxi ride, job interview, etc.) via live
voice conversation over WebRTC. After each session the user gets structured
feedback (grammar, fluency, vocabulary, corrections). Sessions, favorites,
and profile data are stored per-account in Supabase.

Built as a 4-week / 20-working-day internship MVP.

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
- **Standalone APK works on any network** — the backend is tunneled through
  a free static ngrok domain, so the built APK doesn't need to be on the
  same Wi-Fi as the dev machine (see [ngrok setup](#running-a-standalone-apk-via-ngrok)).
- **Push notifications** via OneSignal — a daily re-engagement reminder
  ("haven't practiced today?") is sent automatically to users inactive for
  24h+, configured entirely through a OneSignal Journey (no custom backend
  code). Push subscriptions are linked to the Supabase user id via
  `OneSignal.login()`/`logout()` on auth state changes.
- **Product analytics** via Amplitude — tracks sign up/in/out, scenario
  views, favorites, session start/end, feedback views, paywall views, and
  purchases/restores. User identity is linked to the Supabase user id so
  behavior can be traced per account, not just per device.

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
- **Push notifications:** OneSignal (`react-native-onesignal@5.3.6`,
  `onesignal-expo-plugin@1.3.2` — see [Custom config plugins](#custom-config-plugins-plugins)
  for why these specific versions).
- **Analytics:** Amplitude (`@amplitude/analytics-react-native`) for product
  usage tracking.
- **Tunneling:** ngrok (free static domain) for exposing the local backend
  during standalone APK testing/demos.

## Architecture

```
Expo App ──POST /api/realtime/token/──▶ Django Backend ──▶ OpenAI (mints ephemeral key)
   │            (via ngrok tunnel)
   ├─ WebRTC session using that key ──▶ OpenAI Realtime API (gpt-realtime-mini)
   │  (live audio + transcript events)
   │
   └─ On "End Session" ──POST /api/realtime/feedback/──▶ Django ──▶ gpt-4o-mini
      (transcript, via ngrok)                              (JSON Schema feedback)
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
- **Backend reachable via a static ngrok domain**, not a LAN IP — a LAN IP
  baked into the APK at build time only works on that one network and
  breaks the moment the phone or laptop changes networks. A free static
  ngrok domain (`*.ngrok-free.dev`) stays constant regardless of network,
  as long as the backend + ngrok are running on the demo machine.

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
├── plugins/                  # Custom Expo config plugins (see below)
├── schema.sql                # Supabase schema (tables, RLS, triggers)
└── eas.json                  # EAS Build profiles (preview → .apk)
```

### Custom config plugins (`plugins/`)

The native `android/` folder is generated fresh on every EAS build
(Continuous Native Generation), so any hand-edit to files like
`android/app/build.gradle` or `AndroidManifest.xml` gets wiped on the next
build. These two plugins bake the necessary native changes into every
prebuild instead:

- **`withDebuggableManifest.js`** — forces `android:debuggable="true"` in
  the manifest even for release builds. RevenueCat's SDK checks this native
  flag (not the Gradle build type) to decide whether a Test Store API key
  is allowed; without this, a `preview`/release build crashes on launch
  with *"This app is using a test API key... The app will close now."*
- **`withDisableHardcodedDebugModeLint.js`** — disables Android Lint's
  `HardcodedDebugMode` check, which otherwise fails `lintVitalRelease` and
  blocks the release build because `android:debuggable` is no longer
  auto-assigned by the build type.
- **`withSkipKotlinMetadataVersionCheck.js`** — OneSignal's native Android
  JARs are compiled with a newer Kotlin compiler than the one RN 0.76's
  Kotlin Gradle Plugin ships with, which fails the build with
  `Module was compiled with an incompatible version of Kotlin`. Bumping the
  project's own Kotlin version to match breaks the Kotlin Gradle Plugin
  itself (`Found interface KotlinTopLevelExtension, but class was expected`),
  so instead this plugin adds the `-Xskip-metadata-version-check` compiler
  flag to every Kotlin compile task, which is the fix Gradle's own error
  message suggests.

Together these let `eas build --profile preview` produce a normal
`assembleRelease` APK (JS bundle properly embedded, no Metro required)
while still allowing the RevenueCat Test Store key and OneSignal to work
without crashing or failing to compile.

### A note on `react-native-onesignal` / `onesignal-expo-plugin` versions

Both packages are pinned to older releases on purpose:
- `react-native-onesignal@5.3.6` — versions 5.4.x+ require React Native
  ≥0.79 (they register their TurboModule through an API only added in
  0.79); on RN 0.76 (this project's version) they crash at runtime with
  `TurboModuleRegistry.getEnforcing(...): 'OneSignal' could not be found`.
  5.3.x uses the legacy bridge module instead, which works fine under the
  New Architecture's interop layer.
- `onesignal-expo-plugin@1.3.2` — the current release (2.0.3) requires
  Expo SDK ≥53. This project is on SDK 52, so 1.3.2 is the last version
  that resolves cleanly.

## Setup

**Supabase:** create a project at [supabase.com](https://supabase.com), run
`schema.sql` in the SQL Editor, copy the Project URL + `anon` key from
Project Settings → API.

**OneSignal (push notifications):**
1. Create a free app at [onesignal.com](https://onesignal.com).
2. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com),
   add an Android app with package name `com.olcekciozge.talkai`, and
   download `google-services.json` into the project root.
3. In Firebase, go to Project Settings → Cloud Messaging → Manage Service
   Accounts → create a JSON key, and upload that JSON when configuring the
   Google Android (FCM) platform in OneSignal.
4. Copy the OneSignal App ID into `app.json`'s `extra.oneSignalAppId`.
5. In OneSignal, go to Messages → Journeys → Re-engagement, and set the
   entrance segment to an inactivity-based audience segment (e.g.
   "Last Session greater than 24 hours ago") with a single Push
   Notification step, then set the Journey live. No custom backend code is
   needed for the daily reminder — it's entirely dashboard-configured.

**Amplitude (analytics):**
1. Create a free project at [amplitude.com](https://amplitude.com) named
   "TalkAI".
2. Copy the project's API Key (Project Details → API Key) into `.env` as
   `EXPO_PUBLIC_AMPLITUDE_API_KEY`.
3. That's it — no dashboard configuration needed for events to start
   flowing; `lib/analytics.ts` initializes the SDK and every tracked event
   (see [Features](#features)) is sent automatically once a user interacts
   with the app. Verify events are arriving under Amplitude's User
   Look-Up / Event Explorer view.

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # set OPENAI_API_KEY
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

**Frontend (local dev, same Wi-Fi as backend):**
```bash
npm install
cp .env.example .env
# set EXPO_PUBLIC_BACKEND_URL (your LAN IP), EXPO_PUBLIC_REVENUECAT_API_KEY,
# EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
npm run android
```

Requires a Development Build (not Expo Go — native modules like
`react-native-webrtc` aren't in Expo Go's fixed module set).

## Running a standalone APK via ngrok

A LAN IP baked into `.env` only works while the phone is on the same
Wi-Fi as the machine running the backend, and requires a full rebuild
(~10–15 min) every time the network changes. Tunneling the backend through
a free static ngrok domain removes that constraint — the same APK works on
any network, as long as the backend + ngrok are running somewhere reachable.

1. Sign up at [ngrok.com](https://ngrok.com) and reserve a free static
   domain under **Domains** (e.g. `your-name.ngrok-free.dev`).
2. Install the ngrok CLI and run `ngrok config add-authtoken <TOKEN>`
   (token is in the ngrok dashboard).
3. Start the backend as usual: `python manage.py runserver` (port 8000).
4. In a second terminal, start the tunnel:
   ```bash
   ngrok http --url=your-name.ngrok-free.dev 8000
   ```
5. Point the app at the tunnel. **This must be set in two places:**
    - Locally, in `.env`, for `npm run android` / dev builds:
      ```
      EXPO_PUBLIC_BACKEND_URL=https://your-name.ngrok-free.dev
      ```
    - On EAS, for `eas build`, since env vars are baked in at build time and
      EAS reads its own stored values, not your local `.env`:
      ```bash
      npx eas-cli env:update --name EXPO_PUBLIC_BACKEND_URL \
        --value "https://your-name.ngrok-free.dev" --environment preview
      ```
      Verify with `npx eas-cli env:list` (select `preview`) before building.
6. ngrok's free tier shows an interstitial browser-warning page for
   non-browser requests unless a header is sent — `live.tsx` and
   `result.tsx` already add `ngrok-skip-browser-warning: true` to their
   `fetch` calls, so this is handled automatically once the URL above is
   set correctly.
7. Build: `npx eas-cli build --profile preview --platform android`, install
   the resulting APK, and test. The backend + ngrok tunnel must stay
   running on the host machine for the app to work — this is a demo/dev
   setup, not a deployment.

## APK

```bash
npx eas-cli build --platform android --profile preview
```
`eas.json`'s `preview` profile outputs a `.apk` (`assembleRelease` under
the hood — see [Custom config plugins](#custom-config-plugins-plugins)
for why release, not debug, is used).

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
- Django backend runs with `DEBUG = True`, `ALLOWED_HOSTS = ['*']` — fine
  for local/demo use, but note that while the ngrok tunnel is active the
  backend is reachable from the public internet, not just the demo device.
- Fluency scoring is text-based (from transcript), not audio-based.
- No swipe-back guard on the live call screen — only the on-screen End
  Session button triggers the confirmation dialog.
- **Not tested on iOS** — a Mac (Xcode) or paid Apple Developer account
  ($99/yr) is required to run an iOS build, and neither was available. iOS
  support exists in code but is unverified.
- `transcriptionKeywords` in `constants/scenarios.ts` is defined but unused
  (not sent in the realtime `session.update` payload).
- `android:debuggable` is hardcoded to `true` in release builds (see
  [Custom config plugins](#custom-config-plugins-plugins)) as a workaround
  for a RevenueCat Test Store key check — fine for internal/demo builds,
  but should be revisited before any real store release.
- OneSignal and its Expo plugin are pinned to older versions (5.3.x / 1.3.2)
  to stay compatible with Expo SDK 52 / React Native 0.76 — revisit these
  pins when the project upgrades to SDK 53+.
- The daily reminder Journey re-engages any inactive subscriber; it isn't
  personalized per scenario or streak yet.
- Analytics events are fired client-side only — there's no server-side
  verification, so event volume could in theory be spoofed by a modified
  client. Fine for an MVP's product-usage insights, not suitable as a
  source of truth for anything security- or billing-sensitive.


## Demo Script

Home (grid, filters, favorites) → tap a locked scenario → paywall → sign up
→ open Taxi Ride → Start speaking → hold mic, talk → transcript panel → End
Session (confirm) → feedback screen → Profile (stats, favorites) → History.
