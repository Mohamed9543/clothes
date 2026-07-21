import type { LocalizedText } from '@/types';
import type { Locale } from '@/i18n/routing';

export function localize(text: LocalizedText, locale: string): string {
  return text[locale as Locale] ?? text.fr;
}
