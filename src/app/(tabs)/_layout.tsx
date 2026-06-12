import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS, Platform } from 'react-native';

import { Colors } from '@/constants/theme';
import { useStore } from '@/lib/storage';

/**
 * Bottom tab navigator: Lifts / Calculator / Progress (PRD §Screens).
 *
 * Uses expo-router's NativeTabs, which renders the platform's native tab bar —
 * Liquid Glass on iOS 26 (translucent, blurs content behind it, auto-adapts to
 * the backdrop). Glass picks its own background, so tint/label colors must be
 * declared with DynamicColorIOS rather than a fixed hex, or they can become
 * unreadable when the material flips light/dark. SF Symbols supply the iOS icons;
 * Android falls back to material symbols via `md`.
 *
 * Onboarding gate: if no UserSettings exist yet (first launch), redirect to the
 * onboarding screen before showing any tab.
 *
 * Note: native-tabs is alpha (`unstable-` import) — API may shift on SDK bumps.
 */

// Accent stays lime in both glass modes; labels follow the material's contrast.
const tintColor =
  Platform.OS === 'ios'
    ? DynamicColorIOS({ dark: Colors.accent, light: Colors.accent })
    : Colors.accent;

const labelColor =
  Platform.OS === 'ios'
    ? DynamicColorIOS({ dark: '#ffffff', light: '#000000' })
    : Colors.textMuted;

export default function TabsLayout() {
  const settings = useStore((s) => s.settings);

  if (settings === null) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      tintColor={tintColor}
      labelStyle={{ color: labelColor }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'list.bullet', selected: 'list.bullet.indent' }}
          md="format_list_bulleted"
        />
        <NativeTabs.Trigger.Label>Lifts</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="calculator">
        <NativeTabs.Trigger.Icon sf="percent" md="percent" />
        <NativeTabs.Trigger.Label>Calculator</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="progress">
        <NativeTabs.Trigger.Icon
          sf="chart.line.uptrend.xyaxis"
          md="trending_up"
        />
        <NativeTabs.Trigger.Label>Progress</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
