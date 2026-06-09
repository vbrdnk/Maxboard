import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.header}
        onPress={onToggle}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${exercise.name}, ${
          oneRm ? `${fmt(oneRm.weight)} ${oneRm.unit}` : 'no data'
        }, ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}`}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{exercise.name.toUpperCase()}</Text>
          {oneRm ? (
            <Text style={styles.oneRm}>
              {fmt(oneRm.weight)}
              <Text style={styles.unit}> {oneRm.unit}</Text>
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
        <View style={styles.body}>
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
        </View>
      )}
    </View>
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
