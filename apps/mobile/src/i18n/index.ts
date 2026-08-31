import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ar from './locales/ar';
import en from './locales/en';
import fr from './locales/fr';
import tn from './locales/tn';

export const SUPPORTED_LOCALES = ['fr', 'en', 'ar', 'tn'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'fr';

const LOCALE_STORAGE_KEY = 'libas_locale';

const resources = {
  fr: { translation: fr },
  en: { translation: en },
  ar: { translation: ar },
  tn: { translation: tn },
};

function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return Boolean(value) && (SUPPORTED_LOCALES as readonly string[]).includes(value as string);
}

export async function getStoredLocale(): Promise<SupportedLocale | null> {
  const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
  return isSupportedLocale(stored) ? stored : null;
}

export async function setStoredLocale(locale: SupportedLocale): Promise<void> {
  await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

function detectDeviceLocale(): SupportedLocale {
  const deviceLanguageCode = Localization.getLocales()[0]?.languageCode;
  return isSupportedLocale(deviceLanguageCode) ? deviceLanguageCode : DEFAULT_LOCALE;
}

/** Resolves the locale to boot with: stored preference, else device locale, else 'fr'. */
export async function resolveInitialLocale(): Promise<SupportedLocale> {
  const stored = await getStoredLocale();
  return stored ?? detectDeviceLocale();
}

export async function initI18n(): Promise<SupportedLocale> {
  const locale = await resolveInitialLocale();
  await i18n.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
  });
  return locale;
}

export default i18n;
