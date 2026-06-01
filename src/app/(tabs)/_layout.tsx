import { Redirect, Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';

import { Colors, FontSize } from '@/constants/theme';
import { useStore } from '@/lib/storage';

/**
 * Bottom tab navigator: Lifts / Calculator / Progress (PRD §Screens).
 *
 * Onboarding gate: if no UserSettings exist yet (first launch), redirect to the
 * onboarding screen before showing any tab. Icons are placeholder glyphs for the
 * skeleton — real icons land when the screens are built.
 */
export default function TabsLayout() {
  const settings = useStore((s) => s.settings);

  if (settings === null) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { backgroundColor: Colors.card, borderTopColor: Colors.border },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Lifts', tabBarIcon: ({ color }) => <TabGlyph color={color} char="≡" /> }}
      />
      <Tabs.Screen
        name="calculator"
        options={{ title: 'Calculator', tabBarIcon: ({ color }) => <TabGlyph color={color} char="%" /> }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progress', tabBarIcon: ({ color }) => <TabGlyph color={color} char="↗" /> }}
      />
    </Tabs>
  );
}

function TabGlyph({ color, char }: { color: ColorValue; char: string }) {
  return <Text style={{ color, fontSize: FontSize.title }}>{char}</Text>;
}
