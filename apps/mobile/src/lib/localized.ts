import type { SupportedLocale } from '@/i18n';
import type { LocalizedText } from '@/types';

export function localize(text: LocalizedText, locale: string): string {
  return text[locale as SupportedLocale] ?? text.fr;
}
