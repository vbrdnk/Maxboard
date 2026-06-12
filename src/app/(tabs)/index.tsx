import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddExerciseForm } from '@/components/AddExerciseForm';
import { ExerciseCard } from '@/components/ExerciseCard';
import { ExerciseHistory } from '@/components/ExerciseHistory';
import {
  Colors,
  ContentMaxWidth,
  Fonts,
  FontSize,
  MinTapTarget,
  Spacing,
} from '@/constants/theme';
import {
  currentOneRm,
  entriesFor,
  useStore,
  visibleExercisesSorted,
} from '@/lib/storage';
import type { Exercise } from '@/lib/types';

export default function LiftsScreen() {
  const exercises = useStore((s) => s.exercises);
  const entries = useStore((s) => s.entries);
  const settings = useStore((s) => s.settings);

  const hideExercise = useStore((s) => s.hideExercise);

  const [openId, setOpenId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const visible = useMemo(
    () => visibleExercisesSorted(exercises, entries),
    [exercises, entries],
  );

  // settings is guaranteed non-null here (onboarding gate runs in (tabs)/_layout).
  const unitSystem = settings?.unitSystem ?? 'imperial';

  function confirmHide(exercise: Exercise) {
    // Fire on the long-press itself (before the confirm dialog) — the touch-hold
    // is the moment the user expects to feel. No-ops on unsupported hardware.
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Hide exercise?', `"${exercise.name}" will be hidden. Its data is kept and you can unhide it from Settings.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Hide',
        onPress: () => {
          if (openId === exercise.id) setOpenId(null);
          hideExercise(exercise.id);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>MAXBOARD</Text>
          <Text style={styles.subtitle}>
            {visible.length} {visible.length === 1 ? 'LIFT' : 'LIFTS'} · TAP TO EXPAND
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.iconButton}
            onPress={() => setAddOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Add exercise"
          >
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              size={28}
              tintColor={Colors.accent}
              weight="bold"
            />
          </Pressable>
          <Pressable
            style={styles.iconButton}
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <SymbolView
              name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
              size={24}
              tintColor={Colors.textMuted}
            />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => (
          <ExerciseCard
            exercise={item}
            oneRm={currentOneRm(entries, item.id)}
            entryCount={entriesFor(entries, item.id).length}
            unitSystem={unitSystem}
            expanded={openId === item.id}
            onToggle={() => setOpenId((cur) => (cur === item.id ? null : item.id))}
            onLongPress={() => confirmHide(item)}
            historyContent={
              <ExerciseHistory exerciseId={item.id} unitSystem={unitSystem} />
            }
          />
        )}
      />

      <AddExerciseForm
        visible={addOpen}
        unitSystem={unitSystem}
        onClose={() => setAddOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    width: '100%',
    maxWidth: ContentMaxWidth,
    alignSelf: 'center',
  },
  headerText: { flex: 1, gap: Spacing.xs },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  iconButton: {
    width: MinTapTarget,
    height: MinTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.hero,
    fontWeight: '700',
    letterSpacing: 2,
  },
  subtitle: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: FontSize.footnote,
    letterSpacing: 1,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    width: '100%',
    maxWidth: ContentMaxWidth,
    alignSelf: 'center',
  },
  sep: { height: Spacing.md },
});
