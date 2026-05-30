# Maxboard

A mobile app for tracking one-rep max (1RM) lifts — percentage-based loading tables, Epley-based 1RM estimation, and progress charts. Built to be used mid-workout: fast glances between sets, quick entry with sweaty hands.

## What it does

- **1RM estimation** — estimate a one-rep max from a submaximal set using the Epley formula (`1RM = weight × (1 + reps / 30)`).
- **Percentage-loading tables** — derive working weights (35%–100%) from the 1RM, with exact and rounded columns.
- **Progress charts** — visualize 1RM trends over time, per exercise or across exercises.

## Stack

| Area            | Choice                                                       |
| --------------- | ------------------------------------------------------------ |
| Framework       | [Expo](https://expo.dev) (React Native), SDK 52+             |
| Routing         | `expo-router` (file-based: tabs + stacks)                    |
| Language        | TypeScript (strict mode)                                     |
| Storage         | `@react-native-async-storage/async-storage` (local-only MVP) |
| Charts          | `react-native-chart-kit` or `victory-native`                 |
| Package manager | **pnpm**                                                     |

**Targets:** iOS, Android, iPad. **Dark theme only.** No backend, no cloud sync in MVP.

## Getting started

> Requires [pnpm](https://pnpm.io).

```bash
pnpm install              # install deps
pnpm expo start           # dev server (press i / a for iOS / Android sim)
pnpm expo start -c        # start with cleared Metro cache (after dep/resolution issues)
pnpm expo start --ios     # boot iOS simulator directly
pnpm test                 # run unit tests
```

> **pnpm + Expo note:** SDK ≤53 requires `node-linker=hoisted` in `.npmrc` (set automatically by `create-expo-app --pnpm`). SDK 54+ supports isolated installs. If Metro can't resolve a native module, set `node-linker=hoisted` and re-run `pnpm install` with a cleared cache.

## Testing

Unit tests for the Epley formula, unit conversion, plate rounding, and data normalization. Snapshot tests for percentage-table output at known 1RM values. No E2E for MVP.
