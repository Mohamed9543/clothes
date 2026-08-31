import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { buildAlternates } from '@/lib/seo';
import { CatalogueClient } from './catalogue-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'catalog' });
  return {
    title: t('title'),
    alternates: buildAlternates(locale, '/catalogue'),
  };
}

export default function CataloguePage() {
  return <CatalogueClient />;
}
