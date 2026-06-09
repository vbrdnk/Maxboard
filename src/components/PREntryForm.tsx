import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
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
import type { Unit, UnitSystem } from '@/lib/types';

export type PRFormResult = {
  weight: number;
  unit: Unit;
  date: string; // ISO
  notes?: string;
};

/** Format an ISO date for display (locale short date). */
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

/**
 * Log-a-PR form, presented as a slide-up modal sheet (PRD §Log New PR).
 * Weight (numeric) → unit toggle (defaults to global) → date (defaults today) →
 * optional notes → Save. Speed-first: ≤3 taps to log (open → type → save).
 */
export function PREntryForm({
  visible,
  unitSystem,
  onSave,
  onClose,
}: {
  visible: boolean;
  unitSystem: UnitSystem;
  onSave: (result: PRFormResult) => void;
  onClose: () => void;
}) {
  const defaultUnit: Unit = unitSystem === 'imperial' ? 'lbs' : 'kg';

  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<Unit>(defaultUnit);
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  function reset() {
    setWeight('');
    setUnit(defaultUnit);
    setDate(new Date());
    setNotes('');
    setShowPicker(Platform.OS === 'ios');
  }

  function close() {
    reset();
    onClose();
  }

  const parsed = parseFloat(weight);
  const valid = Number.isFinite(parsed) && parsed > 0;

  function handleSave() {
    if (!valid) return;
    onSave({
      weight: parsed,
      unit,
      date: date.toISOString(),
      notes: notes.trim() || undefined,
    });
    reset();
  }

  function onDateChange(_e: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) setDate(selected);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>LOG NEW PR</Text>

        <Text style={styles.label}>WEIGHT</Text>
        <View style={styles.weightRow}>
          <TextInput
            style={styles.weightInput}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={Colors.textFaint}
            autoFocus
            accessibilityLabel="Weight"
          />
          <UnitToggle value={unit} onChange={setUnit} />
        </View>

        <Text style={styles.label}>DATE</Text>
        {Platform.OS === 'android' && (
          <Pressable
            style={styles.dateButton}
            onPress={() => setShowPicker(true)}
            accessibilityLabel={`Date, ${fmtDate(date.toISOString())}`}
          >
            <Text style={styles.dateText}>{fmtDate(date.toISOString())}</Text>
          </Pressable>
        )}
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            maximumDate={new Date()}
            onChange={onDateChange}
            themeVariant="dark"
            display={Platform.OS === 'ios' ? 'compact' : 'default'}
          />
        )}

        <Text style={styles.label}>NOTES (OPTIONAL)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="felt easy, ugly grind…"
          placeholderTextColor={Colors.textFaint}
          accessibilityLabel="Notes"
        />

        <Pressable
          style={[styles.save, !valid && styles.saveDisabled]}
          onPress={handleSave}
          disabled={!valid}
          accessibilityRole="button"
          accessibilityLabel="Save PR"
        >
          <Text style={styles.saveText}>SAVE</Text>
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
    fontSize: FontSize.hero,
    fontWeight: '700',
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  dateButton: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    minHeight: MinTapTarget,
  },
  dateText: { color: Colors.text, fontFamily: Fonts.mono, fontSize: FontSize.body },
  notesInput: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.body,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
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
