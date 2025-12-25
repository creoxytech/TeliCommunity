/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Sunrise Palette
const sunrisePrimary = '#FF7D29'; // Sunrise Orange
const sunriseSecondary = '#FFB300'; // Sun Yellow
const sunriseDarkBg = '#121212';
const sunriseDarkSurface = '#1E1E1E';
const sunriseText = '#1C1917';
const sunriseDarkText = '#FFE4D6';
const sunriseBorder = '#E5E5E5';
const sunriseDarkBorder = '#333333';

export const Colors = {
  light: {
    text: sunriseText,
    textSecondary: '#525252',
    background: '#FFFFFF',
    tint: sunrisePrimary,
    icon: '#737373',
    tabIconDefault: '#737373',
    tabIconSelected: sunrisePrimary,
    primary: sunrisePrimary,
    secondary: sunriseSecondary,
    accent: '#FFB300',
    surface: '#FFF8F0',
    border: sunriseBorder,
  },
  dark: {
    text: sunriseDarkText,
    textSecondary: '#A3A3A3',
    background: sunriseDarkBg,
    tint: sunrisePrimary,
    icon: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: sunrisePrimary,
    primary: sunrisePrimary,
    secondary: sunriseSecondary,
    accent: '#FFB300',
    surface: sunriseDarkSurface,
    border: sunriseDarkBorder,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
