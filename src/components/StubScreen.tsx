import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, FontSize, Spacing } from '@/constants/theme';

/**
 * Placeholder for a tab screen not yet built. Carries the dark theme + monospace
 * styling so the skeleton already looks like the real app. Replaced screen-by-
 * screen in follow-up work.
 */
export function StubScreen({ title, note }: { title: string; note?: string }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>{title.toUpperCase()}</Text>
        <Text style={styles.note}>{note ?? 'Coming soon'}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  title: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: FontSize.title,
    fontWeight: '700',
    letterSpacing: 1,
  },
  note: { color: Colors.textMuted, fontFamily: Fonts.mono, fontSize: FontSize.body },
});
