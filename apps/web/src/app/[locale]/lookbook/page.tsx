import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LookCard } from '@/components/lookbook/look-card';
import { serverApiFetch } from '@/lib/server-api';
import { buildAlternates } from '@/lib/seo';
import type { Look, PaginatedResult } from '@/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'lookbook' });
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: buildAlternates(locale, '/lookbook'),
  };
}

export default async function LookbookPage() {
  const t = await getTranslations('lookbook');
  const result = await serverApiFetch<PaginatedResult<Look>>('/looks?page=1&limit=24');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">{t('title')}</h1>
      <p className="mb-6 text-muted">{t('subtitle')}</p>

      {(!result || result.items.length === 0) && <p className="text-sm text-muted">{t('empty')}</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {result?.items.map((look) => <LookCard key={look._id} look={look} />)}
      </div>
    </div>
  );
}
