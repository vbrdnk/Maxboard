import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExercisePicker } from '@/components/ExercisePicker';
import { PercentageTable } from '@/components/PercentageTable';
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
import { estimateOneRm } from '@/lib/formulas';
import { useStore } from '@/lib/storage';
import type { Unit } from '@/lib/types';

const MIN_REPS = 2;
const MAX_REPS = 15;

function fmt(weight: number): string {
  return Number.isInteger(weight) ? String(weight) : weight.toFixed(1);
}

export default function CalculatorScreen() {
  const settings = useStore((s) => s.settings);
  const addEntry = useStore((s) => s.addEntry);
  const unitSystem = settings?.unitSystem ?? 'imperial';
  const defaultUnit: Unit = unitSystem === 'imperial' ? 'lbs' : 'kg';

  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<Unit>(defaultUnit);
  const [reps, setReps] = useState(5);
  const [pickerOpen, setPickerOpen] = useState(false);

  const parsed = parseFloat(weight);
  const valid = Number.isFinite(parsed) && parsed > 0;
  const estimate = valid ? estimateOneRm(parsed, reps) : 0;

  function handlePick(exerciseId: string) {
    addEntry({
      exerciseId,
      weight: Math.round(estimate * 10) / 10,
      unit,
      date: new Date().toISOString(),
      source: 'estimated',
      estimatedFrom: { reps, weight: parsed, unit },
    });
    setPickerOpen(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>CALCULATOR</Text>
        <Text style={styles.subtitle}>EPLEY 1RM ESTIMATE</Text>

        <Text style={styles.label}>WEIGHT LIFTED</Text>
        <View style={styles.weightRow}>
          <TextInput
            style={styles.weightInput}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={Colors.textFaint}
            accessibilityLabel="Weight lifted"
          />
          <UnitToggle value={unit} onChange={setUnit} />
        </View>

        <Text style={styles.label}>REPS PERFORMED</Text>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepButton}
            onPress={() => setReps((r) => Math.max(MIN_REPS, r - 1))}
            disabled={reps <= MIN_REPS}
            accessibilityLabel="Decrease reps"
          >
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.repsValue} accessibilityLabel={`${reps} reps`}>
            {reps}
          </Text>
          <Pressable
            style={styles.stepButton}
            onPress={() => setReps((r) => Math.min(MAX_REPS, r + 1))}
            disabled={reps >= MAX_REPS}
            accessibilityLabel="Increase reps"
          >
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>

        <View style={styles.estimateBox}>
          <Text style={styles.estimateLabel}>
            {reps <= 1 ? 'DIRECT 1RM' : 'ESTIMATED 1RM'}
          </Text>
          <Text style={styles.estimateValue}>
            {valid ? fmt(Math.round(estimate * 10) / 10) : '—'}
            <Text style={styles.estimateUnit}> {unit}</Text>
          </Text>
          {reps > 10 && (
            <Text style={styles.disclaimer}>
              Estimates above 10 reps are less reliable.
            </Text>
          )}
        </View>

        <Pressable
          style={[styles.saveButton, !valid && styles.saveDisabled]}
          onPress={() => setPickerOpen(true)}
          disabled={!valid}
          accessibilityRole="button"
          accessibilityLabel="Save as PR"
        >
          <Text style={styles.saveText}>SAVE AS PR</Text>
        </Pressable>

        {valid && (
          <View style={styles.tableWrap}>
            <PercentageTable oneRm={estimate} oneRmUnit={unit} unitSystem={unitSystem} />
          </View>
        )}
      </ScrollView>

      <ExercisePicker
        visible={pickerOpen}
        onPick={handlePick}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
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
  subtitle: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: FontSize.footnote,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  label: {
    color: Colors.textFaint,
    fontFamily: Fonts.mono,
    fontSize: FontSize.footnote,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: Spacing.md,
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
  },
  stepButton: {
    width: MinTapTarget + 8,
    height: MinTapTarget + 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { color: Colors.accent, fontFamily: Fonts.mono, fontSize: 28, fontWeight: '700' },
  repsValue: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.title,
    fontWeight: '700',
  },
  estimateBox: {
    backgroundColor: Colors.card,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  estimateLabel: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: FontSize.footnote,
    fontWeight: '700',
    letterSpacing: 1,
  },
  estimateValue: {
    color: Colors.accent,
    fontFamily: Fonts.mono,
    fontSize: FontSize.hero,
    fontWeight: '700',
  },
  estimateUnit: { color: Colors.textMuted, fontSize: FontSize.title, fontWeight: '600' },
  disclaimer: {
    color: Colors.textFaint,
    fontFamily: Fonts.mono,
    fontSize: FontSize.footnote,
    fontStyle: 'italic',
  },
  saveButton: {
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
  tableWrap: { marginTop: Spacing.xl },
});
