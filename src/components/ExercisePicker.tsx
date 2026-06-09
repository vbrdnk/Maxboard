import { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  Colors,
  ContentMaxWidth,
  Fonts,
  FontSize,
  MinTapTarget,
  Radius,
  Spacing,
} from '@/constants/theme';
import { useStore, visibleExercisesSorted } from '@/lib/storage';

/**
 * Modal exercise picker (PRD §Calculator "Save as PR"). Lists existing visible
 * exercises and lets the user create a new one inline. Returns the chosen
 * exercise id via `onPick`. New-exercise creation goes through the store's
 * addExercise (duplicate-name guard lives there).
 */
export function ExercisePicker({
  visible,
  onPick,
  onClose,
}: {
  visible: boolean;
  onPick: (exerciseId: string) => void;
  onClose: () => void;
}) {
  const exercises = useStore((s) => s.exercises);
  const entries = useStore((s) => s.entries);
  const addExercise = useStore((s) => s.addExercise);

  const [newName, setNewName] = useState('');

  const list = useMemo(
    () => visibleExercisesSorted(exercises, entries),
    [exercises, entries],
  );

  function handleAddNew() {
    const name = newName.trim();
    if (!name) return;
    const id = addExercise({ name });
    if (id) {
      setNewName('');
      onPick(id);
    }
    // null = duplicate; leave the field so the user can adjust.
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>SAVE TO EXERCISE</Text>

        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            value={newName}
            onChangeText={setNewName}
            placeholder="New exercise name…"
            placeholderTextColor={Colors.textFaint}
            accessibilityLabel="New exercise name"
          />
          <Pressable
            style={[styles.addButton, !newName.trim() && styles.addButtonDisabled]}
            onPress={handleAddNew}
            disabled={!newName.trim()}
            accessibilityLabel="Create and select new exercise"
          >
            <Text style={styles.addButtonText}>ADD</Text>
          </Pressable>
        </View>

        <FlatList
          data={list}
          keyExtractor={(e) => e.id}
          style={styles.scroll}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => onPick(item.id)}
              accessibilityRole="button"
              accessibilityLabel={item.name}
            >
              <Text style={styles.rowText}>{item.name.toUpperCase()}</Text>
            </Pressable>
          )}
        />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.md,
    borderTopRightRadius: Radius.md,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: '75%',
    gap: Spacing.md,
    width: '100%',
    maxWidth: ContentMaxWidth,
    alignSelf: 'center',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  title: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.title,
    fontWeight: '700',
    letterSpacing: 1,
  },
  addRow: { flexDirection: 'row', gap: Spacing.sm },
  addInput: {
    flex: 1,
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.body,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    minHeight: MinTapTarget,
  },
  addButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MinTapTarget,
  },
  addButtonDisabled: { opacity: 0.4 },
  addButtonText: {
    color: Colors.bg,
    fontFamily: Fonts.mono,
    fontSize: FontSize.label,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scroll: { flexGrow: 0 },
  row: { paddingVertical: Spacing.md, minHeight: MinTapTarget, justifyContent: 'center' },
  rowText: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.body,
    letterSpacing: 1,
  },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
});
