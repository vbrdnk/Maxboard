import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, FontSize, Radius } from '@/constants/theme';
import type { Unit } from '@/lib/types';

/**
 * lbs / kg pill toggle. Controlled — the caller owns the value. Used by the
 * percentage table (local display override), the PR form, and the calculator.
 */
export function UnitToggle({
  value,
  onChange,
}: {
  value: Unit;
  onChange: (unit: Unit) => void;
}) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {(['lbs', 'kg'] as const).map((unit) => {
        const active = unit === value;
        return (
          <Pressable
            key={unit}
            onPress={() => onChange(unit)}
            style={[styles.pill, active && styles.pillActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={unit}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{unit}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    padding: 2,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm - 1,
    minWidth: 40,
    alignItems: 'center',
  },
  pillActive: { backgroundColor: Colors.accent },
  label: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: FontSize.label,
    fontWeight: '600',
  },
  labelActive: { color: Colors.bg },
});
