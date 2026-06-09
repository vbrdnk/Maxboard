/**
 * App state + persistence (Zustand + persist → AsyncStorage).
 *
 * All mutation, sorting, filtering, and normalization logic lives here (fat lib
 * / thin components — AGENTS.md). Components read derived values via the pure
 * selectors below; they should not re-implement any of this logic.
 *
 * Storage shape: a single JSON blob under one key (PRD §Technical Guidance —
 * the data model is small enough that a key-value store is fine).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { convert, genId, roundingIncrementFor } from '@/lib/formulas';
import { buildPresetExercises } from '@/lib/presets';
import type { Exercise, PREntry, Unit, UnitSystem, UserSettings } from '@/lib/types';

const STORAGE_KEY = 'maxboard-store-v1';

export type AddExerciseInput = {
  name: string;
  /** Optional initial 1RM logged alongside creation (PRD §Adding a Custom Exercise). */
  initial?: { weight: number; unit: PREntry['unit'] };
};

export type AppState = {
  settings: UserSettings | null;
  exercises: Exercise[];
  entries: PREntry[];
  /** True once persisted state has rehydrated — gates the onboarding redirect. */
  hydrated: boolean;

  /** First-launch gate: save unit system, seed preset exercises, enter the app. */
  completeOnboarding: (unitSystem: UnitSystem) => void;
  /** Change unit system later (settings sheet); re-derives roundingIncrement. */
  setUnitSystem: (unitSystem: UnitSystem) => void;

  /**
   * Create a user exercise. Returns the new id, or null if the name duplicates
   * an existing one (case-insensitive, INCLUDING hidden exercises — PRD).
   */
  addExercise: (input: AddExerciseInput) => string | null;
  hideExercise: (id: string) => void;
  unhideExercise: (id: string) => void;
  /** Delete a user exercise + its entries. No-op for presets (never deletable). */
  deleteExercise: (id: string) => void;
  /** Persist a new manual order (drag reorder); ids in their target order. */
  reorderExercises: (orderedIds: string[]) => void;

  addEntry: (entry: Omit<PREntry, 'id'>) => string;
  deleteEntry: (id: string) => void;
};

function settingsFor(unitSystem: UnitSystem): UserSettings {
  return { unitSystem, roundingIncrement: roundingIncrementFor(unitSystem) };
}

function nameExists(exercises: Exercise[], name: string): boolean {
  const norm = name.trim().toLowerCase();
  return exercises.some((e) => e.name.trim().toLowerCase() === norm);
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: null,
      exercises: [],
      entries: [],
      hydrated: false,

      completeOnboarding: (unitSystem) =>
        set({ settings: settingsFor(unitSystem), exercises: buildPresetExercises() }),

      setUnitSystem: (unitSystem) => set({ settings: settingsFor(unitSystem) }),

      addExercise: ({ name, initial }) => {
        const { exercises, entries } = get();
        if (nameExists(exercises, name)) return null;

        const id = genId();
        const now = new Date().toISOString();
        const sortOrder = exercises.reduce((max, e) => Math.max(max, e.sortOrder), -1) + 1;
        const exercise: Exercise = {
          id,
          name: name.trim(),
          createdAt: now,
          sortOrder,
          isPreset: false,
          hidden: false,
        };

        const nextEntries = initial
          ? [
              ...entries,
              {
                id: genId(),
                exerciseId: id,
                weight: initial.weight,
                unit: initial.unit,
                date: now,
                source: 'direct' as const,
              },
            ]
          : entries;

        set({ exercises: [...exercises, exercise], entries: nextEntries });
        return id;
      },

      hideExercise: (id) =>
        set((s) => ({
          exercises: s.exercises.map((e) => (e.id === id ? { ...e, hidden: true } : e)),
        })),

      unhideExercise: (id) =>
        set((s) => ({
          exercises: s.exercises.map((e) => (e.id === id ? { ...e, hidden: false } : e)),
        })),

      deleteExercise: (id) =>
        set((s) => {
          const target = s.exercises.find((e) => e.id === id);
          if (!target || target.isPreset) return s; // presets never deleted
          return {
            exercises: s.exercises.filter((e) => e.id !== id),
            entries: s.entries.filter((en) => en.exerciseId !== id),
          };
        }),

      reorderExercises: (orderedIds) =>
        set((s) => {
          const rank = new Map(orderedIds.map((id, i) => [id, i]));
          return {
            exercises: s.exercises.map((e) => {
              const r = rank.get(e.id);
              return r === undefined ? e : { ...e, sortOrder: r };
            }),
          };
        }),

      addEntry: (entry) => {
        const id = genId();
        set((s) => ({ entries: [...s.entries, { ...entry, id }] }));
        return id;
      },

      deleteEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist the transient hydration flag.
      partialize: ({ settings, exercises, entries }) => ({ settings, exercises, entries }),
      onRehydrateStorage: () => (state) => {
        useStore.setState({ hydrated: true });
        void state;
      },
    },
  ),
);

// ---------------------------------------------------------------------------
// Pure selectors — accept state slices so they're testable without the store
// and reusable across components. Keep all derivation here, not in components.
// ---------------------------------------------------------------------------

/** Newest-first entries for one exercise. */
export function entriesFor(entries: PREntry[], exerciseId: string): PREntry[] {
  return entries
    .filter((e) => e.exerciseId === exerciseId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Current 1RM for an exercise: the heaviest logged entry, normalized to a
 * common unit for comparison. Returns null when no entries exist (the card
 * shows a muted "—"). Comparison uses lbs as the neutral basis.
 */
export function currentOneRm(
  entries: PREntry[],
  exerciseId: string,
): PREntry | null {
  const mine = entries.filter((e) => e.exerciseId === exerciseId);
  if (mine.length === 0) return null;
  const toLbs = (e: PREntry) => (e.unit === 'kg' ? e.weight * 2.20462 : e.weight);
  return mine.reduce((best, e) => (toLbs(e) > toLbs(best) ? e : best));
}

/**
 * Visible exercises in display order. Manual sortOrder is the primary key
 * (user reordering overrides everything). Within equal order we keep exercises
 * with logged data above empty ones, then fall back to name (PRD §Reordering).
 */
export function visibleExercisesSorted(
  exercises: Exercise[],
  entries: PREntry[],
): Exercise[] {
  const hasData = (id: string) => entries.some((e) => e.exerciseId === id);
  return exercises
    .filter((e) => !e.hidden)
    .slice()
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      const ad = hasData(a.id) ? 0 : 1;
      const bd = hasData(b.id) ? 0 : 1;
      if (ad !== bd) return ad - bd;
      return a.name.localeCompare(b.name);
    });
}

/** Hidden exercises (for the settings "Manage Exercises" section). */
export function hiddenExercises(exercises: Exercise[]): Exercise[] {
  return exercises.filter((e) => e.hidden);
}

/** One plotted point: epoch-ms timestamp (x) + weight in the display unit (y). */
export type ProgressPoint = { t: number; weight: number };

/** Progress data + summary stats for one exercise, in the display unit. */
export type ProgressSeries = {
  exercise: Exercise;
  points: ProgressPoint[];
  /** Most recent entry's weight (display unit). */
  current: number;
  /** Heaviest weight ever (display unit). */
  allTimePR: number;
  /** current − first entry (display unit); can be negative. */
  totalGain: number;
  /** Number of logged PRs. */
  prCount: number;
};

/**
 * Build per-exercise progress series for the chart (PRD §Progress). Each entry's
 * weight is normalized to `displayUnit` at read time (stored values untouched),
 * points sorted oldest→newest. Only visible exercises with at least `minPoints`
 * entries are returned (default 2 — a line needs two points).
 */
export function progressSeries(
  exercises: Exercise[],
  entries: PREntry[],
  displayUnit: Unit,
  minPoints = 2,
): ProgressSeries[] {
  return exercises
    .filter((e) => !e.hidden)
    .map((exercise): ProgressSeries | null => {
      const points = entries
        .filter((en) => en.exerciseId === exercise.id)
        .map((en) => ({
          t: new Date(en.date).getTime(),
          weight: convert(en.weight, en.unit, displayUnit),
        }))
        .sort((a, b) => a.t - b.t);

      if (points.length < minPoints) return null;

      const weights = points.map((p) => p.weight);
      const current = weights[weights.length - 1];
      return {
        exercise,
        points,
        current,
        allTimePR: Math.max(...weights),
        totalGain: current - weights[0],
        prCount: points.length,
      };
    })
    .filter((s): s is ProgressSeries => s !== null);
}
