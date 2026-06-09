import { buildPresetExercises, PRESET_EXERCISE_NAMES } from '@/lib/presets';
import {
  currentOneRm,
  progressSeries,
  useStore,
  visibleExercisesSorted,
} from '@/lib/storage';
import type { Exercise, PREntry } from '@/lib/types';

// jest-expo ships an AsyncStorage mock; reset the store between tests.
function reset() {
  useStore.setState({ settings: null, exercises: [], entries: [], hydrated: true });
}

beforeEach(reset);

describe('presets', () => {
  it('builds one Exercise per preset name (19), all preset + visible', () => {
    const presets = buildPresetExercises();
    expect(presets).toHaveLength(PRESET_EXERCISE_NAMES.length);
    expect(presets).toHaveLength(19); // 7 powerlifting + 7 olympic + 5 accessory
    expect(presets.every((e) => e.isPreset && !e.hidden)).toBe(true);
    expect(new Set(presets.map((e) => e.id)).size).toBe(19); // unique ids
  });
});

describe('completeOnboarding', () => {
  it('writes settings with the derived rounding increment and seeds presets', () => {
    useStore.getState().completeOnboarding('imperial');
    const { settings, exercises } = useStore.getState();
    expect(settings).toEqual({ unitSystem: 'imperial', roundingIncrement: 2.5 });
    expect(exercises).toHaveLength(19);
  });
});

describe('addExercise — duplicate-name guard', () => {
  it('rejects a case-insensitive duplicate, including hidden exercises', () => {
    useStore.getState().completeOnboarding('metric');
    // Hide "Back Squat" then try to re-add it with different casing.
    const backSquat = useStore.getState().exercises.find((e) => e.name === 'Back Squat')!;
    useStore.getState().hideExercise(backSquat.id);

    const id = useStore.getState().addExercise({ name: '  back squat ' });
    expect(id).toBeNull();
    expect(useStore.getState().exercises.filter((e) => /back squat/i.test(e.name))).toHaveLength(1);
  });

  it('creates a user exercise and logs an optional initial 1RM', () => {
    const id = useStore.getState().addExercise({ name: 'Zercher Squat', initial: { weight: 100, unit: 'kg' } });
    expect(id).not.toBeNull();
    const created = useStore.getState().exercises.find((e) => e.id === id)!;
    expect(created.isPreset).toBe(false);
    const entries = useStore.getState().entries.filter((e) => e.exerciseId === id);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ weight: 100, unit: 'kg', source: 'direct' });
  });
});

describe('deleteExercise — preset guard', () => {
  it('never deletes a preset exercise', () => {
    useStore.getState().completeOnboarding('imperial');
    const preset = useStore.getState().exercises[0];
    useStore.getState().deleteExercise(preset.id);
    expect(useStore.getState().exercises.find((e) => e.id === preset.id)).toBeDefined();
  });

  it('deletes a user exercise and its entries', () => {
    const id = useStore.getState().addExercise({ name: 'Custom', initial: { weight: 50, unit: 'lbs' } })!;
    useStore.getState().deleteExercise(id);
    expect(useStore.getState().exercises.find((e) => e.id === id)).toBeUndefined();
    expect(useStore.getState().entries.filter((e) => e.exerciseId === id)).toHaveLength(0);
  });
});

describe('currentOneRm', () => {
  const ex = 'x1';
  const entries: PREntry[] = [
    { id: 'a', exerciseId: ex, weight: 100, unit: 'kg', date: '2026-01-01', source: 'direct' },
    { id: 'b', exerciseId: ex, weight: 200, unit: 'lbs', date: '2026-02-01', source: 'direct' },
  ];

  it('returns null when no entries exist', () => {
    expect(currentOneRm([], ex)).toBeNull();
  });

  it('picks the heaviest after normalizing units (100kg ≈ 220lbs > 200lbs)', () => {
    expect(currentOneRm(entries, ex)?.id).toBe('a');
  });
});

describe('visibleExercisesSorted', () => {
  const mk = (id: string, sortOrder: number, hidden = false): Exercise => ({
    id,
    name: id,
    createdAt: '2026-01-01',
    sortOrder,
    isPreset: true,
    hidden,
  });

  it('excludes hidden exercises and respects sortOrder', () => {
    const exercises = [mk('b', 1), mk('a', 0), mk('h', 2, true)];
    const sorted = visibleExercisesSorted(exercises, []);
    expect(sorted.map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('puts exercises with data above empty ones at equal sortOrder', () => {
    const exercises = [mk('empty', 0), mk('hasData', 0)];
    const entries: PREntry[] = [
      { id: 'e1', exerciseId: 'hasData', weight: 100, unit: 'lbs', date: '2026-01-01', source: 'direct' },
    ];
    const sorted = visibleExercisesSorted(exercises, entries);
    expect(sorted.map((e) => e.id)).toEqual(['hasData', 'empty']);
  });
});

describe('progressSeries', () => {
  const ex = (id: string, hidden = false): Exercise => ({
    id,
    name: id,
    createdAt: '2026-01-01',
    sortOrder: 0,
    isPreset: false,
    hidden,
  });

  it('excludes exercises with fewer than 2 points and hidden ones', () => {
    const exercises = [ex('one'), ex('two'), ex('hid', true)];
    const entries: PREntry[] = [
      { id: '1', exerciseId: 'one', weight: 100, unit: 'lbs', date: '2026-01-01', source: 'direct' },
      { id: '2', exerciseId: 'two', weight: 100, unit: 'lbs', date: '2026-01-01', source: 'direct' },
      { id: '3', exerciseId: 'two', weight: 110, unit: 'lbs', date: '2026-02-01', source: 'direct' },
      { id: '4', exerciseId: 'hid', weight: 50, unit: 'lbs', date: '2026-01-01', source: 'direct' },
      { id: '5', exerciseId: 'hid', weight: 60, unit: 'lbs', date: '2026-02-01', source: 'direct' },
    ];
    const series = progressSeries(exercises, entries, 'lbs');
    expect(series.map((s) => s.exercise.id)).toEqual(['two']);
  });

  it('normalizes weights to the display unit and sorts points oldest-first', () => {
    const exercises = [ex('x')];
    const entries: PREntry[] = [
      { id: 'b', exerciseId: 'x', weight: 100, unit: 'kg', date: '2026-02-01', source: 'direct' },
      { id: 'a', exerciseId: 'x', weight: 200, unit: 'lbs', date: '2026-01-01', source: 'direct' },
    ];
    const [s] = progressSeries(exercises, entries, 'lbs');
    // oldest first: 200 lbs then 100 kg (~220.46 lbs)
    expect(s.points[0].weight).toBeCloseTo(200, 5);
    expect(s.points[1].weight).toBeCloseTo(220.462, 3);
    expect(s.current).toBeCloseTo(220.462, 3);
    expect(s.allTimePR).toBeCloseTo(220.462, 3);
    expect(s.totalGain).toBeCloseTo(20.462, 3);
    expect(s.prCount).toBe(2);
  });
});
