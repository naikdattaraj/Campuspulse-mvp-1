# AI CampusPulse – Web (Members 1 and 4)

Next.js 14 (App Router, TypeScript). In this final build every screen talks to the
real NestJS API (see `../campuspulse-api`) — set `NEXT_PUBLIC_USE_MOCK=false`.

## Run
```bash
npm install
cp .env.example .env.local     # already points NEXT_PUBLIC_API_URL at localhost:4000
npm run dev                    # http://localhost:3000
```
Start `../campuspulse-api` first (see its README) so there's something to talk to.

Want to browse the UI with no backend at all? Set `NEXT_PUBLIC_USE_MOCK=true` in
`.env.local` — every screen falls back to realistic in-memory mock data.

Demo logins
- Student: john@college.edu / Password123
- Admin: admin@college.edu / Admin1234

## Screens built
| Route | Screen | Story |
|---|---|---|
| /login | Log in / Sign up tabs, role selector, forgot password, validation | US-01 |
| /dashboard | Student dashboard: engagement ring, poll, assessment, career score, event widgets | US-17 |
| /admin | Admin panel: live stats, quick actions, analytics bars | US-18 |
| /polls | Student voting with live results; admin poll creation | US-04, US-05 |
| /events, /events/[id] | Event feed with date badges; details and registration | US-11 |
| /assessments | Quiz landing, timed test with flag/confirm-submit, results breakdown | US-06 |
| /career, /career/quiz | Career readiness quiz, score gauge, category breakdown, improvement tips | US-08, US-09 |

See `TESTING.md` for the full pass/fail checklist run against the integrated build.

## Architecture
- `src/lib/types.ts` — shared TypeScript types for every screen.
- `src/lib/http.ts` — one `request()` helper: calls the real API, or answers from mock
  data when `NEXT_PUBLIC_USE_MOCK=true`.
- `src/lib/mockDb.ts` — in-memory stand-in backend, used only in mock mode.
- `src/lib/scoring.ts` — the same rule-based scoring used by the API
  (`campuspulse-api/src/common/scoring.ts`); keep both copies identical.
- `src/lib/content.json` — the assessment and career quiz question bank, shared with
  the API's seed data.
- `src/lib/api.ts` — every network call the UI makes; pages never call `fetch` directly.
- `src/app/(app)/layout.tsx` — navbar, sidebar/mobile tab bar and the route guard
  (signed-out → `/login`, student → blocked from `/admin`).
