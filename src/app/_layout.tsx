import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useStore } from '@/lib/storage';

/**
 * Root layout. Dark theme only (PRD: no light mode). Renders nothing until the
 * persisted store has rehydrated, then gates onboarding: the (tabs) group and
 * the onboarding screen are both registered, and onboarding.tsx redirects into
 * the app once UserSettings exist.
 */
export default function RootLayout() {
  const hydrated = useStore((s) => s.hydrated);

  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg }} />;
  }

  const theme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: Colors.bg,
      card: Colors.card,
      text: Colors.text,
      border: Colors.border,
      primary: Colors.accent,
    },
  };

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack>
    </ThemeProvider>
  );
}
