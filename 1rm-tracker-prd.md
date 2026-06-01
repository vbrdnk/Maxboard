# Maxboard — Product Requirements Document

## Overview

A mobile app for tracking one-rep max (1RM) lifts, viewing percentage-based loading charts, estimating 1RM from submaximal efforts, and visualizing progress over time. Built for use mid-workout — optimized for quick glances between sets and fast data entry with sweaty hands.

**Platform:** Expo (React Native) — iOS, Android, iPad  
**Storage:** Local only (AsyncStorage or expo-sqlite), no cloud sync for MVP  
**Target user:** Intermediate-to-advanced lifter doing barbell-centric training (CrossFit, Olympic lifting, powerlifting)

---

## Core Concepts

### Data Model

```
UserSettings {
  unitSystem: "imperial" | "metric"   # set during first-launch onboarding
  roundingIncrement: number            # 2.5 lbs or 1 kg, derived from unitSystem
}

Exercise {
  id: string (uuid)
  name: string
  createdAt: ISO timestamp
  sortOrder: number
  isPreset: boolean       # true for pre-populated exercises, false for user-created
  hidden: boolean         # true = excluded from Lifts list (user can unhide later)
}

PREntry {
  id: string (uuid)
  exerciseId: string (FK → Exercise.id)
  weight: number
  unit: "lbs" | "kg"
  date: ISO timestamp (user-selectable, defaults to now)
  source: "direct" | "estimated"
  notes?: string (optional, e.g. "felt easy", "ugly grind")
  estimatedFrom?: { reps: number, weight: number, unit: "lbs" | "kg" } (populated when source = "estimated")
}
```

A `PREntry` with source `"estimated"` is created via the rep max calculator. The `estimatedFrom` field preserves the original input so the user can see how the estimate was derived.

### Unit Handling

- Each entry stores its own unit at time of logging.
- The app has a global display preference (`unitSystem` in UserSettings) that controls how percentage tables, charts, and new-entry defaults render.
- Conversion factor: 1 kg = 2.20462 lbs. When comparing entries across units, normalize to the display unit.
- Rounding increment: 2.5 lbs for imperial, 1 kg for metric. Used in the percentage table's "Rounded" column.

---

## First Launch — Onboarding

On very first launch (no UserSettings in storage), show a single onboarding screen before the main app:

1. App logo / title ("Maxboard")
2. Unit system selector — two large tappable cards: **Imperial (lbs)** and **Metric (kg)**
3. Tapping one saves the choice to UserSettings, writes the preset exercise list to storage, and drops the user into the main Lifts screen

This is a one-time gate. The unit system can be changed later in a settings sheet (gear icon on the Lifts screen header).

---

## Screens & Navigation

The app uses a bottom tab navigator with three tabs: **Lifts**, **Calculator**, and **Progress**.

### 1. Lifts (Home Tab)

The primary screen. A single scrollable view with an **accordion-style list** of exercises — no separate detail screen. This matches the existing web tracker UX (see design reference screenshot).

**Header area:**
- App title ("MAXBOARD") — bold, large, monospace
- Subtitle showing count of visible lifts (e.g., "7 LIFTS · TAP TO EXPAND")
- Gear icon → opens a settings bottom sheet (change unit system, manage hidden exercises)

**Exercise list — each exercise is a collapsible card:**

Collapsed state (default):
- Exercise name (uppercase, monospace)
- Current 1RM value + unit (large, prominent — the biggest text element on the card)
- Entry count (e.g., "1 entry", "3 entries") — right-aligned, subdued
- Chevron indicator (▼ collapsed, ▲ expanded)

Expanded state (tap to toggle):
- Expands inline to reveal two tabs: **PERCENTAGES** (default) and **HISTORY**
- Only one exercise can be expanded at a time — expanding one collapses the previously open one
- Smooth expand/collapse animation

**Percentage Table (within expanded card):**
- Unit toggle at top-right of the table (lbs / kg pill toggle) — overrides global setting for this view only, does not persist
- Three columns: % | WEIGHT (exact) | ROUNDED
- Rows from 35% to 100% in 5% increments
- Rounded weight snaps to nearest rounding increment (2.5 lbs or 1 kg based on global setting)
- Table should be high-contrast, monospace numbers, easy to read at arm's length
- Highlight the higher percentages (90%, 95%, 100%) with the accent color — these are the ones you care about during heavy sets
- Footer note: "Rounded to nearest 0.25 lbs" (or "1 kg")

**History tab (within expanded card):**
- Chronological list of all PREntries for this exercise (newest first)
- Each entry shows: weight, unit, date, source badge ("tested" vs "estimated"), notes if present
- Swipe-to-delete on individual entries with confirmation
- "Log New PR" button (prominent, always visible — sticky at bottom of the expanded area)

**"Log New PR" inline form (slides up as a bottom sheet):**
- Weight input (numeric keypad, large tap target)
- Unit toggle (lbs / kg), defaults to global preference
- Date picker, defaults to today
- Optional notes field (single line, collapsible)
- Save button

#### Pre-populated Exercise List

On first launch, create all of the following exercises with `isPreset: true` and `hidden: false`. No 1RM values are pre-filled — the user enters their own numbers.

**Powerlifting / Strength:**
Back Squat, Front Squat, Deadlift, Sumo Deadlift, Bench Press, Overhead Press (Strict Press), Floor Press

**Olympic Lifting:**
Clean & Jerk, Power Clean & Jerk, Snatch, Power Snatch, Power Clean, Hang Clean, Hang Snatch

**Accessory:**
Barbell Row, Romanian Deadlift (RDL), Push Press, Hip Thrust, Pendlay Row

Exercises without any logged 1RM appear in the list with a muted "—" instead of a weight value, and are sorted below exercises that have data.

#### Hiding / Showing Exercises

- Long-press (or swipe-left) on an exercise card → "Hide" option
- Hidden exercises disappear from the main list but are NOT deleted — their data is preserved
- Settings sheet (gear icon) has a "Manage Exercises" section showing hidden exercises with a toggle to unhide them
- Preset exercises can be hidden but never fully deleted. User-created exercises can be deleted (with confirmation).

#### Adding a Custom Exercise

- "+" button on the Lifts screen (top-right or FAB)
- Opens a simple form: exercise name (text input) + optional initial 1RM (weight + unit)
- Created with `isPreset: false`
- Duplicate names are prevented (case-insensitive check, including against hidden exercises)

#### Reordering

- Drag handles on exercise cards for manual reordering
- Exercises with logged data sort above empty exercises by default, but user reordering overrides this

### 2. Calculator Tab

Estimates 1RM from a submaximal set using the Epley formula: `1RM = weight × (1 + reps / 30)`.

**Inputs:**
- Weight lifted (numeric, large tap target)
- Unit toggle (lbs / kg)
- Reps performed (numeric, or stepper +/- buttons for quick adjustment, range 2–15)

**Output (updates live as inputs change):**
- Estimated 1RM (large, prominent)
- "Save as PR" button → opens exercise picker (existing exercises + "add new"), then saves a PREntry with `source: "estimated"` and `estimatedFrom` populated
- Percentage table below the estimate (same format as Exercise Detail), so you can immediately see loading numbers off the estimate

**Formula note:** Epley is standard. If the user enters 1 rep, bypass the formula and show the weight as-is (it's a direct 1RM). For reps > 10, show a subtle disclaimer that estimates become less reliable.

### 3. Progress Tab

Visualizes 1RM trends over time.

**Default view: Multi-exercise line chart**
- X-axis: date, Y-axis: weight (in display unit)
- Each exercise is a line with a distinct color
- Tappable legend to toggle exercises on/off
- Default: show all exercises with at least 2 data points

**Single exercise view:**
- Tap an exercise in the legend (or select from a dropdown) to isolate it
- Shows the line chart for just that exercise
- Below the chart: summary stats — current 1RM, all-time PR, total gain since first entry, number of PRs logged

**Charting library:** Use `react-native-chart-kit` or `victory-native` (both Expo-compatible). Prefer whichever has better touch interaction support.

---

## Preset Data

See the "Pre-populated Exercise List" section under Lifts for the full list of preset exercises. These are created on first launch with no 1RM values — the user fills in their own numbers. Preset exercises have `isPreset: true` and cannot be permanently deleted, only hidden.

---

## Design Requirements

### Philosophy

This is a gym tool, not a social app. Optimize for:
1. **Glanceability** — percentage tables readable at arm's length, even in bright gym lighting
2. **Speed** — log a new PR in under 5 seconds (weight → save, date defaults to today)
3. **Fat-finger tolerance** — large tap targets (minimum 48pt), generous spacing
4. **One-hand use** — primary actions reachable with thumb on a phone held in one hand

### Visual Direction

Reference the existing web tracker design (screenshot attached). Key characteristics to carry over:

- **Dark theme** — near-black background (#0a0a0a or similar), not just dark gray. This is the only theme; no light mode.
- **Accent color** — chartreuse/lime green (approx. #c8ff00) for interactive elements, highlights, and the 90-100% percentage rows. Use sparingly — it should pop, not overwhelm.
- **Typography** — monospace or condensed mono-style font for all data (exercise names, weights, percentages). System monospace is fine (SF Mono on iOS, Roboto Mono on Android). Large, bold weight values (the 1RM number on each card should be the most dominant element).
- **Cards** — dark gray cards (#1a1a1a) with subtle left-side accent border (lime green, 3-4px). No drop shadows, no rounded corners beyond 4-8px.
- **Percentage table** — three clean columns, alternating row backgrounds for scanability, no heavy grid lines. Row text in light gray, with 90/95/100% rows highlighted in the accent color.
- **Minimal chrome** — no unnecessary borders, gradients, or decorative elements. The data IS the design.
- **Tab pills** — PERCENTAGES / HISTORY toggle styled as underline tabs (active = accent color underline + white text, inactive = muted gray)

### iPad Support

- On iPad, the Lifts list and Exercise Detail can render side-by-side (master-detail split view) if screen width > 768pt
- Percentage table can use more columns or larger font on iPad
- No other iPad-specific behavior required — it should just feel comfortable, not cramped

### Accessibility

- Support Dynamic Type / font scaling on iOS
- All interactive elements need accessible labels
- Chart data should have a text-based fallback (e.g., a table view toggle on the Progress tab)

---

## Technical Guidance

### Expo & Dependencies

- Use Expo SDK 52+ (latest stable at time of development)
- Use `expo-router` for file-based navigation (tabs + stacks)
- Storage: `@react-native-async-storage/async-storage` for MVP. The data model is simple enough that a key-value store works fine. Store all data under a single key as a JSON blob (exercises + entries), or use prefixed keys per exercise — agent's discretion, but keep it simple.
- If the agent prefers a relational approach, `expo-sqlite` is also acceptable — but don't over-engineer for MVP.

### Project Structure (suggested)

```
app/
  _layout.tsx            # Root layout — checks for UserSettings, gates onboarding
  onboarding.tsx         # First-launch unit system selection
  (tabs)/
    _layout.tsx          # Tab navigator (Lifts, Calculator, Progress)
    index.tsx            # Lifts list (accordion)
    calculator.tsx       # Rep max calculator
    progress.tsx         # Progress charts
components/
  ExerciseCard.tsx       # Collapsible accordion card
  PercentageTable.tsx    # Percentage table (used in card + calculator)
  PREntryForm.tsx        # Bottom sheet form for logging a PR
  SettingsSheet.tsx      # Settings bottom sheet (unit system, manage hidden exercises)
  Chart.tsx
lib/
  storage.ts             # AsyncStorage read/write helpers
  formulas.ts            # Epley formula, unit conversion, rounding
  types.ts               # TypeScript types for Exercise, PREntry, UserSettings
  presets.ts             # Preset exercise list
constants/
  theme.ts               # Colors, spacing, font sizes (dark theme tokens)
```

### Key Implementation Notes

- All weights are stored as entered (with their unit). Conversion happens at display time only.
- The percentage table is a pure function of a single number (the 1RM) — no state management complexity.
- The Epley formula lives in a single utility function. If we want to support multiple formulas later (Brzycki, Lombardi), the function signature should accept a `formula` parameter with Epley as default.
- Sorting, filtering, and normalization logic should be in `lib/` — keep components thin.
- Use TypeScript throughout. Strict mode.

### Testing

- Unit tests for: Epley formula, unit conversion, plate rounding, data normalization
- Snapshot tests for percentage table output at known 1RM values
- No E2E tests required for MVP

---

## Out of Scope (MVP)

These are explicitly deferred. Do not build them, but don't make architectural decisions that would block them later.

- Cloud sync / multi-device
- Data export (JSON/CSV)
- Workout logging (sets × reps tracking beyond 1RM)
- Rest timer
- Plate calculator (which plates to load on the bar)
- Social features / sharing
- Notifications or reminders
- Light theme / theme switching
- Barbell weight configuration (assume 45 lb / 20 kg standard bar)
- Multiple formula options in calculator UI (use Epley only, but keep the code extensible)

---

## Success Criteria

The app is done when:

1. A user can open the app, tap an exercise, and read their percentage table within 2 seconds of launch
2. Logging a new PR takes ≤ 3 taps after opening the exercise (tap "Log PR" → type weight → tap "Save")
3. The calculator gives a reasonable 1RM estimate and allows saving it to any exercise
4. Progress charts show meaningful trend data for exercises with 2+ entries
5. All data persists across app restarts
6. The app runs on iOS, Android, and iPad without layout issues
