import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LikeButton } from '@/components/lookbook/like-button';
import { localize } from '@/lib/localized';
import { serverApiFetch } from '@/lib/server-api';
import { buildAlternates, resolveOgImage } from '@/lib/seo';
import type { Look } from '@/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const look = await serverApiFetch<Look>(`/looks/${id}`);
  if (!look) {
    return {};
  }
  const title = look.caption ?? look.authorName;
  return {
    title,
    alternates: buildAlternates(locale, `/lookbook/${id}`),
    openGraph: { title, images: [{ url: resolveOgImage(look.images) }] },
  };
}

export default async function LookDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const look = await serverApiFetch<Look>(`/looks/${id}`);

  if (!look) {
    notFound();
  }

  const t = await getTranslations('lookbook');

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="grid gap-2 sm:grid-cols-2">
        {look.images.map((image) => (
          <div key={image} className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-surface">
            <Image src={image} alt={look.caption ?? look.authorName} fill className="object-cover" />
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="font-medium">{look.authorName}</p>
        <LikeButton lookId={look._id} initialLikeCount={look.likeCount} />
      </div>

      {look.caption && <p className="mt-3 text-muted">{look.caption}</p>}

      {look.products.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium">{t('linkedProducts')}</h2>
          <div className="flex flex-wrap gap-2">
            {look.products.map((product) => (
              <Link
                key={product._id}
                href={`/produit/${product.slug}`}
                className="rounded-full border border-border px-3 py-1 text-sm hover:border-brand-gold"
              >
                {localize(product.name, locale)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
