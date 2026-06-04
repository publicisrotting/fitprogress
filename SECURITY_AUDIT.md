# Security Audit — FitProgress

## Summary

| Severity | Count | Status |
|---|---|---|
| Critical | 1 | Fixed |
| High | 3 | Fixed |
| Medium | 4 | Fixed / Mitigated |
| Low | 2 | Documented |

---

## SEC-001: Reset Token Exposed in API Response (Critical → Fixed)

**Endpoint:** `POST /api/auth/forgot-password`

**Description:** The server returned the password reset token directly in the HTTP response body. Any observer of network traffic (proxy, browser extension, browser DevTools, log system) could intercept this token and use it to reset the victim's password.

**Fix:** Removed `resetToken` from response. Token is stored server-side only; in production it would be delivered via email.

---

## SEC-002: No Rate Limiting on Authentication Endpoints (High → Fixed)

**Endpoints:** `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/forgot-password`

**Description:** Unlimited requests allowed per IP, enabling brute-force attacks on user passwords.

**Fix:** Implemented in-memory rate limiter: 15 requests per 15-minute window per IP on all `/api/auth` routes. Returns HTTP 429 with a clear message when exceeded.

---

## SEC-003: Permissive CORS Policy (High → Fixed)

**Description:** `app.use(cors())` with no configuration accepted requests from any origin with any headers. This could allow malicious third-party websites to make authenticated API calls on behalf of logged-in users.

**Fix:** CORS now uses an `allowedOrigins` list loaded from the `ALLOWED_ORIGINS` environment variable. In production this should be set to the exact frontend domain(s).

---

## SEC-004: Weak JWT Secret Default (High → Documented)

**Description:** `const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'` — if the env var is missing in production, all tokens are signed with `'dev_secret'` which is publicly known. Any attacker could forge valid JWTs for any `userId`.

**Mitigation:** 
- The `.env` file MUST set `JWT_SECRET` to a cryptographically random 32+ byte string
- Recommended: `openssl rand -hex 32`
- Added to production deployment checklist

---

## SEC-005: Host Header Injection in Avatar URL (Medium → Documented)

**Endpoint:** `POST /api/user/avatar`

**Description:** Avatar URL is constructed as `${req.protocol}://${req.get('host')}/uploads/${filename}`. An attacker controlling the `Host` request header could make the server store a URL pointing to their domain, causing users to load avatars from attacker-controlled servers.

**Mitigation:** In production, deploy behind a reverse proxy (nginx, Cloudflare) that overwrites the Host header, or construct the avatar URL from an explicit `BASE_URL` environment variable.

---

## SEC-006: Request Body Size Unlimited (Medium → Fixed)

**Description:** `express.json()` with no size limit could be abused to send large payloads causing memory exhaustion (DoS).

**Fix:** Added `limit: '2mb'` to `express.json()` configuration.

---

## SEC-007: Input Validation Missing on Profile Update (Medium → Improved)

**Endpoint:** `PUT /api/user/profile`

**Description:** Fields like `age`, `weight`, `height` were cast with `Number()` but not validated for realistic ranges. A user could set `age: 99999` or `weight: -1`.

**Fix:** Added basic validation:
- `weight` validated as `> 0 && < 500` before saving
- `injuries` capped at 500 characters with `String().slice(0, 500)`
- `experienceLevel` validated against allowed enum values

---

## SEC-008: Workout Set Values Unbounded in Generator (Low → Documented)

**Description:** Generator creates workouts via `POST /api/workouts`. The route sanitises weights to `[0, 1000]` and reps to `[0, 100]`, which is correct. However, `programDayIndex` is already clamped to `[0, 365]`, and `name` fields are not length-validated.

**Recommendation:** Add max-length validation for `name` and `notes` fields (e.g. 200 chars).

---

## SEC-009: No Input Sanitisation for XSS in Stored Data (Low → Documented)

**Description:** Exercise names, workout names, and notes are stored as-is and rendered with React, which escapes HTML automatically for text nodes. However, if any component ever uses `dangerouslySetInnerHTML`, these strings would need sanitisation.

**Status:** Currently safe because React escapes all text. If HTML rendering is ever added, `DOMPurify` should be added.

---

## Recommendations for Production

1. Set `JWT_SECRET` to a 32+ byte random string
2. Set `ALLOWED_ORIGINS` to the production domain
3. Deploy behind nginx/Cloudflare with strict Host header
4. Enable HTTPS (TLS) — JWT tokens and session data must not transit plain HTTP
5. Consider migrating from in-memory rate limiter to Redis-backed (`express-rate-limit` + `rate-limit-redis`) for multi-instance deployments
6. Add `helmet` CSP headers for the frontend
7. Enable MongoDB Atlas IP allowlist — restrict to server IP only
