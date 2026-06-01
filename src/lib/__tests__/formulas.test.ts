import {
  convert,
  displayUnitFor,
  estimateOneRm,
  LBS_PER_KG,
  percentageRows,
  roundingIncrementFor,
  roundToIncrement,
} from '@/lib/formulas';

describe('estimateOneRm (Epley)', () => {
  it('returns the weight as-is for a single rep (direct 1RM)', () => {
    expect(estimateOneRm(225, 1)).toBe(225);
  });

  it('returns the weight as-is for 0 reps (guard, treated as direct)', () => {
    expect(estimateOneRm(100, 0)).toBe(100);
  });

  it('applies weight × (1 + reps / 30) for multi-rep sets', () => {
    // 100 × (1 + 5/30) = 116.666…
    expect(estimateOneRm(100, 5)).toBeCloseTo(116.6667, 4);
    // 225 × (1 + 3/30) = 247.5
    expect(estimateOneRm(225, 3)).toBeCloseTo(247.5, 4);
  });

  it('defaults to Epley when no formula is passed', () => {
    expect(estimateOneRm(100, 10)).toBe(estimateOneRm(100, 10, 'epley'));
  });
});

describe('convert', () => {
  it('is a no-op for the same unit (returns input exactly)', () => {
    expect(convert(225, 'lbs', 'lbs')).toBe(225);
    expect(convert(100, 'kg', 'kg')).toBe(100);
  });

  it('converts kg → lbs with the exact factor', () => {
    expect(convert(100, 'kg', 'lbs')).toBeCloseTo(220.462, 3);
  });

  it('converts lbs → kg with the exact factor', () => {
    expect(convert(220.462, 'lbs', 'kg')).toBeCloseTo(100, 3);
  });

  it('round-trips within tolerance', () => {
    const back = convert(convert(142.5, 'kg', 'lbs'), 'lbs', 'kg');
    expect(back).toBeCloseTo(142.5, 6);
  });

  it('uses the documented 1 kg = 2.20462 lbs constant', () => {
    expect(LBS_PER_KG).toBe(2.20462);
  });
});

describe('roundToIncrement', () => {
  it('snaps to the nearest 2.5 lbs', () => {
    expect(roundToIncrement(183.7, 2.5)).toBe(182.5);
    expect(roundToIncrement(184.0, 2.5)).toBe(185);
  });

  it('snaps to the nearest 1 kg', () => {
    expect(roundToIncrement(83.4, 1)).toBe(83);
    expect(roundToIncrement(83.6, 1)).toBe(84);
  });

  it('returns the weight unchanged for a non-positive increment', () => {
    expect(roundToIncrement(123.4, 0)).toBe(123.4);
  });
});

describe('unit-system helpers', () => {
  it('derives the rounding increment', () => {
    expect(roundingIncrementFor('imperial')).toBe(2.5);
    expect(roundingIncrementFor('metric')).toBe(1);
  });

  it('derives the display unit', () => {
    expect(displayUnitFor('imperial')).toBe('lbs');
    expect(displayUnitFor('metric')).toBe('kg');
  });
});

describe('percentageRows', () => {
  it('produces 35%→100% in 5% steps by default (14 rows)', () => {
    const rows = percentageRows(100, { increment: 2.5 });
    expect(rows).toHaveLength(14);
    expect(rows[0].pct).toBe(35);
    expect(rows[rows.length - 1].pct).toBe(100);
  });

  it('computes exact and rounded columns for a 1RM of 225 (imperial)', () => {
    const rows = percentageRows(225, { increment: 2.5 });
    const ninety = rows.find((r) => r.pct === 90)!;
    expect(ninety.exact).toBeCloseTo(202.5, 4);
    expect(ninety.rounded).toBe(202.5);

    const ninetyFive = rows.find((r) => r.pct === 95)!;
    expect(ninetyFive.exact).toBeCloseTo(213.75, 4);
    expect(ninetyFive.rounded).toBe(215); // 213.75 snaps up to nearest 2.5
  });

  it('is a pure snapshot at a known 1RM (100, metric increment)', () => {
    expect(percentageRows(100, { increment: 1 })).toMatchSnapshot();
  });

  it('respects custom min/max/step', () => {
    const rows = percentageRows(200, { increment: 2.5, min: 50, max: 60, step: 10 });
    expect(rows.map((r) => r.pct)).toEqual([50, 60]);
  });
});
