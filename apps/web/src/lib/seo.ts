import { routing } from '@/i18n/routing';

export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001').replace(
  /\/$/,
  '',
);

/**
 * Builds canonical + hreflang alternates for a given pathname (without
 * locale prefix, e.g. "/catalogue" or "/produit/pull-laine"). Mirrors
 * routing.locales — this app uses next-intl's default localePrefix
 * (always-prefixed, same pathname across locales), so alternates are just
 * the same path prefixed with each locale.
 */
export function buildAlternates(locale: string, pathname: string) {
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `${APP_URL}/${loc}${pathname}`;
  }
  return {
    canonical: `${APP_URL}/${locale}${pathname}`,
    languages,
  };
}

const FALLBACK_OG_IMAGE = `${APP_URL}/icon-512.png`;

export function resolveOgImage(images: string[] | undefined): string {
  const first = images?.[0];
  if (!first) {
    return FALLBACK_OG_IMAGE;
  }
  return first.startsWith('http') ? first : `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}${first}`;
}
