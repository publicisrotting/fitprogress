# Design Improvements — FitProgress

## Design System Assessment

### Strengths
- Consistent dark color palette (`bg-slate-950` base)
- Good use of `bg-white/5` glass cards with subtle borders
- Rounded corners (`rounded-[2.5rem]`) are distinctive and modern
- Orange accent color is well-established and energetic
- Decorative blur elements create depth without performance cost

### Issues Found

#### Typography
- Mixed font weights across components (`font-black` for labels and body text is too heavy)
- Inconsistent text-size hierarchy: some screens use `text-[10px]` for labels, others `text-xs`
- Long strings in Ukrainian cause overflow in constrained grid cells

#### Color Consistency
- Statistics loading screen used `bg-gray-50` (light) — **Fixed**
- Dashboard has `bg-[#262135]` hardcoded in one loading state instead of `bg-slate-950`
- Light mode CSS overrides are comprehensive but some new screens (CoachScreen) may not inherit them

#### Spacing
- `pb-24` bottom padding on all scrollable screens is correct for bottom nav
- Safe area inset `pt-[calc(3rem+env(safe-area-inset-top))]` is correctly applied
- Some cards have inconsistent internal padding (p-5 vs p-6 vs p-8)

#### Empty States
- Good: WorkoutDiaryScreen has a detailed empty state with illustration
- Missing: CoachScreen was added with appropriate empty state
- Missing: Statistics screen shows a spinner then empty charts — could show a call-to-action

#### Loading States
- All screens now consistently use `bg-slate-950` with a spinner
- No skeleton loading (shimmer) for content areas — recommended for future improvement

#### Micro-interactions
- `active:scale-95` on buttons is well-applied throughout
- `group-hover` effects on cards create good hover feedback
- Rest timer animation `animate-spin` on timer icon is a nice touch

---

## Changes Implemented

### 1. Onboarding Screen (New)
- Full-screen onboarding flow with 3 steps: Stats → Goal → Experience
- Orange progress bar showing completion percentage
- Step titles and smooth transitions
- Skip button available but not prominent (good friction)

### 2. AI Coach Screen (New)
- Recovery status card with colour-coded severity (blue/emerald/orange/red)
- Progressive overload suggestion cards with current vs suggested weight comparison
- Deload recommendation alert
- Weekly volume bar chart using consistent purple gradient
- Stats footer card showing total tracked exercises

### 3. Navigation Improved
- Added "Coach" tab with Brain icon between Generator and Statistics
- Labels shortened: "Statistics" → "Stats", "Generator" → "Generate" to fit 5 tabs
- Active state uses orange colour + slightly larger icon stroke

### 4. Workout Timer Display
- Elapsed time shown in orange text in the workout header during active session
- Gives users real-time feedback on workout duration

---

## Recommended Future Improvements

### High Priority
1. **Skeleton loading states** — Replace spinner with content-shaped grey shimmer for better perceived performance
2. **Progress charts per exercise** — A line chart of weight over time per exercise (in Statistics)
3. **Body weight trend chart** — Simple line chart using `bodyWeightHistory` from User model
4. **Exercise search in diary** — Auto-complete from the exercise library when typing a name
5. **Haptic feedback patterns** — Different vibration patterns for set completion vs PR

### Medium Priority
6. **Swipe to delete** — Swipe gesture on workout cards for quick delete
7. **Dark/Light mode toggle** — Currently works but lacks smooth transition animation
8. **Achievement unlock animation** — Confetti or explosion effect when achievement is earned
9. **Chart tooltips** — Improved tooltip design with more data (e.g. date + exercises on volume chart)

### Low Priority
10. **Custom themes** — Beyond dark/light: midnight blue, forest green
11. **Widget-style dashboard tiles** — Reorderable dashboard sections
12. **Celebration screen** — Full-screen celebration when PR is beaten
