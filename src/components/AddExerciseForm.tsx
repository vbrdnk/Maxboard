import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { UnitToggle } from '@/components/UnitToggle';
import {
  Colors,
  ContentMaxWidth,
  Fonts,
  FontSize,
  MinTapTarget,
  Radius,
  Spacing,
} from '@/constants/theme';
import { useStore } from '@/lib/storage';
import type { Unit, UnitSystem } from '@/lib/types';

/**
 * Add-a-custom-exercise modal (PRD §Adding a Custom Exercise). Name (required)
 * plus an optional initial 1RM. Created via the store's addExercise, which owns
 * the case-insensitive duplicate guard (including hidden exercises); a null
 * return surfaces a "name already exists" message inline.
 */
export function AddExerciseForm({
  visible,
  unitSystem,
  onClose,
}: {
  visible: boolean;
  unitSystem: UnitSystem;
  onClose: () => void;
}) {
  const addExercise = useStore((s) => s.addExercise);
  const defaultUnit: Unit = unitSystem === 'imperial' ? 'lbs' : 'kg';

  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<Unit>(defaultUnit);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName('');
    setWeight('');
    setUnit(defaultUnit);
    setError(null);
  }

  function close() {
    reset();
    onClose();
  }

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;

    const parsed = parseFloat(weight);
    const hasInitial = Number.isFinite(parsed) && parsed > 0;

    const id = addExercise({
      name: trimmed,
      initial: hasInitial ? { weight: parsed, unit } : undefined,
    });

    if (!id) {
      setError('An exercise with that name already exists.');
      return;
    }
    close();
  }

  const canSave = name.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>NEW EXERCISE</Text>
          <Text style={styles.hint}>Add a lift to track your 1RM for.</Text>

        <Text style={styles.label}>NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(t) => {
            setName(t);
            if (error) setError(null);
          }}
          placeholder="e.g. Zercher Squat"
          placeholderTextColor={Colors.textFaint}
          accessibilityLabel="Exercise name"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>INITIAL 1RM (OPTIONAL)</Text>
        <View style={styles.weightRow}>
          <TextInput
            style={styles.weightInput}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={Colors.textFaint}
            accessibilityLabel="Initial one rep max"
          />
          <UnitToggle value={unit} onChange={setUnit} />
        </View>

        <Pressable
          style={[styles.save, !canSave && styles.saveDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          accessibilityRole="button"
          accessibilityLabel="Create exercise"
        >
          <Text style={styles.saveText}>CREATE</Text>
        </Pressable>
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
    gap: Spacing.sm,
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
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.title,
    fontWeight: '700',
    letterSpacing: 1,
  },
  hint: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: FontSize.footnote,
    marginBottom: Spacing.sm,
  },
  label: {
    color: Colors.textFaint,
    fontFamily: Fonts.mono,
    fontSize: FontSize.footnote,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: Spacing.sm,
  },
  input: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.body,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    minHeight: MinTapTarget,
  },
  error: { color: Colors.danger, fontFamily: Fonts.mono, fontSize: FontSize.footnote },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  weightInput: {
    flex: 1,
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.title,
    fontWeight: '700',
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    minHeight: MinTapTarget,
  },
  save: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MinTapTarget,
    marginTop: Spacing.lg,
  },
  saveDisabled: { opacity: 0.4 },
  saveText: {
    color: Colors.bg,
    fontFamily: Fonts.mono,
    fontSize: FontSize.title,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
