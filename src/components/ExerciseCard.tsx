import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';

import { PercentageTable } from '@/components/PercentageTable';
import {
  AccentBorderWidth,
  Colors,
  Fonts,
  FontSize,
  MinTapTarget,
  Radius,
  Spacing,
} from '@/constants/theme';
import { convert, displayUnitFor } from '@/lib/formulas';
import type { Exercise, PREntry, UnitSystem } from '@/lib/types';

type CardTab = 'percentages' | 'history';

/** Format a weight: drop the decimal when whole, else one place. */
function fmt(weight: number): string {
  return Number.isInteger(weight) ? String(weight) : weight.toFixed(1);
}

/**
 * Accordion exercise card (PRD §Lifts). Collapsed: name + dominant 1RM + entry
 * count + chevron. Expanded: PERCENTAGES / HISTORY underline tabs. The parent
 * owns which card is open (only one at a time), so `expanded`/`onToggle` are
 * controlled. The HISTORY tab body is injected by the parent (built in a later
 * pass) so this component stays presentational.
 */
export function ExerciseCard({
  exercise,
  oneRm,
  entryCount,
  unitSystem,
  expanded,
  onToggle,
  onLongPress,
  historyContent,
}: {
  exercise: Exercise;
  /** Heaviest logged entry, or null when none (shows "—"). */
  oneRm: PREntry | null;
  entryCount: number;
  unitSystem: UnitSystem;
  expanded: boolean;
  onToggle: () => void;
  /** Long-press the card header → hide action (PRD §Hiding / Showing). */
  onLongPress?: () => void;
  /** History-tab body, supplied by the parent (form + list). */
  historyContent?: React.ReactNode;
}) {
  const [tab, setTab] = useState<CardTab>('percentages');

  // The collapsed 1RM is shown in the user's current display unit. The entry is
  // stored in its own unit; convert at render time (stored value never mutated,
  // always from the original unit → idempotent). The HISTORY tab still shows each
  // entry as-entered, and PercentageTable converts the raw 1RM itself.
  const displayUnit = displayUnitFor(unitSystem);
  const oneRmDisplay = oneRm ? convert(oneRm.weight, oneRm.unit, displayUnit) : null;

  return (
    <Animated.View style={styles.card} layout={LinearTransition}>
      <Pressable
        style={styles.header}
        onPress={onToggle}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${exercise.name}, ${
          oneRmDisplay !== null ? `${fmt(oneRmDisplay)} ${displayUnit}` : 'no data'
        }, ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}`}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{exercise.name.toUpperCase()}</Text>
          {oneRmDisplay !== null ? (
            <Text style={styles.oneRm}>
              {fmt(oneRmDisplay)}
              <Text style={styles.unit}> {displayUnit}</Text>
            </Text>
          ) : (
            <Text style={styles.empty}>—</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.count}>
            {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
          </Text>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </Pressable>

      {expanded && (
        <Animated.View
          style={styles.body}
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
        >
          <View style={styles.tabs}>
            {(['percentages', 'history'] as const).map((t) => {
              const active = t === tab;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  style={[styles.tab, active && styles.tabActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {t.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {tab === 'percentages' ? (
            oneRm ? (
              <PercentageTable
                oneRm={oneRm.weight}
                oneRmUnit={oneRm.unit}
                unitSystem={unitSystem}
              />
            ) : (
              <Text style={styles.placeholder}>
                Log a PR to see your percentage table.
              </Text>
            )
          ) : (
            historyContent ?? <Text style={styles.placeholder}>No history yet.</Text>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderLeftWidth: AccentBorderWidth,
    borderLeftColor: Colors.accent,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    minHeight: MinTapTarget,
  },
  headerLeft: { flex: 1, gap: Spacing.xs },
  name: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: FontSize.label,
    fontWeight: '600',
    letterSpacing: 1,
  },
  oneRm: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.hero,
    fontWeight: '700',
  },
  unit: { color: Colors.textMuted, fontSize: FontSize.title, fontWeight: '600' },
  empty: {
    color: Colors.textFaint,
    fontFamily: Fonts.mono,
    fontSize: FontSize.hero,
    fontWeight: '700',
  },
  headerRight: { alignItems: 'flex-end', gap: Spacing.sm },
  count: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: FontSize.footnote,
  },
  chevron: { color: Colors.accent, fontSize: FontSize.body },
  body: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  tab: { paddingVertical: Spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.accent },
  tabLabel: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: FontSize.label,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tabLabelActive: { color: Colors.text },
  placeholder: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: FontSize.body,
    paddingVertical: Spacing.lg,
  },
});
