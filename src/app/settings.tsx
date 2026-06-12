import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Colors,
  Fonts,
  FontSize,
  MinTapTarget,
  Radius,
  Spacing,
} from '@/constants/theme';
import { hiddenExercises, useStore } from '@/lib/storage';
import type { UnitSystem } from '@/lib/types';

/**
 * Settings screen, presented as a native iOS form sheet (registered in the root
 * Stack). The native sheet supplies the chrome — drag-to-dismiss, grabber,
 * rounded corners — so this file only renders the content: the global unit
 * system toggle and hidden-exercise management. Presets can be unhidden but
 * never deleted; the store enforces that, so Delete only shows for user lifts.
 */
export default function SettingsScreen() {
  const settings = useStore((s) => s.settings);
  const exercises = useStore((s) => s.exercises);
  const setUnitSystem = useStore((s) => s.setUnitSystem);
  const unhideExercise = useStore((s) => s.unhideExercise);
  const deleteExercise = useStore((s) => s.deleteExercise);

  const current = settings?.unitSystem ?? 'imperial';
  const hidden = hiddenExercises(exercises);

  function confirmDelete(id: string, name: string) {
    Alert.alert('Delete exercise?', `"${name}" and all its entries will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExercise(id) },
    ]);
  }

  return (
    <>
      <View style={styles.header} collapsable={false}>
        <Text style={styles.title}>SETTINGS</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>UNIT SYSTEM</Text>
        <View style={styles.unitRow}>
          {(
            [
              ['imperial', 'IMPERIAL (LBS)'],
              ['metric', 'METRIC (KG)'],
            ] as const
          ).map(([value, label]) => {
            const active = value === current;
            return (
              <Pressable
                key={value}
                style={[styles.unitCard, active && styles.unitCardActive]}
                onPress={() => setUnitSystem(value as UnitSystem)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.unitLabel, active && styles.unitLabelActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>MANAGE EXERCISES</Text>
        {hidden.length === 0 ? (
          <Text style={styles.empty}>No hidden exercises.</Text>
        ) : (
          hidden.map((ex) => (
            <View key={ex.id} style={styles.manageRow}>
              <Text style={styles.manageName}>{ex.name.toUpperCase()}</Text>
              <View style={styles.manageActions}>
                <Pressable
                  style={styles.unhideButton}
                  onPress={() => unhideExercise(ex.id)}
                  accessibilityLabel={`Unhide ${ex.name}`}
                >
                  <Text style={styles.unhideText}>UNHIDE</Text>
                </Pressable>
                {!ex.isPreset && (
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => confirmDelete(ex.id, ex.name)}
                    accessibilityLabel={`Delete ${ex.name}`}
                  >
                    <Text style={styles.deleteText}>DELETE</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  // FormSheet expects at most 2 content subviews (a pinned header + the
  // scroll view) — so the header and ScrollView are direct children, with no
  // wrapping flex container, and the header is collapsable={false}.
  header: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    // Clear the native sheet's grabber so the title doesn't collide with it.
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.title,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scrollView: { flex: 1, backgroundColor: Colors.card },
  scroll: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  section: {
    color: Colors.textFaint,
    fontFamily: Fonts.mono,
    fontSize: FontSize.footnote,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  unitRow: { flexDirection: 'row', gap: Spacing.sm },
  unitCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: Spacing.md,
    alignItems: 'center',
    minHeight: MinTapTarget,
    justifyContent: 'center',
  },
  unitCardActive: { borderColor: Colors.accent },
  unitLabel: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: FontSize.label,
    fontWeight: '700',
    letterSpacing: 1,
  },
  unitLabelActive: { color: Colors.accent },
  empty: { color: Colors.textMuted, fontFamily: Fonts.mono, fontSize: FontSize.body },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  manageName: {
    flex: 1,
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.body,
    letterSpacing: 1,
  },
  manageActions: { flexDirection: 'row', gap: Spacing.sm },
  unhideButton: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  unhideText: {
    color: Colors.accent,
    fontFamily: Fonts.mono,
    fontSize: FontSize.footnote,
    fontWeight: '700',
    letterSpacing: 1,
  },
  deleteButton: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  deleteText: {
    color: Colors.danger,
    fontFamily: Fonts.mono,
    fontSize: FontSize.footnote,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
