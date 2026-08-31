import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { serverApiFetch } from '@/lib/server-api';
import { APP_URL } from '@/lib/seo';
import type { Look, PaginatedResult, PublicProduct } from '@/types';

const STATIC_PATHS = ['', '/catalogue', '/lookbook'];

function alternatesFor(pathname: string) {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${APP_URL}/${locale}${pathname}`;
  }
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of STATIC_PATHS) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${APP_URL}/${locale}${path}`,
        alternates: { languages: alternatesFor(path) },
      });
    }
  }

  // Paginate through all active products so the sitemap stays complete as
  // the catalogue grows, without loading an unbounded result set at once.
  let page = 1;
  const limit = 100;
  for (;;) {
    const result = await serverApiFetch<PaginatedResult<PublicProduct>>(
      `/products?page=${page}&limit=${limit}`,
    );
    if (!result || result.items.length === 0) {
      break;
    }
    for (const product of result.items) {
      const pathname = `/produit/${product.slug}`;
      for (const locale of routing.locales) {
        entries.push({
          url: `${APP_URL}/${locale}${pathname}`,
          alternates: { languages: alternatesFor(pathname) },
        });
      }
    }
    if (page >= result.totalPages) {
      break;
    }
    page += 1;
  }

  // Same pagination approach for public looks.
  let lookPage = 1;
  for (;;) {
    const result = await serverApiFetch<PaginatedResult<Look>>(
      `/looks?page=${lookPage}&limit=${limit}`,
    );
    if (!result || result.items.length === 0) {
      break;
    }
    for (const look of result.items) {
      const pathname = `/lookbook/${look._id}`;
      for (const locale of routing.locales) {
        entries.push({
          url: `${APP_URL}/${locale}${pathname}`,
          alternates: { languages: alternatesFor(pathname) },
        });
      }
    }
    if (lookPage >= result.totalPages) {
      break;
    }
    lookPage += 1;
  }

  return entries;
}
