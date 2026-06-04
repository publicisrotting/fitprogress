# Performance Report — FitProgress

## Frontend Performance

### Bundle Analysis

| Library | Estimated Size | Notes |
|---|---|---|
| React + React-DOM | ~130kb | Standard |
| Recharts | ~400kb | Largest dep; loaded eagerly |
| Lucide React | ~30kb (tree-shaken) | Good — only imported icons included |
| Tailwind CSS | ~10kb (purged) | Excellent |
| Sonner | ~15kb | Lightweight toast |

**Problem:** Recharts is loaded eagerly even on screens that don't use it (Login, Generator, Diary). This adds ~400kb to the initial bundle.

**Recommendation:** Lazy-load statistics and coach screens:
```tsx
const StatisticsScreen = lazy(() => import('./components/screens/StatisticsScreen'));
const CoachScreen = lazy(() => import('./components/screens/CoachScreen'));
```

### API Request Patterns

**Dashboard:** Currently makes 3 parallel API calls:
- `GET /api/user/profile` — returns full user object
- `GET /api/user/dashboard` — also returns user data (overlap!)
- `GET /api/notifications`

**Fix:** Dashboard endpoint now returns all needed data. The separate `/api/user/profile` call on dashboard is redundant — the `dashboard` endpoint already returns user stats. Consider removing the profile call from dashboard or merging the two endpoints.

**WorkoutDiary:** Fetches ALL workouts on every view change. For a user with 500+ workouts this is a multi-second operation.

**Recommendation:** Add pagination:
```
GET /api/workouts?page=1&limit=20&sort=-date
```

**Statistics:** Fetches ALL workouts to compute stats server-side. This is O(n) per request.

**Recommendation:** Consider background aggregation jobs (cron) to pre-compute statistics and cache them, or add MongoDB aggregation pipeline indexes on `user` + `date`.

### Rendering Performance

- All screens use flat component trees — no deep nesting issues
- WorkoutDiaryScreen has a large `filteredWorkouts.map()` with `expandedWorkoutId` state — when a workout is expanded, re-renders all other workout cards unnecessarily
- **Recommendation:** Memoize individual workout card components with `React.memo`

### Caching

- **No client-side caching** — every navigation away and back causes a full re-fetch
- **Recommendation:** Implement React Query or SWR for:
  - `staleTime: 60000` (1 minute) for dashboard and notifications
  - `staleTime: 300000` (5 minutes) for statistics
  - Invalidate on workout save/delete

---

## Backend Performance

### Database Indexes

The following fields are queried frequently but may lack indexes:

```javascript
// Workout queries
{ user: 1, date: -1 }  // All workouts sorted by date
{ user: 1, 'exercises.nameKey': 1 }  // Hints lookup

// User queries  
{ email: 1 }  // Login (likely indexed via unique constraint)
```

**Recommendation:** Add compound index:
```javascript
WorkoutSchema.index({ user: 1, date: -1 });
WorkoutSchema.index({ user: 1, 'exercises.nameKey': 1 });
```

### Memory Usage

- In-memory MongoDB fallback (`mongodb-memory-server`) holds all data in RAM — intended for development only
- Rate limiter uses in-process `Map` — fine for single instance, leaks slightly (no TTL on old IP entries)

**Fix Recommendation for rate limiter:**
```javascript
setInterval(() => {
  const cutoff = Date.now() - 15 * 60 * 1000;
  rateLimitMap.forEach((entry, key) => {
    if (entry.start < cutoff) rateLimitMap.delete(key);
  });
}, 5 * 60 * 1000);
```

### Startup Time

- `mongodb-memory-server` downloads a MongoDB binary on first run — this can take 30-60 seconds on first startup
- **Recommendation:** Use `MONGODB_URI` in all environments; reserve in-memory only for CI/testing

---

## Changes Made in This Audit

1. Added `limit: '2mb'` to express.json to prevent large payload DoS
2. Real workout aggregations replace mock data (reduced client-side processing)
3. Rate limiter prevents auth endpoint abuse
4. Progressive overload endpoint (`/api/workouts/coach`) uses `.limit(60)` on workout queries to prevent unbounded scans

## Metrics Targets (Production)

| Metric | Target | Current Estimate |
|---|---|---|
| Time to Interactive | < 3s | ~4-5s (large bundle) |
| First Contentful Paint | < 1.5s | ~2s |
| API response (dashboard) | < 200ms | ~50ms (in-memory) |
| API response (stats) | < 500ms | ~100ms (small dataset) |
