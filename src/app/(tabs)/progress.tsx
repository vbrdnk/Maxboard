import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CartesianChart, Line } from 'victory-native';

import {
  Colors,
  ContentMaxWidth,
  Fonts,
  FontSize,
  MinTapTarget,
  Radius,
  Spacing,
} from '@/constants/theme';
import { displayUnitFor } from '@/lib/formulas';
import { progressSeries, useStore } from '@/lib/storage';

function fmt(weight: number): string {
  return Number.isInteger(weight) ? String(weight) : weight.toFixed(1);
}

function fmtDate(t: number): string {
  return new Date(t).toLocaleDateString();
}

export default function ProgressScreen() {
  const exercises = useStore((s) => s.exercises);
  const entries = useStore((s) => s.entries);
  const settings = useStore((s) => s.settings);

  const unitSystem = settings?.unitSystem ?? 'imperial';
  const unit = displayUnitFor(unitSystem);

  const series = useMemo(
    () => progressSeries(exercises, entries, unit),
    [exercises, entries, unit],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);

  // Default selection: first series with data once it exists.
  const selected =
    series.find((s) => s.exercise.id === selectedId) ?? series[0] ?? null;

  if (series.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>PROGRESS</Text>
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.empty}>
            Log at least 2 PRs for an exercise to see its trend.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>PROGRESS</Text>

        {/* Legend / selector — tap an exercise to isolate its trend. */}
        <View style={styles.legend}>
          {series.map((s) => {
            const active = selected?.exercise.id === s.exercise.id;
            return (
              <Pressable
                key={s.exercise.id}
                style={[styles.legendChip, active && styles.legendChipActive]}
                onPress={() => setSelectedId(s.exercise.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={s.exercise.name}
              >
                <Text style={[styles.legendText, active && styles.legendTextActive]}>
                  {s.exercise.name.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selected && (
          <>
            <View style={styles.chartCard}>
              {showTable ? (
                <View style={styles.table}>
                  {selected.points
                    .slice()
                    .reverse()
                    .map((p, i) => (
                      <View key={`${p.t}-${i}`} style={styles.tableRow}>
                        <Text style={styles.tableDate}>{fmtDate(p.t)}</Text>
                        <Text style={styles.tableWeight}>
                          {fmt(p.weight)} {unit}
                        </Text>
                      </View>
                    ))}
                </View>
              ) : (
                <View style={styles.chart}>
                  <CartesianChart
                    data={selected.points}
                    xKey="t"
                    yKeys={['weight']}
                    domainPadding={{ top: 24, bottom: 24, left: 12, right: 12 }}
                  >
                    {({ points }) => (
                      <Line
                        points={points.weight}
                        color={Colors.accent}
                        strokeWidth={3}
                        animate={{ type: 'timing', duration: 300 }}
                      />
                    )}
                  </CartesianChart>
                </View>
              )}

              <Pressable
                style={styles.toggleTable}
                onPress={() => setShowTable((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={showTable ? 'Show chart' : 'Show data table'}
              >
                <Text style={styles.toggleTableText}>
                  {showTable ? 'SHOW CHART' : 'SHOW DATA TABLE'}
                </Text>
              </Pressable>
            </View>

            {/* Summary stats (PRD §Single exercise view). */}
            <View style={styles.stats}>
              <Stat label="CURRENT 1RM" value={`${fmt(selected.current)} ${unit}`} accent />
              <Stat label="ALL-TIME PR" value={`${fmt(selected.allTimePR)} ${unit}`} />
              <Stat
                label="TOTAL GAIN"
                value={`${selected.totalGain >= 0 ? '+' : ''}${fmt(selected.totalGain)} ${unit}`}
              />
              <Stat label="PRS LOGGED" value={String(selected.prCount)} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.statBox} accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
    width: '100%',
    maxWidth: ContentMaxWidth,
    alignSelf: 'center',
  },
  title: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.hero,
    fontWeight: '700',
    letterSpacing: 2,
  },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  empty: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: FontSize.body,
    textAlign: 'center',
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  legendChip: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  legendChipActive: { borderColor: Colors.accent },
  legendText: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: FontSize.footnote,
    fontWeight: '700',
    letterSpacing: 1,
  },
  legendTextActive: { color: Colors.accent },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  chart: { height: 260 },
  table: { gap: Spacing.xs, paddingVertical: Spacing.sm },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  tableDate: { color: Colors.textMuted, fontFamily: Fonts.mono, fontSize: FontSize.body },
  tableWeight: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
  toggleTable: { alignSelf: 'flex-end', padding: Spacing.sm },
  toggleTableText: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: FontSize.footnote,
    fontWeight: '700',
    letterSpacing: 1,
  },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statBox: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    minHeight: MinTapTarget,
  },
  statLabel: {
    color: Colors.textFaint,
    fontFamily: Fonts.mono,
    fontSize: FontSize.footnote,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statValue: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.title,
    fontWeight: '700',
  },
  statValueAccent: { color: Colors.accent },
});
