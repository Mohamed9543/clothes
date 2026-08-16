'use client';

import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { API_URL, apiFetch, apiUpload, ApiError } from '@/lib/api';
import type { LocalizedText, Product, ProductAudience, ProductType, ProductVariant } from '@/types';

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
  const locale = useLocale() as keyof LocalizedText;

  const [slug, setSlug] = useState(product?.slug ?? '');
  const [name, setName] = useState(product?.name[locale] ?? '');
  const [description, setDescription] = useState(product?.description[locale] ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [audience, setAudience] = useState<ProductAudience>(product?.audience ?? 'men');
  const [type, setType] = useState<ProductType>(product?.type ?? 'pull');
  const [variants, setVariants] = useState<ProductVariant[]>(
    product?.variants && product.variants.length > 0 ? product.variants : [{ size: '', stock: 0 }],
  );
  const [colors, setColors] = useState(product?.colors.join(', ') ?? '');
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [modelUrl, setModelUrl] = useState<string | null>(product?.modelUrl ?? null);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [tryOnEnabled, setTryOnEnabled] = useState(product?.tryOnEnabled ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  function updateVariant(index: number, patch: Partial<ProductVariant>) {
    setVariants((current) =>
      current.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)),
    );
  }

  function addVariantRow() {
    setVariants((current) => [...current, { size: '', stock: 0 }]);
  }

  function removeVariantRow(index: number) {
    setVariants((current) => current.filter((_, i) => i !== index));
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, i) => i !== index));
  }

  async function handleImageFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    event.target.value = '';

    setIsUploading(true);
    setError(null);
    try {
      for (const file of fileList) {
        const formData = new FormData();
        formData.append('file', file);
        const result = await apiUpload<{ url: string }>('/uploads/image', formData, {
          auth: true,
        });
        setImages((current) => [...current, `${API_URL}${result.url}`]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('saveError'));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleModelFile(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    event.target.value = '';

    setIsUploadingModel(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await apiUpload<{ url: string }>('/uploads/model', formData, {
        auth: true,
      });
      setModelUrl(`${API_URL}${result.url}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('saveError'));
    } finally {
      setIsUploadingModel(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    let translated: { name: LocalizedText; description: LocalizedText };
    try {
      setIsTranslating(true);
      translated = await apiFetch<{ name: LocalizedText; description: LocalizedText }>(
        '/products/admin/translate',
        {
          method: 'POST',
          auth: true,
          body: JSON.stringify({ name, description, sourceLocale: locale }),
        },
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('translationError'));
      setIsSaving(false);
      setIsTranslating(false);
      return;
    }
    setIsTranslating(false);

    const body = {
      slug,
      name: translated.name,
      description: translated.description,
      price: Number(price),
      audience,
      type,
      variants: variants
        .filter((variant) => variant.size.trim() !== '')
        .map((variant) => ({ size: variant.size.trim(), stock: Number(variant.stock) })),
      colors: colors.split(',').map((c) => c.trim()).filter(Boolean),
      images,
      modelUrl,
      isActive,
      tryOnEnabled,
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

      <div>
        <input
          required
          placeholder={t('fieldName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-muted">{t('autoTranslateHint')}</p>
      </div>

      <textarea
        required
        placeholder={t('fieldDescription')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        rows={3}
      />

      <div className="grid gap-3 sm:grid-cols-3">
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
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted">{t('fieldVariants')}</label>
        <div className="space-y-2">
          {variants.map((variant, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                placeholder={t('sizePlaceholder')}
                value={variant.size}
                onChange={(e) => updateVariant(index, { size: e.target.value })}
                className="w-28 rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={0}
                placeholder={t('stockPlaceholder')}
                value={variant.stock}
                onChange={(e) => updateVariant(index, { stock: Number(e.target.value) })}
                className="w-28 rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeVariantRow(index)}
                className="text-sm text-brand-terracotta underline"
              >
                {t('removeSize')}
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addVariantRow}
          className="mt-2 text-sm text-brand-terracotta underline"
        >
          {t('addSize')}
        </button>
      </div>

      <input placeholder={t('fieldColors')} value={colors} onChange={(e) => setColors(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />

      <div>
        <label className="mb-1 block text-xs text-muted">{t('fieldImages')}</label>
        {images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {images.map((url, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <div key={url} className="relative">
                <img
                  src={url}
                  alt=""
                  className="h-20 w-20 rounded-md border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  aria-label={t('removeImage')}
                  className="absolute -end-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-terracotta text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleImageFiles}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="rounded-md border border-border px-4 py-2 text-sm hover:border-brand-gold disabled:opacity-50"
        >
          {isUploading ? t('uploading') : t('uploadImages')}
        </button>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted">{t('fieldModel')}</label>
        {modelUrl ? (
          <div className="mb-2 flex items-center gap-2 text-sm">
            <span className="truncate text-muted">{modelUrl.split('/').pop()}</span>
            <button
              type="button"
              onClick={() => setModelUrl(null)}
              className="text-sm text-brand-terracotta underline"
            >
              {t('removeModel')}
            </button>
          </div>
        ) : null}
        <input
          ref={modelInputRef}
          type="file"
          accept=".glb,.gltf"
          hidden
          onChange={handleModelFile}
        />
        <button
          type="button"
          onClick={() => modelInputRef.current?.click()}
          disabled={isUploadingModel}
          className="rounded-md border border-border px-4 py-2 text-sm hover:border-brand-gold disabled:opacity-50"
        >
          {isUploadingModel ? t('uploading') : t('uploadModel')}
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        {t('fieldActive')}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={tryOnEnabled}
          onChange={(e) => setTryOnEnabled(e.target.checked)}
        />
        {t('fieldTryOnEnabled')}
      </label>

      {error && <p className="text-sm text-brand-terracotta">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSaving || isUploading || isUploadingModel}
          className="rounded-full bg-brand-terracotta px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {isTranslating ? t('translating') : t('save')}
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
