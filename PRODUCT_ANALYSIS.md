# Product Analysis — FitProgress

## What the Application Does

FitProgress is a Ukrainian-first fitness web app (PWA) with an Expo mobile wrapper. It allows users to:
- Log and track workouts (sets, reps, weight)
- Generate personalised training programs by goal/days/intensity
- View statistics (volume charts, personal records, muscle-group distribution)
- Track achievements and streaks (gamification)
- Browse an exercise library
- Manage a profile with fitness metrics

## Target Audience

Ukrainian/Russian/English-speaking fitness enthusiasts aged 18–45 who want a simple, clean workout logger with program generation.

## Architecture

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui |
| Mobile | Expo (React Native shell wrapping the PWA) |
| Backend | Node.js + Express |
| Database | MongoDB (cloud Atlas + in-memory fallback via `mongodb-memory-server`) |
| Auth | JWT (7-day expiry) + Google OAuth |
| State | React Context (AuthContext, SettingsContext) |
| Navigation | Manual `currentScreen` state (no router) |
| Charts | Recharts |
| Notifications | Custom Notification model |

## Screens

1. **Login** — email/password + Google OAuth
2. **Dashboard** — overview, quick stats, streak, notifications
3. **Workout Diary** — list/active/view/today/favorites tabs; inline editing
4. **Generator** — goal + days + intensity → generates program → save to diary
5. **Exercise Library** — browse exercises by muscle group
6. **Statistics** — volume chart, muscle-group pie chart, PRs, export button
7. **Gamification** — achievements, challenges
8. **Social** — placeholder
9. **Profile** — bio, avatar, stats, theme/language/units
10. **Settings** — notifications, premium, security, support

## Current Strengths

- Clean, modern dark UI with consistent design language
- Multi-language support (uk/ru/en)
- Offline fallback via in-memory MongoDB
- Google OAuth integration
- Inline workout editing with hint system (last/best set)
- Rest timer with haptic feedback
- PWA + Expo mobile wrapper

## Current Weaknesses

### Critical Bugs
1. **Mock dashboard data** — `weekStreak` and `totalReps` are hardcoded constants in `user.js:82-87`
2. **Duplicate API call** — dashboard fetches `/api/user/profile` AND `/api/user/dashboard` which both return user data
3. **Hardcoded workout duration = 0** — `WorkoutDiaryScreen` always saves `duration: 0`
4. **Mixed hardcoded strings** — Ukrainian strings used directly instead of `t()` in several places
5. **Muscle group detection broken for nameKey exercises** — stats endpoint matches on `ex.name.toLowerCase()` but exercises saved from generator have `nameKey` not a localised name
6. **Program generator truncates days silently** — requesting 5+ days for `fat_loss` goal returns only 4 days (template has 4)
7. **Statistics loading screen** uses `bg-gray-50` (light) while rest of screen is dark

### Security Issues
1. `JWT_SECRET` defaults to `'dev_secret'`
2. `forgot-password` returns reset token in API response body
3. CORS is fully open (`app.use(cors())`)
4. No rate limiting on any endpoint
5. No input validation (no express-validator)
6. Avatar URL uses `req.get('host')` (Host header injection risk)

### Missing Features
- No real progressive overload tracking/suggestions
- No AI fitness coach recommendations
- No body weight history chart
- No onboarding flow for new users
- No active workout timer (only rest timer)
- Statistics export button non-functional
- Social screen is entirely placeholder
- No deload week recommendations
- No exercise video/instruction links

### Technical Debt
- Navigation via manual `currentScreen` state instead of React Router
- No data-fetching library (no React Query / SWR)
- Day titles duplicated in both backend (`programs.js`) and frontend (`GeneratorScreen.tsx`)
- `dashboard` endpoint is documented as "replace with real aggregations later"
- Business logic in frontend (exercise name resolution, muscle mapping) should live in backend

## Scalability Limitations

- All workouts fetched at once (no pagination) — will degrade at 500+ workouts
- MongoDB in-memory fallback means data loss on server restart
- Single-file backend with no service layer
- No caching layer (Redis/etc.)
