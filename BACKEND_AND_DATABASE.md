# Studified — Backend & Database Guide

> How the backend works, where the database lives, how data flows through the app,
> and exactly what you would need to change to upgrade the database or move
> everything onto your own VPS.
>
> Every claim below references real files in this repo — open them side-by-side.

---

## 1. At a glance

| Question | Short answer |
|---|---|
| Backend model | **Serverless / Backend-as-a-Service** — there is no always-on server of your own |
| Database | **Cloud Firestore** (NoSQL document database) |
| Where the DB lives | Firebase project **`authv2-3a0fc`** (pinned in `.firebaserc`) + a localStorage snapshot in each user's browser |
| Authentication | **Firebase Authentication** (Email/Password) |
| AI backend | **Groq** chat-completions via a server-side proxy, so the API key never ships to the browser |
| Hosting | Static SPA (`dist/`) on **Firebase Hosting** or **Vercel** (both are wired up) |
| Offline behaviour | **Offline-first** — localStorage is the fast path, Firestore is the cloud sync target |
| Legacy note | Exported from **Base44**; its SDK "shape" is emulated locally, never called remotely |

---

## 2. Architecture overview

```
┌───────────────────────────── Browser (React SPA) ──────────────────────────────┐
│                                                                                │
│   src/pages/*, src/components/*                                                │
│         │  reads/writes through a Proxy                                        │
│         ▼                                                                      │
│   src/lib/db.js ──► globalThis.__B44_DB__ ◄── created by src/lib/localDb.js    │
│   (Base44-style API: db.auth.me(), db.entities.Quest.filter(),                 │
│    db.integrations.Core.InvokeLLM())                                           │
│         │                              │                                       │
│         │ writes land here FIRST       │ debounced cloud sync (600 ms)         │
│         ▼                              ▼                                       │
│   localStorage                 src/lib/userDataService.js                      │
│   key: studified_db_{uid}              │                                       │
│                                        ▼                                       │
│                            src/lib/cloudDatabase.js  ──────────────┐           │
│    src/lib/llm.js (AI calls)                                       │           │
│         │                                                          │           │
└─────────┼──────────────────────────────────────────────────────────┼───────────┘
          │ POST /api/groq/v1/chat/completions                       │ Firestore SDK
          ▼                                                          ▼
┌───────────────────────────────┐                  ┌───────────────────────────────┐
│  Groq proxy (server-side)     │                  │  Firebase project             │
│  dev:     scripts/            │                  │  authv2-3a0fc                 │
│           groq-proxy-plugin.js│                  │  ├─ Authentication (accounts) │
│  Vercel:  api/groq.js         │ ──► api.groq.com │  └─ Cloud Firestore           │
│  Firebase: functions/         │                  │     ├─ users/{uid}            │
│            index.js           │                  │     │   └─ (subcollections)   │
│  holds GROQ_API_KEY           │                  │     └─ leaderboard/{uid}      │
└───────────────────────────────┘                  └───────────────────────────────┘
```

**Key idea:** all backend "work" is either (a) Firebase doing auth + database for
you, or (b) one tiny proxy function that forwards AI requests to Groq. There is
no Express server, no SQL database, and no custom REST API to host.

---

## 3. The backend, piece by piece

### 3.1 Firebase Authentication (`src/lib/firebase.js`, `src/lib/AuthContext.jsx`)

- Initialized from the `VITE_FIREBASE_*` env vars in `src/lib/firebase.js`. If any
  of `VITE_FIREBASE_API_KEY / AUTH_DOMAIN / PROJECT_ID / APP_ID` is missing, the
  app renders a `firebase_not_configured` auth error instead of signing in.
- Email/Password sign-in UI: `src/components/auth/AuthForm.jsx`.
- `AuthContext.jsx` listens with `onAuthStateChanged`; on sign-in it:
  1. builds a profile (`profileFromFirebaseUser` in `src/lib/userDataService.js`),
  2. loads the user's cloud data (`loadUserGameData`),
  3. initializes the local DB (`initDbForUser`),
  4. pushes the merged profile back to Firestore.
- `src/components/ProtectedRoute.jsx` blocks all app routes until
  `isAuthenticated && dbReady`.

### 3.2 Cloud Firestore — the database

- Accessed **directly from the browser** with the Firebase JS SDK — there is no
  server in the middle. Security is enforced by `firestore.rules` (§7).
- Essentially all Firestore code lives in two files:
  - `src/lib/cloudDatabase.js` — every read/write helper (profiles, XP,
    achievements, assignments, AI-chat history, activity feed, leaderboard).
  - `src/lib/userDataService.js` — orchestration: load cloud → seed local,
    debounced save local → cloud, flush on logout.
- Full schema in §6.

### 3.3 The Groq AI proxy — the only "server code" you own

Three interchangeable implementations of the *same* proxy, selected by where the
app runs. Their whole job: receive a POST body, forward it to
`https://api.groq.com/openai/v1/chat/completions` with the secret key, return the
response.

| Runtime | File | Route |
|---|---|---|
| Local dev (`npm run dev`) | `scripts/groq-proxy-plugin.js` (Vite middleware) | `/api/groq/v1/chat/completions` |
| Firebase Hosting | `functions/index.js` → Cloud Function **`genaiProxy`** (Node 18, functions v2) | `/api/groq` — rewrites in `firebase.json` |
| Vercel | `api/groq.js` (serverless function) | `/api/groq` + `/api/groq/v1/chat/completions` — rewrites in `vercel.json` |

- The browser client is `src/lib/llm.js`: default model `groq/compound-mini`
  (override with `VITE_GROQ_MODEL`), 10 req/min client-side rate limit, 9 s
  timeout. In dev with a browser key it can call Groq directly; in production it
  always uses the proxy so the key stays server-side.
- Where the key lives at runtime:
  - Firebase Functions: `GROQ_API_KEY=gsk_...` in `functions/.env` (uploaded with
    the function; `functions/.env.example` shows the shape).
  - Vercel: Project Settings → Environment Variables → `GROQ_API_KEY`.
  - Dev: `.env.local` (read by the Vite middleware only).

### 3.4 The Base44 legacy layer (read before refactoring)

The project was exported from **Base44** (see `README.md`). The frontend still
speaks the Base44 SDK "shape", but every call is served **locally**:

- `src/lib/db.js` exports `db` — a `Proxy` over `globalThis.__B44_DB__` so the
  live DB is always used after login.
- `src/lib/localDb.js` builds that object: `auth.{isAuthenticated, me, updateMe}`,
  an `entities` Proxy (`db.entities.<Name>.list/filter/get/create/update/delete`)
  for `Quest, Raid, Guild, GuildMessage, User, FocusSession`, and
  `integrations.Core.{InvokeLLM, UploadFile}` (InvokeLLM → `src/lib/llm.js`, with
  a fallback to the offline generator `src/lib/aiGenerator.js`).
- `src/api/base44Client.js` just re-exports `db` for old imports.
- `entities/Quest|Raid|Guild|FocusSession` are **JSON schema definitions** from
  Base44 — treat them as field documentation, not live code.

### 3.5 What does NOT exist (don't go hunting)

- No Express/Node REST server of your own, no SQL database, no Docker, and no
  `firebase-admin` usage in code (it is only declared in `functions/package.json`).
- `functions/.env.example` lists Upstash Redis vars — **no code uses Redis**;
  leftover from an experiment (rotate/remove the token, see §11).
- `src/hooks/useCloudDatabase.js` (React-Query hooks over `cloudDatabase.js`)
  exists but nothing imports it today — pages call the `cloudDatabase.js`
  helpers directly (e.g. `getLeaderboard` in `src/pages/Leaderboard.jsx`).



---

## 4. How data flows (the full round trip)

1. **Sign in** — `AuthForm` → Firebase Auth → `onAuthStateChanged` fires in
   `AuthContext.jsx`.
2. **Load cloud data** — `loadUserGameData(uid)` (`userDataService.js`) reads
   `users/{uid}` (profile + gameData). If nothing exists yet, seed data is
   generated (`createInitialStoreForUser` in `src/lib/seedData.js`, curriculum
   from `src/lib/ethiopianCurriculum.js`).
3. **Init the local DB** — `initDbForUser(uid, profile, initialStore)`
   (`db.js` → `localDb.js`) writes the store into **localStorage** under
   `studified_db_{uid}` and sets `globalThis.__B44_DB__`.
   Load priority inside `loadStore()`: **localStorage → Firestore snapshot → seed**.
4. **Normal usage** — pages read/write through the proxy
   (`db.entities.Quest.filter(...)`, `db.auth.updateMe(...)`, …). Every mutation
   updates the in-memory store and persists to localStorage **immediately**.
5. **Debounced cloud sync** — `persistStore` → `scheduleSaveUserGameData`
   (600 ms debounce) → `saveUserProfile(uid, profile, gameData)` in
   `cloudDatabase.js` → `setDoc(users/{uid}, …, { merge: true })`, a
   `profileHistory` entry if tracked fields changed, and an `updateLeaderboard`
   call.
6. **Sign out** — `flushSaveUserGameData` writes the final snapshot to localStorage
   and Firestore before `signOut()`.

Failure behaviour: every Firestore call is wrapped in try/catch and degrades
silently to localStorage — the app keeps working offline; changes sync on the
next successful write while online.

> ⚠️ Consequence of the priority order: on a **new** device the cloud copy wins
> (no local snapshot exists). On a **known** device a stale localStorage snapshot
> **wins over Firestore** until it is cleared (DevTools → Application → Local
> Storage → delete `studified_db_*`) or a newer write syncs up.

---

## 5. Where the database physically lives

| Layer | Location | Name / key |
|---|---|---|
| Cloud — source of truth for profiles, XP, history, leaderboard | **Firebase project `authv2-3a0fc` → Cloud Firestore** | https://console.firebase.google.com/project/authv2-3a0fc/firestore |
| Cloud — login accounts | Same project → **Authentication** | https://console.firebase.google.com/project/authv2-3a0fc/authentication |
| Local — fast path / offline cache | Each user's **browser localStorage** | `studified_db_{uid}` (guests: `studified_local_db_guest`) |
| Secret — Groq key (server) | Functions `.env` / Vercel env vars | `GROQ_API_KEY` |
| Secret — Groq key (dev) | `.env.local` (git-ignored) | `GROQ_API_KEY`, `VITE_GROQ_API_KEY` |
| Project pinning for the CLI | `.firebaserc` → `default: authv2-3a0fc` | used by every `firebase` command |

The Firestore **region** is whatever was chosen when the database was created
(Firebase default is `us-central1`) — check it in Console → Firestore Database.

---

## 6. Firestore schema

```
users/{uid}                              ← one doc per account (uid = Auth uid)
├── profile: { email, full_name, caption, specialities[], avatar, interests[],
│              location, social_github, social_twitter, social_website,
│              total_xp, xp, quests_completed, focus_hours, streak_days,
│              grade, gamecoin, acoin, owned_items[], equipped{}, updatedAt }
├── gameData: { Quest[], Raid[], Guild[], GuildMessage[], FocusSession[], User[] }
├── createdAt, updatedAt
└── subcollections (one doc per event):
    ├── profileHistory/{autoId}   { changes[], previousValues, newValues, changedAt }
    ├── xpHistory/{autoId}        { amount, source, description, metadata, createdAt }
    ├── achievements/{achvId}     { achievementId, …, unlockedAt }
    ├── assignments/{autoId}      (completed assignment records)
    ├── aiChats/{autoId}          (AI tutoring sessions)
    └── activity/{autoId}         (activity feed entries)

leaderboard/{uid}    { uid, email, full_name, avatar, total_xp, quests_completed,
                       focus_hours, streak_days, level, updatedAt }

guilds/{guildId}     (+ messages/{msgId} subcollection)   ← declared in
                        firestore.rules; the app currently keeps guilds inside
                        users/{uid}.gameData instead
```

- Level formula (`cloudDatabase.js`): `level = floor(sqrt(totalXP / 100)) + 1`.
- The `gameData.*` arrays hold the same shapes documented in `entities/` (e.g.
  `Quest`: `title, description, type, difficulty E–S, xp_reward, status,
  category, duration_minutes, accepted_by`).
- Writing is done with `setDoc(..., { merge: true })` for whole-document saves and
  `increment()` for XP updates — there are no composite indexes
  (`firestore.indexes.json` is empty); all queries use single-field ordering.



---

## 7. Security rules (`firestore.rules`)

| Path | Read | Write |
|---|---|---|
| `users/{userId}` (+ all subcollections) | any signed-in user | only the owner (`request.auth.uid == userId`) |
| `leaderboard/{doc}` | any signed-in user | **nobody** (`allow write: if false`) |
| `guilds/{guildId}` | signed-in users | signed-in users (messages: update/delete only by `sender_uid`) |

Rules are **not** applied until you deploy them:

```bash
firebase deploy --only firestore:rules        # or run deploy-firebase-rules.bat
firebase deploy --only firestore:rules,firestore:indexes
```

### ⚠️ Known gotchas in the current rules

1. **Leaderboard writes are blocked.** `updateLeaderboard()` runs in the browser,
   but the rule says `allow write: if false` — and no Cloud Function writes the
   collection either. Net effect: `leaderboard` stays empty and the UI falls back
   to per-browser localStorage data (`fetchAllUsersFromFirebase` in
   `userDataService.js`), so the leaderboard only shows this device's users.
   Fix options: allow owner-writes (`allow write: if request.auth != null &&
   request.auth.uid == userId;`) — or better, write it from a Cloud Function with
   `firebase-admin` (server-trusted, no tampering).
2. **Any signed-in user can read every other user's document** (full profile +
   game data). Needed for the leaderboard, but be aware of the privacy trade-off.
3. **XP / coins are client-trusted.** Users can write their own `profile.*`
   values, so a modified client could grant itself XP. If that matters, move XP
   mutations into a Cloud Function that applies `increment()` with admin rights.

---

## 8. Environment variables

`.env.local` (dev, git-ignored — copy `.env.example` to start):

| Variable | Used by | Notes |
|---|---|---|
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID` | `src/lib/firebase.js` | Firebase **web** config — these identify the project (not secrets by themselves), but keep them out of repos you don't trust |
| `GROQ_API_KEY` | dev proxy (`scripts/groq-proxy-plugin.js`) | server-side only in dev — never bundled |
| `VITE_GROQ_API_KEY` | `src/lib/llm.js` | **browser** fallback key — anything with `VITE_` is compiled into the public JS bundle; do **not** set it in production builds |
| `VITE_GROQ_MODEL` | `src/lib/llm.js` | default `groq/compound-mini` |

Production equivalents:

| Platform | Where to set |
|---|---|
| Firebase Hosting | `GROQ_API_KEY` → `functions/.env` (deployed with the function) or `firebase functions:secrets:set GROQ_API_KEY`. `VITE_FIREBASE_*` go in `.env.production` / CI env for the `vite build` step |
| Vercel | Project → Settings → Environment Variables: `GROQ_API_KEY` + the `VITE_FIREBASE_*` set (Vite needs them at build time) |

---

## 9. Command reference

```bash
npm install                 # install deps
npm run dev                 # Vite dev server + Groq dev proxy
npm run build               # production build → dist/
npm run deploy              # deploy dist/ to Firebase Hosting
npm run setup:groq          # helper to write GROQ_API_KEY into .env.local

# Firebase CLI (npm i -g firebase-tools && firebase login first)
firebase deploy --only firestore:rules        # security rules
firebase deploy --only firestore:indexes      # composite indexes (currently none)
firebase deploy --only functions              # genaiProxy (requires Blaze plan)
firebase deploy --only hosting                # same as npm run deploy
firebase functions:log                        # tail genaiProxy logs
```

- Functions runtime: Node 18 (`functions/package.json` → `engines`).
- `firebase.json` hosting rewrites: `/api/groq` and `/api/groq/v1/chat/completions`
  → `genaiProxy`; everything else → `/index.html` (SPA fallback).



---

## 10. Changing / upgrading the database

The good news: **data access is funnelled through a handful of files**, so most
migrations only touch these:

| File | Role | When you'd touch it |
|---|---|---|
| `src/lib/firebase.js` | SDK init from `VITE_FIREBASE_*` | any backend swap (re-init with the new SDK) |
| `src/lib/cloudDatabase.js` | every Firestore read/write helper | swapping the DB engine |
| `src/lib/userDataService.js` | load/save orchestration + debounce | swapping the DB engine |
| `src/lib/localDb.js` | localStorage store + Base44-style entity API | usually keep; change `loadStore`/`persistStore` if the sync strategy changes |
| `src/lib/db.js` | `db` proxy (`globalThis.__B44_DB__`) | keep — all pages import from here |
| `src/lib/AuthContext.jsx` | sign-in flow + DB bootstrap | swapping auth |
| `firestore.rules` | security model | re-deploy after every change |
| `functions/index.js` / `api/groq.js` | Groq proxy | becomes one Express route on a VPS |

### 10.1 Swap to a different Firebase project

1. Create (or pick) the new project at console.firebase.google.com; enable
   **Authentication → Email/Password** and **Firestore Database**.
2. Copy the new web-app config into `.env.local` (all `VITE_FIREBASE_*` keys) and
   update `.env.example` so teammates/CI know the shape. Restart `npm run dev` —
   Vite only reads env files at startup.
3. Update `.firebaserc` (`"default": "<new-project-id>"`) so the CLI deploys to
   the right place.
4. Deploy the rules: `firebase deploy --only firestore:rules`.
5. Migrate old data with a one-off Node script using `firebase-admin`
   (service-account keys: Project Settings → Service accounts):

```js
// migrate.cjs — npm i firebase-admin
const admin = require('firebase-admin');
const src = admin.initializeApp({ credential: admin.credential.cert(require('./old-sa.json')) }, 'src');
const dst = admin.initializeApp({ credential: admin.credential.cert(require('./new-sa.json')) }, 'dst');
(async () => {
  const users = await src.firestore().collection('users').get();
  for (const d of users.docs) {
    await dst.firestore().collection('users').doc(d.id).set(d.data());
    for (const c of ['profileHistory','xpHistory','achievements','assignments','aiChats','activity']) {
      const sub = await d.ref.collection(c).get();
      for (const s of sub.docs) {
        await dst.firestore().collection('users').doc(d.id).collection(c).doc(s.id).set(s.data());
      }
    }
  }
  const lb = await src.firestore().collection('leaderboard').get();
  for (const d of lb.docs) await dst.firestore().collection('leaderboard').doc(d.id).set(d.data());
  console.log('migration done');
})();
```

   For large datasets use managed export/import (Console → Firestore →
   Import/Export; needs a GCS bucket + the Blaze plan).
6. Redeploy the frontend; verify a login creates the user doc in the new project.

### 10.2 Change region / add a second database

- A database's region is fixed at creation; to move, export/import into a new
  database or project (or re-run the migration script above).
- Firestore supports **multiple named databases** per project: create one in the
  Console, then in `src/lib/firebase.js` use
  `getFirestore(app, 'your-db-name')` instead of `getFirestore(app)`.
- Latency: pick the region closest to your users — for Ethiopia, `europe-west*`
  is typically the best nearby option.

### 10.3 Upgrade: make the cloud the source of truth

Today, on a device with an existing localStorage snapshot, **local wins over
cloud** (§4). To make Firestore authoritative:

- In `src/lib/localDb.js` `loadStore()`, invert the priority (Firestore first,
  localStorage as cache), or compare `updatedAt` timestamps and keep the newest.
- Consider Firestore's built-in **offline persistence**
  (`initializeFirestore(app, { localCache: persistentLocalCache() })`) so you
  keep offline support without the custom localStorage layer.
- Move XP/coin mutations into Cloud Functions using `firebase-admin` so clients
  cannot self-award (§7 gotcha 3).



### 10.4 Moving to a VPS

Pick by appetite:

**Option A — host only the static app on the VPS (keep the Firebase backend). Easiest.**
- `npm run build` → upload `dist/` to e.g. `/var/www/studified`, serve with nginx
  or Caddy, TLS via certbot. Nothing about auth/database changes — the app still
  talks to Firebase from the browser and the Groq proxy still runs on
  Firebase/Vercel. This is pure hosting, not a database migration.

**Option B — full backend on the VPS (Node + PostgreSQL/MongoDB). Most control, most work.**
You must reimplement what Firebase gave you. Because all calls go through the
`db.*` proxy, the rewrite surface is small and enumerable:

| Current call (client) | New REST endpoint (Express) |
|---|---|
| Firebase Auth sign-in/up | `POST /api/auth/register`, `POST /api/auth/login` → JWT (`bcrypt` + `jsonwebtoken`) |
| `db.auth.me()` | `GET /api/auth/me` (JWT middleware) |
| `db.entities.Quest/Raid/Guild/GuildMessage/FocusSession/User.filter(…)` etc. | `GET/POST/PATCH/DELETE /api/quests`, `/api/raids`, `/api/guilds`, `/api/focus-sessions` |
| `saveUserProfile` / `syncUserToFirestore` | `PUT /api/me/profile` |
| `addXPTransaction`, `unlockAchievement` | `POST /api/me/xp`, `POST /api/me/achievements` |
| `getLeaderboard` | `GET /api/leaderboard` |
| `saveAIChat`, `getAIChatHistory`, `addActivity`, `getActivityFeed` | `POST/GET /api/me/ai-chats`, `/api/me/activity` |
| Groq proxy (`functions/index.js`) | `POST /api/ai/chat` — port the same ~100 lines to Express |

Runtime layout: Node 20 + Express + PostgreSQL/MongoDB on the box, run with
`pm2` or Docker Compose, nginx reverse-proxying `:443 → :3001`, certbot for TLS.
Env: the same `GROQ_API_KEY`, now in the server's `.env`.
Data migration: export Firestore to JSON (script from §10.1) → transform docs
into tables/rows (users, quests, xp_events, …) → import.

**Option C — self-hosted BaaS on the VPS (middle ground).**
- **PocketBase** (single Go binary): auth + SQLite + collection rules + realtime —
  architecturally the closest match to what you have today (auth + rules +
  documents). Rewrite `src/lib/firebase.js` + `src/lib/cloudDatabase.js` against
  PocketBase's JS SDK; `localDb.js` and all pages stay untouched.
- **Supabase (self-hosted via Docker)**: Postgres + Auth + row-level security —
  same rewrite targets, SQL instead of documents.

In both B and C the browser keeps calling the same `db.*` proxy — that seam is
what makes the migration tractable. Keep the localStorage layer for offline
support or drop it once the server is authoritative.

---

## 11. Security & cleanup notes

1. **A real Groq key sits in `.env.local`** under both `GROQ_API_KEY` and
   `VITE_GROQ_API_KEY`. Anything `VITE_`-prefixed is compiled into the public JS
   bundle on build — remove the `VITE_` line before any production build and
   rotate the key at console.groq.com (it has been shared in plaintext).
2. **`functions/.env.example` contains what looks like a real Upstash Redis
   token.** No code uses Redis — replace the values with placeholders and rotate
   the token at console.upstash.com (example files are committed to git).
3. `.env*` files are git-ignored (see `.gitignore`) — good — but audit git
   history if the repo was ever pushed while secrets were tracked.
4. Rules gotchas from §7: leaderboard unwritable by clients (feature currently
   degraded), all profiles readable by any signed-in user, XP client-trusted.
5. `firebase.json` rewrites `/api/**` to `/index.html` *after* the Groq routes —
   any future API route must be added above that catch-all.

---

## 12. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| "Firebase is not configured" / missing env vars at load | `.env.local` missing or missing `VITE_FIREBASE_API_KEY/AUTH_DOMAIN/PROJECT_ID/APP_ID`; restart `npm run dev` after editing |
| "permission-denied" in the console | Firestore rules not deployed (`firebase deploy --only firestore:rules`), or writing to another user's document |
| Leaderboard shows only your own account | Expected under current rules (§7 gotcha 1) — no client can write `leaderboard`; change the rule or add a Cloud Function writer |
| Stale data after switching accounts/devices in the same browser | localStorage wins over Firestore on known devices (§4) — clear site data or let one write sync |
| AI replies "Groq is not configured" (HTTP 503) | `GROQ_API_KEY` missing in the runtime: `functions/.env` + redeploy functions, or Vercel env vars + redeploy; in dev add it to `.env.local` |
| AI rate-limit errors | Client limit is 10 req / 60 s in `src/lib/llm.js` — wait, or raise the constant |
| Function deploy fails on the free (Spark) plan | Cloud Functions require the **Blaze** plan; hosting/rules are free |
| Firebase SDK errors at init | `VITE_FIREBASE_*` values must match the Firebase console exactly (stray quotes/whitespace — `cleanEnv()` strips simple quotes only) |

---

*Generated from a full audit of the repo (branch `master`, commit `7da2c54`).
Concrete values — project id `authv2-3a0fc`, model `groq/compound-mini`,
localStorage keys — reflect `.env.local` / `.firebaserc` / source at the time of
writing.*

