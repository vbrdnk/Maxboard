import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccentBorderWidth, Colors, Fonts, FontSize, MinTapTarget, Radius, Spacing } from '@/constants/theme';
import { useStore } from '@/lib/storage';
import type { UnitSystem } from '@/lib/types';

/**
 * First-launch onboarding (PRD §First Launch). One-time gate: pick a unit
 * system, which writes UserSettings + seeds preset exercises, then drop into the
 * Lifts screen. Reachable only while settings === null (see (tabs)/_layout gate).
 */
export default function Onboarding() {
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  const choose = (unitSystem: UnitSystem) => {
    completeOnboarding(unitSystem);
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title}>MAXBOARD</Text>
          <Text style={styles.subtitle}>Pick your unit system to get started</Text>
        </View>

        <View style={styles.cards}>
          <UnitCard
            label="Imperial"
            sub="pounds (lbs)"
            onPress={() => choose('imperial')}
          />
          <UnitCard
            label="Metric"
            sub="kilograms (kg)"
            onPress={() => choose('metric')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function UnitCard({ label, sub, onPress }: { label: string; sub: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} — ${sub}`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <Text style={styles.cardLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.cardSub}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  body: { flex: 1, padding: Spacing.xl, justifyContent: 'center', gap: Spacing.xxl },
  header: { gap: Spacing.sm, alignItems: 'center' },
  title: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.hero,
    fontWeight: '800',
    letterSpacing: 2,
  },
  subtitle: { color: Colors.textMuted, fontFamily: Fonts.mono, fontSize: FontSize.body },
  cards: { gap: Spacing.lg },
  card: {
    minHeight: MinTapTarget * 2,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderLeftWidth: AccentBorderWidth,
    borderLeftColor: Colors.accent,
    padding: Spacing.xl,
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  cardPressed: { backgroundColor: Colors.surface },
  cardLabel: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.title,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardSub: { color: Colors.textMuted, fontFamily: Fonts.mono, fontSize: FontSize.body },
});
