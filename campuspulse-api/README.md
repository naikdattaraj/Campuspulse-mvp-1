# AI CampusPulse – API (Members 2 and 3)

NestJS 10 + PostgreSQL. Raw SQL through `pg` (`db/schema.sql` is the single source of truth for the database).

## Run locally
```bash
docker compose up -d          # PostgreSQL 16 on :5432 (or use your own Postgres)
cp .env.example .env          # set JWT_SECRET to a long random string
npm install
npm run seed                  # creates tables, loads questions, adds demo students, polls, events
npm run start:dev             # http://localhost:4000
npm test                      # scoring unit tests
```
`npm run seed:reset` wipes the database first (development only).

Demo logins: `john@college.edu` / `Password123` (student), `admin@college.edu` / `Admin1234` (admin).
Try every endpoint from `api.http`.

## Endpoints
| Method and path | Who | Story |
|---|---|---|
| POST /auth/register, /auth/login, GET /auth/me | anyone / signed in | US-01 |
| GET /dashboard/student, GET /dashboard/admin | student / admin | US-17, US-18 |
| GET /polls, POST /polls/:id/vote, POST /polls | all / student / admin | US-04, US-05 |
| GET /events, GET /events/:id, POST /events/:id/register, POST /events | all / all / student / admin | US-11 |
| GET /assessments, GET /assessments/:id/start, POST /assessments/:id/submit, GET /assessments/:id/result | student | US-06 |
| GET /career/quiz, POST /career/submit, GET /career/result | student | US-08, US-09 |

All routes except `/auth/*` need `Authorization: Bearer <token>`. Errors return `{ "message": "..." }` in plain language, which the UI shows directly.

## Scoring rules (src/common/scoring.ts)
- Career: each answer carries 0, 50 or 100 points. Category score is the average of its questions. Overall = Technical 40% + Soft skills 30% + Aptitude 30%. Labels: 80+ Career ready, 60-79 Needs work, below 60 Getting started. A category under 50 is flagged as a skill gap. Improvement areas are the skills of the questions not answered with full points, weakest first.
- Assessment: percent correct, pass mark stored per assessment (60%). Categories under 70% produce an improvement tip. Time taken is capped at the time limit.
- Engagement (dashboard): average of four goals: 2 poll votes, 1 assessment, 1 career quiz, 1 event registration.

`scoring.ts` is identical in the web project (`src/lib/scoring.ts`). If you change a rule, change both.

## Known limits (Iteration 2 candidates)
- Admin self-signup matches the login design but should become invite-only before real use.
- The server clamps time taken to the limit but does not yet reject late submissions.
- No password reset email yet; the UI shows a mock confirmation.
