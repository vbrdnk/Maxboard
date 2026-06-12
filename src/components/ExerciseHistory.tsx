import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { PREntryForm, type PRFormResult } from '@/components/PREntryForm';
import {
  Colors,
  Fonts,
  FontSize,
  MinTapTarget,
  Radius,
  Spacing,
} from '@/constants/theme';
import { entriesFor, useStore } from '@/lib/storage';
import type { PREntry, UnitSystem } from '@/lib/types';

function fmt(weight: number): string {
  return Number.isInteger(weight) ? String(weight) : weight.toFixed(1);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

/**
 * HISTORY tab body for an expanded exercise card (PRD §History tab). Chronological
 * entries (newest first), each with weight/date/source badge/notes; swipe-to-delete
 * with confirmation. A sticky "Log New PR" button opens the entry form. State
 * mutations go through the store (addEntry/deleteEntry) — this component is wiring.
 */
export function ExerciseHistory({
  exerciseId,
  unitSystem,
}: {
  exerciseId: string;
  unitSystem: UnitSystem;
}) {
  const entries = useStore((s) => s.entries);
  const addEntry = useStore((s) => s.addEntry);
  const deleteEntry = useStore((s) => s.deleteEntry);

  const [formOpen, setFormOpen] = useState(false);

  const mine = entriesFor(entries, exerciseId);

  function confirmDelete(entry: PREntry) {
    Alert.alert('Delete entry?', `${fmt(entry.weight)} ${entry.unit} · ${fmtDate(entry.date)}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(entry.id) },
    ]);
  }

  function handleSave(result: PRFormResult) {
    addEntry({
      exerciseId,
      weight: result.weight,
      unit: result.unit,
      date: result.date,
      notes: result.notes,
      source: 'direct',
    });
    // Logging a PR is the app's reward moment — confirm it with a success tap.
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFormOpen(false);
  }

  return (
    <View style={styles.container}>
      {mine.length === 0 ? (
        <Text style={styles.empty}>No PRs logged yet.</Text>
      ) : (
        mine.map((entry) => (
          <Swipeable
            key={entry.id}
            renderRightActions={() => (
              <Pressable
                style={styles.deleteAction}
                onPress={() => confirmDelete(entry)}
                accessibilityLabel="Delete entry"
              >
                <Text style={styles.deleteText}>DELETE</Text>
              </Pressable>
            )}
          >
            <View style={styles.entry}>
              <View style={styles.entryMain}>
                <Text style={styles.entryWeight}>
                  {fmt(entry.weight)} {entry.unit}
                </Text>
                <View
                  style={[
                    styles.badge,
                    entry.source === 'estimated' ? styles.badgeEst : styles.badgeDirect,
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {entry.source === 'estimated' ? 'ESTIMATED' : 'TESTED'}
                  </Text>
                </View>
              </View>
              <Text style={styles.entryDate}>{fmtDate(entry.date)}</Text>
              {entry.notes ? <Text style={styles.entryNotes}>{entry.notes}</Text> : null}
            </View>
          </Swipeable>
        ))
      )}

      <Pressable
        style={styles.logButton}
        onPress={() => setFormOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Log new PR"
      >
        <Text style={styles.logButtonText}>+ LOG NEW PR</Text>
      </Pressable>

      <PREntryForm
        visible={formOpen}
        unitSystem={unitSystem}
        onSave={handleSave}
        onClose={() => setFormOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  empty: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: FontSize.body,
    paddingVertical: Spacing.md,
  },
  entry: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  entryMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryWeight: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.title,
    fontWeight: '700',
  },
  badge: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeDirect: { backgroundColor: Colors.border },
  badgeEst: { backgroundColor: '#2a3000' },
  badgeText: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  entryDate: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: FontSize.footnote,
  },
  entryNotes: {
    color: Colors.textFaint,
    fontFamily: Fonts.mono,
    fontSize: FontSize.footnote,
    fontStyle: 'italic',
  },
  deleteAction: {
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 96,
    borderRadius: Radius.sm,
    marginLeft: Spacing.sm,
  },
  deleteText: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.label,
    fontWeight: '700',
    letterSpacing: 1,
  },
  logButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MinTapTarget,
    marginTop: Spacing.sm,
  },
  logButtonText: {
    color: Colors.bg,
    fontFamily: Fonts.mono,
    fontSize: FontSize.body,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
