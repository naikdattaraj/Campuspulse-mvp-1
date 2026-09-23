# Testing & security pass — Iteration 2 (Member 4)

Manual pass/fail checklist run against the integrated build (`NEXT_PUBLIC_USE_MOCK=false`,
API seeded with `npm run seed`). Re-run this list after any change to auth, scoring, or
role guards before a demo.

## Student flow
| # | Case | Expected | Status |
|---|---|---|---|
| 1 | Log in as `john@college.edu` / `Password123`, role Student | Lands on `/dashboard` | Pass |
| 2 | Log in with correct email, wrong password | "Email or password is incorrect." | Pass |
| 3 | Log in with a student email but role set to Admin | "This account is registered as student…" | Pass |
| 4 | Sign up with an email already in use | "An account with this email already exists." | Pass |
| 5 | Sign up with a 6-character password, no digit | "Use at least 8 characters, including a number." | Pass |
| 6 | Vote on an open poll, then reload | Vote persists, results shown, can't vote again | Pass |
| 7 | Try voting on the same poll twice (e.g. two tabs) | Second vote rejected with 409 → "You have already voted" | Pass |
| 8 | Register for an event, then register again | Second call is idempotent, button just shows "Registered" | Pass |
| 9 | Start the academic assessment, leave questions unanswered, submit | Confirm dialog names the unanswered count before submitting | Pass |
| 10 | Let the assessment timer hit 0:00 | Auto-submits with current answers, no crash | Pass |
| 11 | Take the career quiz, view results | Score, category breakdown and improvement tips match `scoring.ts` rules | Pass |
| 12 | Visit `/admin` directly by URL as a student | Redirected to `/dashboard`, no admin data ever requested | Pass |
| 13 | Log out, then press browser Back | Returns to `/login`, no dashboard flash of stale data | Pass |

## Admin flow
| # | Case | Expected | Status |
|---|---|---|---|
| 14 | Log in as `admin@college.edu` / `Admin1234` | Lands on `/admin` with live totals | Pass |
| 15 | Create a poll with 1 option | "Add at least 2 options." | Pass |
| 16 | Create a poll with an expiration date in the past | "Choose an expiration date that is today or later." | Pass |
| 17 | Create a poll with two identical option labels | "Each option must be different." | Pass |
| 18 | Create an event with a past date | "Choose an event date that is today or later." | Pass |
| 19 | Create an event, switch to student view | New event appears in the student feed immediately | Pass |
| 20 | Visit `/assessments` or `/career` as admin | Backend returns 403; UI never renders student-only data | Pass |

## Cross-cutting / security
| # | Case | Expected | Status |
|---|---|---|---|
| 21 | Call any protected endpoint with no `Authorization` header | 401 "Log in to continue." | Pass |
| 22 | Call an admin-only endpoint (`POST /polls`) with a student token | 403 "Only admins can do this." | Pass |
| 23 | Tamper with the JWT payload | Signature check fails, 401 | Pass |
| 24 | SQL injection attempt in the login email field (`' OR '1'='1`) | No match, generic "incorrect" error — all queries are parameterised | Pass |
| 25 | Submit an assessment answer object with an unknown question id | Extra key ignored by the scorer, no crash | Pass |
| 26 | Network/API down while the frontend calls an endpoint | Screen shows "Try again" with a retry button, no unhandled crash | Pass |
| 27 | Refresh mid-quiz | Assessment/career progress is in-memory only and resets — acceptable for Iteration 2, noted as a known limit | Pass (expected) |

## Known limits carried into the demo
- Admin self-signup is open (mirrors the login screen design) — would move to invite-only before real deployment.
- No password-reset email; "Forgot password" shows a mock confirmation.
- Assessment/career progress isn't saved mid-attempt — closing the tab loses unsaved answers.

These are documented, intentional Iteration 1/2 scope cuts, not bugs.
