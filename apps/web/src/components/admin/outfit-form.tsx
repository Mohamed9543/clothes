'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiFetch, ApiError } from '@/lib/api';
import { localize } from '@/lib/localized';
import type { Outfit, PaginatedResult, Product } from '@/types';

interface OutfitFormProps {
  outfit?: Outfit;
  onSaved: () => void;
  onCancel: () => void;
}

export function OutfitForm({ outfit, onSaved, onCancel }: OutfitFormProps) {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [slug, setSlug] = useState(outfit?.slug ?? '');
  const [titleFr, setTitleFr] = useState(outfit?.title.fr ?? '');
  const [titleEn, setTitleEn] = useState(outfit?.title.en ?? '');
  const [titleAr, setTitleAr] = useState(outfit?.title.ar ?? '');
  const [titleTn, setTitleTn] = useState(outfit?.title.tn ?? '');
  const [descFr, setDescFr] = useState(outfit?.description.fr ?? '');
  const [descEn, setDescEn] = useState(outfit?.description.en ?? '');
  const [descAr, setDescAr] = useState(outfit?.description.ar ?? '');
  const [descTn, setDescTn] = useState(outfit?.description.tn ?? '');
  const [coverImage, setCoverImage] = useState(outfit?.coverImage ?? '');
  const [isActive, setIsActive] = useState(outfit?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(outfit?.isFeatured ?? false);
  const [productIds, setProductIds] = useState<string[]>(outfit?.productIds ?? []);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [pickedProductId, setPickedProductId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<PaginatedResult<Product>>('/products/admin/all?limit=100', { auth: true }).then(
      (result) => setAllProducts(result.items),
    );
  }, []);

  function addProduct() {
    if (!pickedProductId || productIds.includes(pickedProductId)) return;
    setProductIds((current) => [...current, pickedProductId]);
    setPickedProductId('');
  }

  function removeProduct(productId: string) {
    setProductIds((current) => current.filter((id) => id !== productId));
  }

  const productMap = new Map(allProducts.map((product) => [product._id, product]));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const body = {
      slug,
      title: { fr: titleFr, en: titleEn, ar: titleAr, tn: titleTn },
      description: { fr: descFr, en: descEn, ar: descAr, tn: descTn },
      coverImage,
      productIds,
      isActive,
      isFeatured,
    };

    try {
      if (outfit) {
        await apiFetch(`/outfits/${outfit._id}`, {
          method: 'PATCH',
          auth: true,
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch('/outfits', {
          method: 'POST',
          auth: true,
          body: JSON.stringify(body),
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <h2 className="font-medium">{outfit ? t('editOutfit') : t('newOutfit')}</h2>

      <input
        required
        placeholder={t('fieldSlug')}
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <input required placeholder={t('fieldTitleFr')} value={titleFr} onChange={(e) => setTitleFr(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input required placeholder={t('fieldTitleEn')} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input required placeholder={t('fieldTitleAr')} value={titleAr} onChange={(e) => setTitleAr(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" dir="rtl" />
        <input required placeholder={t('fieldTitleTn')} value={titleTn} onChange={(e) => setTitleTn(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" dir="rtl" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <textarea required placeholder={t('fieldOutfitDescFr')} value={descFr} onChange={(e) => setDescFr(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" rows={2} />
        <textarea required placeholder={t('fieldOutfitDescEn')} value={descEn} onChange={(e) => setDescEn(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" rows={2} />
        <textarea required placeholder={t('fieldOutfitDescAr')} value={descAr} onChange={(e) => setDescAr(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" rows={2} dir="rtl" />
        <textarea required placeholder={t('fieldOutfitDescTn')} value={descTn} onChange={(e) => setDescTn(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" rows={2} dir="rtl" />
      </div>

      <input
        required
        placeholder={t('fieldCoverImage')}
        value={coverImage}
        onChange={(e) => setCoverImage(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />

      <div>
        <label className="mb-1 block text-xs text-muted">{t('fieldProducts')}</label>
        <div className="space-y-2">
          {productIds.map((productId) => {
            const product = productMap.get(productId);
            return (
              <div key={productId} className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
                <span>
                  {product ? localize(product.name, locale) : productId}
                  {product && ` — ${product.price} ${tCommon('currency')}`}
                </span>
                <button
                  type="button"
                  onClick={() => removeProduct(productId)}
                  className="text-brand-terracotta underline"
                >
                  {t('removeProduct')}
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex gap-2">
          <select
            value={pickedProductId}
            onChange={(e) => setPickedProductId(e.target.value)}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">{t('selectProduct')}</option>
            {allProducts
              .filter((product) => !productIds.includes(product._id))
              .map((product) => (
                <option key={product._id} value={product._id}>
                  {localize(product.name, locale)} — {product.price} {tCommon('currency')}
                </option>
              ))}
          </select>
          <button
            type="button"
            onClick={addProduct}
            className="rounded-md border border-border px-4 py-2 text-sm hover:border-brand-gold"
          >
            {t('addProduct')}
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        {t('fieldActive')}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
        {t('fieldFeatured')}
      </label>

      {error && <p className="text-sm text-brand-terracotta">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSaving || productIds.length < 2}
          className="rounded-full bg-brand-terracotta px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {t('save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border px-6 py-2 text-sm hover:border-brand-gold"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}
