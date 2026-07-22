'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiFetch, ApiError } from '@/lib/api';
import type { Product, ProductAudience, ProductType } from '@/types';

const AUDIENCES: ProductAudience[] = ['men', 'women', 'kids'];
const TYPES: ProductType[] = [
  'pull',
  'pantalon',
  'chemise',
  'robe',
  'veste',
  'chaussure',
  'accessoire',
];

interface ProductFormProps {
  product?: Product;
  onSaved: () => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSaved, onCancel }: ProductFormProps) {
  const t = useTranslations('admin');
  const tCatalog = useTranslations('catalog');

  const [slug, setSlug] = useState(product?.slug ?? '');
  const [nameFr, setNameFr] = useState(product?.name.fr ?? '');
  const [nameEn, setNameEn] = useState(product?.name.en ?? '');
  const [nameAr, setNameAr] = useState(product?.name.ar ?? '');
  const [nameTn, setNameTn] = useState(product?.name.tn ?? '');
  const [descFr, setDescFr] = useState(product?.description.fr ?? '');
  const [descEn, setDescEn] = useState(product?.description.en ?? '');
  const [descAr, setDescAr] = useState(product?.description.ar ?? '');
  const [descTn, setDescTn] = useState(product?.description.tn ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [audience, setAudience] = useState<ProductAudience>(product?.audience ?? 'men');
  const [type, setType] = useState<ProductType>(product?.type ?? 'pull');
  const [sizes, setSizes] = useState(product?.sizes.join(', ') ?? '');
  const [colors, setColors] = useState(product?.colors.join(', ') ?? '');
  const [images, setImages] = useState(product?.images.join(', ') ?? '');
  const [stock, setStock] = useState(product ? String(product.stock) : '');
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const body = {
      slug,
      name: { fr: nameFr, en: nameEn, ar: nameAr, tn: nameTn },
      description: { fr: descFr, en: descEn, ar: descAr, tn: descTn },
      price: Number(price),
      audience,
      type,
      sizes: sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: colors.split(',').map((c) => c.trim()).filter(Boolean),
      images: images.split(',').map((i) => i.trim()).filter(Boolean),
      stock: Number(stock),
      isActive,
    };

    try {
      if (product) {
        await apiFetch(`/products/${product._id}`, {
          method: 'PATCH',
          auth: true,
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch('/products', {
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
      <h2 className="font-medium">{product ? t('editProduct') : t('newProduct')}</h2>

      <input
        required
        placeholder={t('fieldSlug')}
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <input required placeholder={t('fieldNameFr')} value={nameFr} onChange={(e) => setNameFr(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input required placeholder={t('fieldNameEn')} value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input required placeholder={t('fieldNameAr')} value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" dir="rtl" />
        <input required placeholder={t('fieldNameTn')} value={nameTn} onChange={(e) => setNameTn(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" dir="rtl" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <textarea required placeholder={t('fieldDescFr')} value={descFr} onChange={(e) => setDescFr(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" rows={2} />
        <textarea required placeholder={t('fieldDescEn')} value={descEn} onChange={(e) => setDescEn(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" rows={2} />
        <textarea required placeholder={t('fieldDescAr')} value={descAr} onChange={(e) => setDescAr(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" rows={2} dir="rtl" />
        <textarea required placeholder={t('fieldDescTn')} value={descTn} onChange={(e) => setDescTn(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" rows={2} dir="rtl" />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs text-muted">{t('fieldPrice')}</label>
          <input required type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">{t('fieldAudience')}</label>
          <select value={audience} onChange={(e) => setAudience(e.target.value as ProductAudience)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {tCatalog(a)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">{t('fieldType')}</label>
          <select value={type} onChange={(e) => setType(e.target.value as ProductType)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
            {TYPES.map((ty) => (
              <option key={ty} value={ty}>
                {tCatalog(ty)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">{t('fieldStock')}</label>
          <input required type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        </div>
      </div>

      <input placeholder={t('fieldSizes')} value={sizes} onChange={(e) => setSizes(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
      <input placeholder={t('fieldColors')} value={colors} onChange={(e) => setColors(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
      <input placeholder={t('fieldImages')} value={images} onChange={(e) => setImages(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        {t('fieldActive')}
      </label>

      {error && <p className="text-sm text-brand-terracotta">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSaving}
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
