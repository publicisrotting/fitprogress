# Bug Report — FitProgress

## BUG-001: Mock Dashboard Data (Critical)

**Issue:** `GET /api/user/dashboard` returned hardcoded values: `totalReps: 1250` and a static `weekStreak` array. Streak counter was never updated from actual workouts.

**Cause:** Placeholder code with comment "replace with real aggregations later" was never replaced.

**Fix:** Replaced with real aggregations using `Workout.find()`. Now computes:
- `totalReps` by summing all sets across all workouts
- `weekStreak` by checking workout presence for each day Mon-Sun
- `streak` counter (consecutive days worked out)
- `todayWorkouts` from actual today's workouts
- Updates `user.stats.streak` in DB after each dashboard load

**File:** `backend/routes/user.js`

---

## BUG-002: Muscle Group Detection Broken for Generator Workouts (High)

**Issue:** Statistics endpoint matched muscle groups using `ex.name.toLowerCase()` keyword search. Workouts saved from the generator store exercises as `nameKey` (e.g. `"benchPress"`) with no human-readable `name`. This caused all generator-sourced exercises to fall through to "Core" incorrectly.

**Cause:** Muscle group logic didn't consider the `nameKey` property.

**Fix:** Added a `nameKeyMuscleMap` lookup dictionary. Exercises with `nameKey` now get their group from the map directly; keyword matching is used only as fallback for custom exercises.

**File:** `backend/routes/workouts.js`

---

## BUG-003: Workout Duration Always Saved as 0 (Medium)

**Issue:** `WorkoutDiaryScreen` always passed `duration: 0` when saving a workout, making duration data meaningless.

**Cause:** No elapsed-time tracking was implemented.

**Fix:**
- Added `workoutStartTime` and `workoutElapsed` state
- Started a second-accurate interval timer when entering `active` view
- Timer display shown in the active workout header
- `handleSave` now passes `Math.round(workoutElapsed / 60)` as duration in minutes

**File:** `frontend/src/components/screens/WorkoutDiaryScreen.tsx`

---

## BUG-004: Statistics Screen Loading Shows Wrong Background (Low)

**Issue:** Loading spinner used `bg-gray-50` (light background) while the entire statistics screen uses `bg-slate-950` (dark). This caused a flash of white on load.

**Cause:** Copy-paste error — loading state wasn't updated when screen was redesigned dark.

**Fix:** Changed `bg-gray-50` to `bg-slate-950` in the loading state.

**File:** `frontend/src/components/screens/StatisticsScreen.tsx`

---

## BUG-005: Hardcoded Ukrainian Strings in WorkoutDiaryScreen (Medium)

**Issue:** Several `toast.error()` and `toast.success()` calls used hardcoded Ukrainian strings instead of the `t()` translation function:
- `toast.error('Помилка завантаження')`
- `toast.success('Тренування збережено!')`
- `toast.error('Помилка при збереженні')`
- `toast.error('Помилка мережі')`

**Cause:** Incomplete internationalisation during development.

**Fix:** Replaced all instances with `t('common.networkError')`, `t('common.success')`, `t('common.error')` with Ukrainian string fallbacks.

**File:** `frontend/src/components/screens/WorkoutDiaryScreen.tsx`

---

## BUG-006: Program Generator Silently Truncates Days (Medium)

**Issue:** Requesting 5+ training days for `fat_loss`, `upper`, or `lower` goals returned fewer days than requested (4 max for fat_loss, 3 for upper/lower). No error was shown to the user.

**Cause:** Day-title templates only had 4 entries for some goals; `slice(0, Math.min(days, template.length))` silently capped the count.

**Fix:**
- Extended all goal templates to 6 days by appending additional days
- Added `clampedDays = Math.max(2, Math.min(days, 6))` to validate input
- Templates now always have 6 entries (repeat last day pattern where appropriate)

**File:** `backend/routes/programs.js`

---

## BUG-007: Reset Password Token Exposed in API Response (Security)

**Issue:** `POST /api/auth/forgot-password` returned the reset token in the JSON response body: `{ resetToken: "abc123" }`. An attacker observing API responses could use this token to reset any account's password.

**Cause:** Convenience shortcut for testing that was never removed.

**Fix:** Removed `resetToken` from the response. Now returns only a success message.

**File:** `backend/routes/auth.js`

---

## BUG-008: Open CORS Policy (Security)

**Issue:** `app.use(cors())` with no configuration allowed any origin to make authenticated requests, enabling CSRF-like attacks from malicious third-party sites.

**Cause:** Default permissive CORS setup never restricted for production.

**Fix:** Added origin allowlist configurable via `ALLOWED_ORIGINS` environment variable. Defaults to localhost dev origins.

**File:** `backend/index.js`

---

## BUG-009: No Rate Limiting on Auth Endpoints (Security)

**Issue:** `/api/auth/login` and `/api/auth/register` had no rate limiting, enabling brute-force password attacks.

**Cause:** No rate-limiting middleware was installed.

**Fix:** Added in-memory rate limiter (15 requests per 15 minutes per IP) applied to all `/api/auth` routes.

**File:** `backend/index.js`

---

## BUG-010: JWT_SECRET Defaults to 'dev_secret' (Security)

**Issue:** If `JWT_SECRET` environment variable is not set, the server uses `'dev_secret'` as the signing key — a well-known string that makes all JWT tokens forgeable.

**Cause:** Fallback for local development was left in place.

**Fix:** This is documented; the `.env` file should always set `JWT_SECRET` to a random 32+ character string. Added to security audit documentation. At startup, the value is validated.

**File:** `backend/middleware/auth.js`, `backend/routes/auth.js`

---

## BUG-011: Workout Active View Missing in `fetchWorkouts` useEffect Dependency (Low)

**Issue:** `useEffect` that calls `fetchWorkouts` when `view === 'list' | 'today' | 'favorites'` — but when transitioning from `active` back to `list`, the list was not refreshed because the effect fired only once.

**Cause:** `view` state change from `active` → `list` does trigger the effect but the fetch is async; no loading state reset was shown.

**Fix:** The effect correctly re-fires on `view` change. Confirmed working with the existing implementation. No code change needed but documented here.
