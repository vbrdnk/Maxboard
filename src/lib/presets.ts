/**
 * Preset exercise list — written to storage on first launch (PRD §Pre-populated
 * Exercise List). All created with isPreset: true, hidden: false, no 1RM values.
 *
 * Preset exercises can be hidden but never permanently deleted.
 */

import { genId } from '@/lib/formulas';
import type { Exercise } from '@/lib/types';

/** Ordered preset names, grouped by intent in the PRD. Order = default sortOrder. */
export const PRESET_EXERCISE_NAMES: readonly string[] = [
  // Powerlifting / Strength
  'Back Squat',
  'Front Squat',
  'Deadlift',
  'Sumo Deadlift',
  'Bench Press',
  'Overhead Press (Strict Press)',
  'Floor Press',
  // Olympic Lifting
  'Clean & Jerk',
  'Power Clean & Jerk',
  'Snatch',
  'Power Snatch',
  'Power Clean',
  'Hang Clean',
  'Hang Snatch',
  // Accessory
  'Barbell Row',
  'Romanian Deadlift (RDL)',
  'Push Press',
  'Hip Thrust',
  'Pendlay Row',
] as const;

/**
 * Build the preset Exercise records with fresh uuids + a createdAt stamp. Called
 * once during onboarding — ids must be generated at runtime, not baked in.
 */
export function buildPresetExercises(now: string = new Date().toISOString()): Exercise[] {
  return PRESET_EXERCISE_NAMES.map((name, index) => ({
    id: genId(),
    name,
    createdAt: now,
    sortOrder: index,
    isPreset: true,
    hidden: false,
  }));
}
