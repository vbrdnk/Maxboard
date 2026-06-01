/**
 * Domain types — exact shapes from PRD §Core Concepts / Data Model.
 *
 * Invariant: weights are stored as entered, with their own unit. Conversion to
 * the display unit happens at render time only — never mutate a stored value.
 */

export type UnitSystem = 'imperial' | 'metric';

/** The unit a weight is stored in. */
export type Unit = 'lbs' | 'kg';

/** How a PR was obtained: directly tested vs estimated from a submaximal set. */
export type PRSource = 'direct' | 'estimated';

/**
 * 1RM estimation formula. Epley is the only one shipped (MVP), but the type and
 * the formula util's signature stay extensible so Brzycki/Lombardi can be added
 * later without API churn (AGENTS.md / PRD §Key Implementation Notes).
 */
export type Formula = 'epley';

export type UserSettings = {
  unitSystem: UnitSystem;
  /** Derived from unitSystem: 2.5 (lbs) or 1 (kg). Used by the table's Rounded column. */
  roundingIncrement: number;
};

export type Exercise = {
  id: string;
  name: string;
  /** ISO timestamp. */
  createdAt: string;
  sortOrder: number;
  /** Preset exercises can be hidden but never permanently deleted. */
  isPreset: boolean;
  /** Hidden = excluded from the Lifts list, data preserved, user can unhide. */
  hidden: boolean;
};

/** Preserved original input for an estimated PR, so the user sees how it was derived. */
export type EstimatedFrom = {
  reps: number;
  weight: number;
  unit: Unit;
};

export type PREntry = {
  id: string;
  /** FK → Exercise.id */
  exerciseId: string;
  weight: number;
  unit: Unit;
  /** ISO timestamp, user-selectable, defaults to now. */
  date: string;
  source: PRSource;
  notes?: string;
  /** Populated when source === 'estimated'. */
  estimatedFrom?: EstimatedFrom;
};
