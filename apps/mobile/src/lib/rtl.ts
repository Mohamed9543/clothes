import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';
import i18n, { setStoredLocale, type SupportedLocale } from '@/i18n';

const RTL_LOCALES: SupportedLocale[] = ['ar', 'tn'];

export function isRtlLocale(locale: SupportedLocale): boolean {
  return RTL_LOCALES.includes(locale);
}

/** Applies the native RTL layout-direction flag — only takes effect after a reload. */
export function syncNativeRtlFlag(locale: SupportedLocale): void {
  const shouldBeRtl = isRtlLocale(locale);
  I18nManager.allowRTL(shouldBeRtl);
  I18nManager.forceRTL(shouldBeRtl);
}

export interface ApplyLocaleResult {
  /** True if the RTL-ness changed and a reload was needed. */
  reloaded: boolean;
  /** True if a reload was needed but couldn't be triggered automatically (e.g. Expo Go). */
  manualRestartNeeded: boolean;
}

/**
 * Switches the active locale. If switching also flips text direction
 * (fr/en <-> ar/tn), the native RTL flag only takes effect after the JS
 * bundle reloads — I18nManager.forceRTL is not a live style change.
 */
export async function applyLocale(locale: SupportedLocale): Promise<ApplyLocaleResult> {
  const wasRtl = I18nManager.isRTL;
  const willBeRtl = isRtlLocale(locale);

  await setStoredLocale(locale);
  await i18n.changeLanguage(locale);

  if (wasRtl === willBeRtl) {
    return { reloaded: false, manualRestartNeeded: false };
  }

  syncNativeRtlFlag(locale);

  try {
    await Updates.reloadAsync();
    return { reloaded: true, manualRestartNeeded: false };
  } catch {
    // Updates.reloadAsync() isn't available in Expo Go / some dev setups —
    // the RTL flag is already set for next launch, just needs a manual restart.
    return { reloaded: false, manualRestartNeeded: true };
  }
}
