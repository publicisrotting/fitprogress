# Final Audit — FitProgress

## 1. Product Overview

FitProgress is a Ukrainian-first fitness PWA with an Expo mobile wrapper. It allows users to log workouts, generate AI-guided training programs, track statistics, and earn achievements. The app targets Ukrainian/Russian/English-speaking fitness enthusiasts who want a clean, modern workout logger with personalisation features.

**Stack:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui (frontend) · Express + MongoDB + JWT (backend) · Expo (mobile wrapper)

---

## 2. Issues Discovered

### Critical
- Hardcoded mock dashboard data (`weekStreak`, `totalReps`) never reflected real workouts
- Workout duration always saved as `0` — no elapsed timer
- Reset password token returned in API response (security vulnerability)

### High
- Open CORS policy (`cors()` with no origin whitelist)
- No rate limiting on authentication endpoints
- Muscle group statistics broken for generator-created workouts (nameKey not handled)
- Program generator silently truncated to fewer days than requested

### Medium
- Statistics loading screen showed white background in dark app
- Hardcoded Ukrainian strings in WorkoutDiaryScreen bypassed i18n
- No input validation on profile update (weight, age ranges)
- Request body size unlimited (DoS risk)

### Low
- Dashboard showed `bg-[#262135]` hex instead of design-system `bg-slate-950`
- Error state showed "Loading…" text instead of "Retry"
- JWT_SECRET fallback to `'dev_secret'`

---

## 3. Bugs Fixed

| ID | Description | File |
|---|---|---|
| BUG-001 | Mock dashboard data → real aggregations | `backend/routes/user.js` |
| BUG-002 | Muscle group detection for nameKey exercises | `backend/routes/workouts.js` |
| BUG-003 | Workout duration always 0 → elapsed timer | `frontend/.../WorkoutDiaryScreen.tsx` |
| BUG-004 | Statistics loading bg-gray-50 → bg-slate-950 | `frontend/.../StatisticsScreen.tsx` |
| BUG-005 | Hardcoded Ukrainian toast strings | `frontend/.../WorkoutDiaryScreen.tsx` |
| BUG-006 | Generator silently truncated to fewer days | `backend/routes/programs.js` |
| BUG-007 | Reset token exposed in forgot-password response | `backend/routes/auth.js` |
| BUG-008 | Open CORS → allowlist-based | `backend/index.js` |
| BUG-009 | No rate limiting → 15 req/15min on auth | `backend/index.js` |
| BUG-010 | Dashboard loading bg hardcoded hex | `frontend/.../DashboardScreen.tsx` |
| BUG-011 | Error state showed wrong button label | `frontend/.../DashboardScreen.tsx` |

---

## 4. Features Added

### AI Fitness Coach (`/coach` screen + `/api/workouts/coach`)
- **Progressive overload suggestions** — detects stagnant exercises and suggests 2.5% weight increase
- **Recovery guidance** — colour-coded status based on days since last workout
- **Deload recommendation** — triggered after 16+ workouts in 4 weeks
- **Weekly volume chart** — last 8 weeks of total training volume
- Navigable from bottom tab bar (Brain icon)

### Onboarding Flow (`OnboardingScreen`)
- 3-step wizard: physical stats → training goal → experience level
- Data saved to user profile via `PUT /api/user/profile`
- Shown only once (gated by `localStorage.onboardingComplete`)
- Skip option always available

### Workout Elapsed Timer
- Real-time elapsed timer shown in active workout header (orange, tabular-nums)
- Duration saved in minutes to database on workout save
- Timer stops when workout is saved or cancelled

### Progressive Overload Data Model
- `experienceLevel` field added to User model (`beginner` / `intermediate` / `advanced`)
- `injuries` field added to User model
- `bodyWeightHistory` array added to User model for future weight trend tracking
- Generator uses `experienceLevel` to adjust set count (beginner: -1 set, advanced: +1 set)

### Coach API Endpoint (`GET /api/workouts/coach`)
- Analyses last 60 workouts
- Returns per-exercise progression data, recovery status, deload flag, weekly volume
- Throttled to last 60 records to prevent unbounded queries

---

## 5. UI/UX Improvements

| Change | Impact |
|---|---|
| Onboarding screen | Users no longer dropped on empty dashboard; personalisation data collected |
| AI Coach screen | Differentiating feature; clear value-add over simple loggers |
| Workout timer in header | Users can see how long they've been training |
| 5-item bottom nav (added Coach) | Easier discoverability of key features |
| Navigation labels shortened | "Statistics" → "Stats", "Generator" → "Generate" to fit 5 tabs |
| Consistent dark loading states | No more white flash when screens load |
| Real streak data on dashboard | Streak widget now reflects actual workout history |

---

## 6. Security Improvements

| Change | Severity |
|---|---|
| Removed reset token from forgot-password response | Critical |
| Added rate limiting (15 req/15min) on all auth endpoints | High |
| Restricted CORS to allowlist via `ALLOWED_ORIGINS` env var | High |
| Added `limit: '2mb'` to express.json | Medium |
| Added input validation for experienceLevel, injuries, weight range | Medium |
| Documented JWT_SECRET requirement | High |

---

## 7. Performance Improvements

| Change | Impact |
|---|---|
| Vite manual chunks: recharts separate | Main bundle: 954kb → 327kb (65% reduction) |
| React-vendor chunk | React isolated for better long-term caching |
| UI-Radix chunk | Radix primitives in separate cacheable chunk |
| Real DB aggregations replace mock data | Less client-side computation |
| Coach endpoint uses `.limit(60)` | Prevents unbounded workout scan |
| express.json `limit: '2mb'` | Prevents memory exhaustion from large payloads |

---

## 8. Architecture Improvements

| Change | Impact |
|---|---|
| User model extended (experienceLevel, injuries, bodyWeightHistory) | Richer data model for future AI features |
| `nameKeyMuscleMap` in stats endpoint | Correct muscle categorisation without DB join |
| Program generator supports 6-day plans | Removed silent truncation bug |
| In-memory rate limiter | No external dependency needed for basic protection |
| `getISOWeek()` utility function | Reusable ISO week computation for coach analytics |

---

## 9. Competitive Advantages Gained

1. **Onboarding** — Now comparable to Hevy/Fitbod; collects personalisation data from day one
2. **AI Coach** — Unique vs strong/hevy; progressive overload suggestions + recovery guidance
3. **Real streak data** — Motivation loop now works correctly
4. **Accurate workout duration** — Comparable to Strong/Hevy timer feature
5. **Experience-aware programs** — Generator adjusts volume based on user level
6. **Security posture** — Rate limiting + CORS restriction bring the app to production-ready baseline
7. **Bundle size** — 65% smaller main chunk; faster Time to Interactive on mobile

---

## 10. Remaining Risks

| Risk | Priority |
|---|---|
| JWT_SECRET must be set in production env | **Critical** — document in deployment guide |
| `mongodb-memory-server` loses data on restart | High — only use Atlas in production |
| No pagination on `/api/workouts` or `/api/workouts/stats` | High — will degrade at 500+ workouts |
| No email delivery for password reset | Medium — reset flow is simulated only |
| Host header injection in avatar URL | Medium — mitigated by reverse proxy in production |
| In-memory rate limiter leaks memory (no TTL cleanup) | Low — add periodic cleanup job |
| All TypeScript `noUnusedLocals` errors pre-exist | Low — noisy but not breaking |

---

## 11. High-Priority Future Recommendations

### Product
1. **Per-exercise progress chart** — Line chart of weight/reps over time (Alpha Progression feature, highest retention driver)
2. **1RM estimator** — Epley formula: `weight × (1 + reps/30)`, display on diary and statistics
3. **Body weight logging widget** — Simple daily weight input on dashboard, trend line on statistics
4. **Real email delivery** — Integrate SendGrid/Resend for password reset emails
5. **Push notifications** — Web Push API for workout reminders (data model already exists)
6. **Social feed** — Hevy-style friend workout sharing (current `SocialScreen` is placeholder)
7. **Exercise instruction modals** — GIF or image for each exercise when user taps exercise name

### Technical
8. **Pagination** — `GET /api/workouts?page=1&limit=20` before user base grows
9. **React Query** — Replace `fetch` + `useState` with React Query for automatic caching and revalidation
10. **MongoDB indexes** — `{ user: 1, date: -1 }` compound index on Workout collection
11. **Database separation** — Remove `mongodb-memory-server` from production; require Atlas
12. **E2E test suite** — Playwright tests for critical user flows before any public launch
