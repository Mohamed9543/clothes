import { defineRouting } from 'next-intl/routing';

export const locales = ['ar', 'tn', 'fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export const rtlLocales: Locale[] = ['ar', 'tn'];

export const routing = defineRouting({
  locales,
  defaultLocale,
});
