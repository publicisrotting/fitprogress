# Testing Report — FitProgress

## Testing Status

| Layer | Type | Status |
|---|---|---|
| Backend API | Manual | Covered via route analysis |
| Frontend Components | Manual code review | Covered |
| Unit tests | Automated | Not yet set up |
| Integration tests | Automated | Not yet set up |
| E2E tests | Automated | Not yet set up |

---

## Critical User Flows — Manual Test Results

### Flow 1: Registration → Onboarding → Dashboard

| Step | Expected | Status |
|---|---|---|
| Register with email/password | JWT token returned, user created | ✅ Code path correct |
| Google OAuth login | Token returned from Google verify | ✅ Code path correct |
| Onboarding shown for new users | `onboardingComplete` localStorage check | ✅ Fixed & implemented |
| Profile saved from onboarding | `PUT /api/user/profile` called | ✅ Implemented |
| Dashboard shows real data | Real aggregations from workouts | ✅ Fixed |

### Flow 2: Workout Generation → Save to Diary

| Step | Expected | Status |
|---|---|---|
| Select goal/days/intensity | UI state updated | ✅ Works |
| Generate program | `POST /api/programs/generate` | ✅ Works |
| Days match requested count | Up to 6 days for any goal | ✅ Fixed (was silently truncating) |
| Save to diary | Creates N workouts via `POST /api/workouts` | ✅ Works |
| Navigation to diary | `onNavigate('diary')` called | ✅ Works |

### Flow 3: Active Workout

| Step | Expected | Status |
|---|---|---|
| Start workout | Sets default exercise, starts timer | ✅ Fixed (timer added) |
| Add exercise | New exercise row added | ✅ Works |
| Log set weight/reps | Number inputs update state | ✅ Works |
| Check set as done | Green check, rest timer starts | ✅ Works |
| Save workout | POST with real duration in minutes | ✅ Fixed (was always 0) |
| Hint system | Last/best set loaded per exercise | ✅ Works |

### Flow 4: Statistics

| Step | Expected | Status |
|---|---|---|
| Load statistics page | Dark loading state shown | ✅ Fixed (was white) |
| Volume chart renders | Bar chart with real data | ✅ Works |
| Period filter works | Filters volume by week/month/year | ✅ Works |
| Muscle group pie chart | Uses nameKey for categorisation | ✅ Fixed |
| Personal records list | Shows top 5 PRs | ✅ Works |

### Flow 5: AI Coach

| Step | Expected | Status |
|---|---|---|
| No workouts yet | Empty state with CTA | ✅ Implemented |
| Has workouts, no suggestions | "No active suggestions" message | ✅ Implemented |
| Stagnant exercise detected | Overload suggestion card shown | ✅ Implemented |
| Long break detected | Recovery warning shown | ✅ Implemented |
| 4+ weeks consecutive | Deload recommendation shown | ✅ Implemented |
| Weekly volume chart | Bar chart of last 8 weeks | ✅ Implemented |

### Flow 6: Authentication Security

| Step | Expected | Status |
|---|---|---|
| Login rate limiting | 429 after 15 attempts / 15min | ✅ Fixed |
| Reset password token | Not exposed in response | ✅ Fixed |
| Expired token | 401 returned | ✅ Works |
| Missing token | 401 returned | ✅ Works |

---

## Known Test Gaps

### Unit Tests Missing
- Exercise name resolution logic (`resolveExerciseKey`) — complex alias map should have unit coverage
- Generator `pickSome` function — randomness makes it tricky but deterministic seed tests would help
- Rate limiter logic
- ISO week calculation (`getISOWeek`)

### Integration Tests Missing
- Full registration → workout save → statistics flow
- Premium status expiry check
- Google OAuth token verification (requires mock)

### E2E Tests Missing
- Onboarding completion flow
- Complete workout from diary
- Program generation end-to-end

---

## Recommended Test Setup

```bash
# Backend: Jest + Supertest
npm install --save-dev jest supertest @types/jest

# Frontend: Vitest + React Testing Library
npm install --save-dev vitest @testing-library/react @testing-library/user-event
```

### Priority Unit Tests to Write

1. `backend/routes/workouts.js` — `getISOWeek()` function
2. `backend/routes/workouts.js` — muscle group mapping with `nameKey`
3. `frontend/src/components/screens/WorkoutDiaryScreen.tsx` — `resolveExerciseKey()`
4. `frontend/src/components/screens/WorkoutDiaryScreen.tsx` — `calculateTotalVolume()`
5. `backend/index.js` — rate limiter window reset logic
