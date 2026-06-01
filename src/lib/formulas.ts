/**
 * Pure calculation core (PRD §Key Implementation Notes).
 *
 * Everything here is a pure function of its inputs — no state, no storage, no
 * React. This is the most heavily unit-tested module. The percentage table is a
 * pure function of one number (the 1RM): derive, never store.
 */

import type { Formula, Unit, UnitSystem } from '@/lib/types';

/** Exact conversion factor: 1 kg = 2.20462 lbs (PRD §Unit Handling). */
export const LBS_PER_KG = 2.20462;

/** Rounding increment per unit system: 2.5 lbs (imperial) / 1 kg (metric). */
export function roundingIncrementFor(unitSystem: UnitSystem): number {
  return unitSystem === 'imperial' ? 2.5 : 1;
}

/** The display unit a unit system renders in. */
export function displayUnitFor(unitSystem: UnitSystem): Unit {
  return unitSystem === 'imperial' ? 'lbs' : 'kg';
}

/**
 * Estimate a 1RM from a submaximal set.
 *
 * Epley: `1RM = weight × (1 + reps / 30)`. A single rep IS a direct 1RM, so we
 * bypass the formula and return the weight as-is (PRD §Calculator).
 *
 * `formula` is accepted (Epley default) purely to keep the signature stable for
 * future Brzycki/Lombardi support — only Epley is implemented in MVP.
 */
export function estimateOneRm(
  weight: number,
  reps: number,
  formula: Formula = 'epley',
): number {
  if (reps <= 1) return weight;
  switch (formula) {
    case 'epley':
    default:
      return weight * (1 + reps / 30);
  }
}

/**
 * Convert a weight between units. Same-unit is a no-op (returns input exactly).
 * Conversion happens at display time only — stored values are never mutated.
 */
export function convert(weight: number, from: Unit, to: Unit): number {
  if (from === to) return weight;
  return from === 'kg' ? weight * LBS_PER_KG : weight / LBS_PER_KG;
}

/** Snap a weight to the nearest rounding increment (e.g. 2.5 lbs or 1 kg). */
export function roundToIncrement(weight: number, increment: number): number {
  if (increment <= 0) return weight;
  return Math.round(weight / increment) * increment;
}

export type PercentageRow = {
  /** Percentage of 1RM, e.g. 90. */
  pct: number;
  /** Exact loaded weight at this percentage, in `unit`. */
  exact: number;
  /** Exact weight snapped to the rounding increment. */
  rounded: number;
};

export type PercentageTableOptions = {
  /** Rounding increment for the Rounded column (2.5 / 1). */
  increment: number;
  /** Lowest percentage row (inclusive). PRD default: 35. */
  min?: number;
  /** Highest percentage row (inclusive). PRD default: 100. */
  max?: number;
  /** Step between rows. PRD default: 5. */
  step?: number;
};

/**
 * Build the percentage-loading table for a given 1RM. Pure function of one
 * number — rows from `min`% to `max`% in `step`% increments (PRD: 35→100 by 5).
 * Caller has already converted `oneRm` to the desired display unit.
 */
export function percentageRows(
  oneRm: number,
  { increment, min = 35, max = 100, step = 5 }: PercentageTableOptions,
): PercentageRow[] {
  const rows: PercentageRow[] = [];
  for (let pct = min; pct <= max; pct += step) {
    const exact = (oneRm * pct) / 100;
    rows.push({ pct, exact, rounded: roundToIncrement(exact, increment) });
  }
  return rows;
}

/**
 * UUID generator. Hermes (RN 0.85) and Node 18+ both expose
 * `crypto.randomUUID()`; fall back to a non-crypto id only if absent.
 */
export function genId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
