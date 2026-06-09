import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { UnitToggle } from '@/components/UnitToggle';
import { Colors, Fonts, FontSize, Spacing } from '@/constants/theme';
import {
  convert,
  percentageRows,
  roundingIncrementFor,
} from '@/lib/formulas';
import type { Unit, UnitSystem } from '@/lib/types';

/** Percentages rendered in the accent color — the heavy sets you care about. */
const ACCENT_PCTS = new Set([90, 95, 100]);

/** Format a weight: drop the decimal when whole, else one place. */
function fmt(weight: number): string {
  return Number.isInteger(weight) ? String(weight) : weight.toFixed(1);
}

/**
 * Percentage-loading table — pure function of one number, the 1RM (PRD §Lifts).
 * Three columns (% | WEIGHT | ROUNDED), rows 35→100% by 5. A local lbs/kg toggle
 * overrides the global unit for THIS view only and does not persist; the rounding
 * increment follows the displayed unit. 90/95/100% rows highlighted.
 *
 * `oneRm`/`oneRmUnit` describe the source 1RM as stored; the table converts to the
 * displayed unit at render time (stored values never mutated).
 */
export function PercentageTable({
  oneRm,
  oneRmUnit,
  unitSystem,
}: {
  oneRm: number;
  oneRmUnit: Unit;
  /** Global preference — seeds the initial toggle state. */
  unitSystem: UnitSystem;
}) {
  const [displayUnit, setDisplayUnit] = useState<Unit>(
    unitSystem === 'imperial' ? 'lbs' : 'kg',
  );

  const increment = displayUnit === 'lbs' ? 2.5 : 1;
  const oneRmDisplayed = convert(oneRm, oneRmUnit, displayUnit);
  const rows = percentageRows(oneRmDisplayed, { increment });

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.heading}>PERCENTAGES</Text>
        <UnitToggle value={displayUnit} onChange={setDisplayUnit} />
      </View>

      <View style={[styles.row, styles.headerRow]}>
        <Text style={[styles.cell, styles.colPct, styles.headerText]}>%</Text>
        <Text style={[styles.cell, styles.colWeight, styles.headerText]}>WEIGHT</Text>
        <Text style={[styles.cell, styles.colWeight, styles.headerText]}>ROUNDED</Text>
      </View>

      {rows.map((r, i) => {
        const accent = ACCENT_PCTS.has(r.pct);
        return (
          <View
            key={r.pct}
            style={[styles.row, i % 2 === 1 && styles.rowAlt]}
            accessibilityLabel={`${r.pct} percent, ${fmt(r.rounded)} ${displayUnit} rounded`}
          >
            <Text style={[styles.cell, styles.colPct, accent && styles.accentText]}>
              {r.pct}%
            </Text>
            <Text style={[styles.cell, styles.colWeight, accent && styles.accentText]}>
              {fmt(r.exact)}
            </Text>
            <Text
              style={[
                styles.cell,
                styles.colWeight,
                styles.rounded,
                accent && styles.accentText,
              ]}
            >
              {fmt(r.rounded)}
            </Text>
          </View>
        );
      })}

      <Text style={styles.footer}>
        Rounded to nearest {increment} {displayUnit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  heading: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: FontSize.label,
    fontWeight: '700',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  rowAlt: { backgroundColor: Colors.rowAlt },
  headerRow: { paddingVertical: Spacing.xs },
  cell: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.body,
  },
  headerText: {
    color: Colors.textFaint,
    fontSize: FontSize.footnote,
    fontWeight: '700',
    letterSpacing: 1,
  },
  colPct: { width: 56 },
  colWeight: { flex: 1, textAlign: 'right' },
  rounded: { fontWeight: '700' },
  accentText: { color: Colors.accent },
  footer: {
    color: Colors.textFaint,
    fontFamily: Fonts.mono,
    fontSize: FontSize.footnote,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
});
