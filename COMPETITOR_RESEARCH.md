# Competitor Research — FitProgress vs Market Leaders

## Competitor Overview

| App | Core Strength | Pricing |
|---|---|---|
| **Hevy** | Social workout logging, clean UX | Free + Pro $10/mo |
| **Strong** | Simplest workout logger, reliable | Free + $10/mo |
| **Fitbod** | AI-personalised exercise selection | $13/mo |
| **Alpha Progression** | Scientific progressive overload | $8/mo |
| **Boostcamp** | Coach-designed free programs | Free + $10/mo |
| **Freeletics** | Bodyweight AI coach | $50/yr |
| **Nike Training Club** | Premium production value, free | Free |
| **Apple Fitness+** | Video-guided workouts, ecosystem | $10/mo |

---

## Detailed Analysis

### Onboarding

| App | Onboarding |
|---|---|
| Fitbod | 5-step wizard: goal, experience, equipment, schedule, body metrics |
| Hevy | Register → straight to workout (minimal friction) |
| Strong | Register → template library |
| Alpha Progression | Detailed setup: experience level, 1RM estimation |
| **FitProgress** | Register → empty dashboard (no onboarding) ❌ |

**Gap:** FitProgress has zero onboarding. Users see an empty dashboard with no guidance.

### Workout Generation

| App | Generation |
|---|---|
| Fitbod | AI selects exercises based on muscle fatigue, equipment, recovery |
| Alpha Progression | Progressive overload calculation per exercise (% 1RM) |
| Boostcamp | Real coach programs (5/3/1, GZCLP, PPL) |
| **FitProgress** | Rule-based: goal + days + intensity only ❌ |

**Gap:** FitProgress doesn't consider equipment, experience level, age, injuries, or recovery when generating programs.

### Progress Tracking

| App | Tracking |
|---|---|
| Hevy | Volume/strength graphs, PR notifications, 1RM estimator |
| Alpha Progression | Per-exercise progression charts, deload detection |
| Strong | Per-exercise history, estimated 1RM |
| **FitProgress** | Total volume bar chart, basic PRs list ⚠️ |

**Gap:** No per-exercise progress charts, no 1RM estimator, no body weight trend chart.

### AI / Intelligence

| App | AI Features |
|---|---|
| Fitbod | Muscle recovery model, dynamic substitutions |
| Freeletics | AI coach, difficulty adaptation |
| Alpha Progression | Autoregulation, deload recommendations |
| **FitProgress** | None ❌ |

**Gap:** Zero AI coaching. No progressive overload suggestions, no recovery guidance, no deload alerts.

### Retention / Gamification

| App | Retention |
|---|---|
| Hevy | Social feed, friend following, PR celebrations |
| Fitbod | Muscle heat map, streak, badges |
| Nike TC | Challenges, collections, community |
| **FitProgress** | Achievements (implementation unclear), streak (mock data) ⚠️ |

**Gap:** Streak data is currently mocked. Achievement system exists in UI but backend logic is thin.

### UX / Design Quality

| App | Design |
|---|---|
| Apple Fitness+ | Premium video, fluid animations, haptics |
| Hevy | Clean, minimal, great information density |
| Strong | Functional, reliable, no-frills |
| **FitProgress** | Dark theme, good visual language, but some inconsistencies ⚠️ |

**Gap:** Light mode is partially implemented but dark mode is dominant. Loading states are inconsistent. No micro-animations on data updates.

---

## What Competitors Do Better

1. **Personalised onboarding** — Every top app collects fitness background before first use
2. **Per-exercise progressive overload** — Alpha Progression, Hevy, Strong all track exercise-level progression
3. **1RM estimator** — Standard feature missing from FitProgress
4. **Equipment filters** — Fitbod/Strong allow filtering exercises by available equipment
5. **Real AI program generation** — Current generation is static template selection, not adaptive
6. **Social/community** — Hevy's social feed drives daily active users significantly
7. **Workout templates** — Pre-built programs from coaches (Boostcamp model) drives retention
8. **Body weight logging** — Simple but missing from FitProgress
9. **Deload recommendations** — Alpha Progression automatically detects training fatigue
10. **Exercise instructions** — Animated GIFs or video for each exercise (Nike TC, Fitbod)

## What FitProgress Does Well

- Multi-language support (unique in this space)
- Clean, modern dark UI
- Both web (PWA) and mobile (Expo)
- Inline workout editing is genuinely useful
- Hint system (last/best set) is a good UX pattern

## Strategic Opportunities

1. **Ukrainian/Eastern European market** — No dominant local fitness app; multilingual advantage is real
2. **Freemium model** — Premium tier exists, needs to deliver clear value
3. **AI coach layer** — Could differentiate from Simple trackers (Hevy/Strong)
4. **Community features** — High retention potential in post-2022 Ukrainian fitness community
