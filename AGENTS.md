# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project State

**Greenfield.** The repo currently contains only `1rm-tracker-prd.md` — no code, no `package.json`, no git history yet. The PRD is the single source of truth for what to build. Read it before any implementation work.

Maxboard is an **Expo (React Native)** mobile app for tracking one-rep max (1RM) lifts: percentage-loading tables, Epley-based 1RM estimation, and progress charts. Local-only storage, no backend, no cloud sync in MVP. Targets iOS, Android, and iPad.

## Documentation Source — use the Expo MCP

This repo has the **official Expo MCP server** configured in `.mcp.json` (`https://mcp.expo.dev/mcp`, Streamable HTTP, OAuth). It serves the latest Expo / EAS / expo-router docs.

- **Prefer the Expo MCP over training knowledge** for anything Expo, expo-router, EAS, or SDK-version-specific — Expo ships fast and APIs drift.
- First use requires auth: run `/mcp` in Claude Code and complete the OAuth flow (personal access token from Expo account settings, or username/password).
- For non-Expo libraries (React Query, charting libs, etc.), Context7 MCP is also available.

## Stack & Tooling

- **Expo SDK 52+** with `expo-router` (file-based routing: tabs + stacks). PRD says SDK 52+; scaffold on the latest stable SDK — confirm the current version via the Expo MCP.
- **Package manager: pnpm** (not npm). See the pnpm + Expo section below — it has real quirks.
- **Storage:** `@react-native-async-storage/async-storage` (MVP). Data model is small enough for a single JSON blob under one key. `expo-sqlite` is acceptable but do not over-engineer.
- **Charts:** `react-native-chart-kit` or `victory-native` — pick whichever has better touch interaction.
- **TypeScript strict mode** throughout.

When scaffolding, use the latest stable versions of Expo and all dependencies (per global preferences).

## pnpm + Expo (read before scaffolding)

Expo officially supports pnpm, but the dependency layout matters. Verify current guidance via the Expo MCP before scaffolding.

- **Scaffold with `create-expo-app --pnpm`** (or run `create-expo-app` and choose pnpm). This auto-writes `node-linker=hoisted` into `.npmrc` / `pnpm-workspace.yaml`, the config that avoids React Native module-resolution errors.
- **The core quirk:** React Native / Expo native modules expect a flat, hoisted `node_modules`. pnpm's default **isolated** (symlinked, strict) layout breaks Metro resolution on older SDKs. Mitigation by SDK:
  - **SDK ≤53:** `node-linker=hoisted` is **required**. `create-expo-app` sets it automatically — do not remove it.
  - **SDK 54+:** isolated installs are supported. You may drop `node-linker=hoisted`, but if any native lib throws build/resolution errors, set it back to `hoisted` — that is the documented escape hatch.
- **EAS Build** auto-detects pnpm when `pnpm-lock.yaml` is present in the project root. No extra config needed.
- Commit the `.npmrc` (with `node-linker` setting) and `pnpm-lock.yaml`.
- If Metro can't resolve a module after install: check `.npmrc` still has `node-linker=hoisted`, then `pnpm install` and clear Metro cache (`pnpm expo start -c`).

## Commands

No tooling exists yet. After scaffolding with pnpm, the standard Expo commands apply (run via pnpm):

```bash
pnpm install              # install deps
pnpm expo start           # dev server (press i / a for iOS / Android sim)
pnpm expo start -c        # start with cleared Metro cache (use after dep/resolution issues)
pnpm expo start --ios     # boot iOS simulator directly
pnpm test                 # run unit tests (configure jest-expo)
pnpm test -- formulas     # run a single test file by name pattern
```

Confirm the actual script names in `package.json` once it exists and update this section.

## Architecture (target — from PRD §Technical Guidance)

Suggested layout (agent has discretion, but follow the thin-component / fat-lib split):

```
app/
  _layout.tsx            # Root — checks UserSettings, gates onboarding
  onboarding.tsx         # First-launch unit system selection
  (tabs)/
    _layout.tsx          # Bottom tab navigator: Lifts / Calculator / Progress
    index.tsx            # Lifts list (accordion)
    calculator.tsx       # Rep max calculator
    progress.tsx         # Progress charts
components/              # Thin, presentational
lib/                     # All logic lives here
  storage.ts             # AsyncStorage read/write
  formulas.ts            # Epley, unit conversion, rounding
  types.ts               # Exercise, PREntry, UserSettings
  presets.ts             # Preset exercise list
constants/theme.ts       # Dark-theme design tokens
```

**Core architectural rules (these are why the split matters):**

- **Logic in `lib/`, components stay thin.** Sorting, filtering, normalization, formulas — all live in `lib/`, not in components.
- **Weights are stored as entered, with their own unit.** Conversion (1 kg = 2.20462 lbs) happens **at display time only**, normalized to the current display unit. Never mutate stored values to a canonical unit.
- **The percentage table is a pure function of one number** (the 1RM). No state-management complexity — derive, don't store.
- **Epley formula** (`1RM = weight × (1 + reps / 30)`) lives in one utility. Signature must accept a `formula` param (Epley default) so Brzycki/Lombardi can be added later without API churn. 1 rep → return weight as-is (direct 1RM).
- **Rounding increment** is unit-derived: 2.5 lbs (imperial) / 1 kg (metric). Used in the percentage table's "Rounded" column.

## Domain Model (see PRD §Core Concepts)

`UserSettings` (unitSystem, roundingIncrement), `Exercise` (preset vs user-created, hideable), `PREntry` (source: `"direct" | "estimated"`; estimated entries preserve `estimatedFrom`). Key invariants:

- First launch (no `UserSettings`) → onboarding gate: pick unit system, write preset exercises, enter app. One-time.
- **Preset exercises** (`isPreset: true`) can be hidden but **never permanently deleted**. User-created exercises can be deleted with confirmation.
- Duplicate exercise names prevented (case-insensitive, **including hidden** exercises).
- Exercises with no logged 1RM show "—" and sort below exercises with data — unless the user has manually reordered.

## Design System (see PRD §Design Requirements)

Dark theme only, no light mode. Tokens go in `constants/theme.ts`:

- Near-black bg (`#0a0a0a`), dark gray cards (`#1a1a1a`) with a 3–4px lime-green left accent border.
- Accent: chartreuse/lime (`~#c8ff00`) — used sparingly for interactive elements and the 90/95/100% rows.
- Monospace for all data (exercise names, weights, percentages). The 1RM value is the most dominant element on each card.
- Gym-tool priorities: glanceability at arm's length, ≤3-tap PR logging, 48pt min tap targets, one-hand thumb reach.

## Testing (per PRD §Testing)

- Unit tests required for: **Epley formula, unit conversion, plate rounding, data normalization**.
- Snapshot tests for percentage-table output at known 1RM values.
- No E2E for MVP.

## Out of Scope (MVP — do not build, do not block)

Cloud sync, data export, workout/set logging, rest timer, plate calculator, social, notifications, light theme, barbell-weight config, multi-formula calculator UI. Keep code extensible toward these but ship none of them.
