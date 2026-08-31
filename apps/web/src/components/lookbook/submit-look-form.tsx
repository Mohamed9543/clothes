'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { API_URL, apiFetch, apiUpload, ApiError } from '@/lib/api';
import { localize } from '@/lib/localized';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PaginatedResult, PublicProduct } from '@/types';

const MAX_PHOTOS = 5;

export function SubmitLookForm({ onSubmitted }: { onSubmitted: () => void }) {
  const t = useTranslations('lookbook');
  const locale = useLocale();

  const [images, setImages] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<PublicProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<PublicProduct[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    event.target.value = '';
    setIsUploading(true);
    try {
      for (const file of Array.from(files).slice(0, MAX_PHOTOS - images.length)) {
        const formData = new FormData();
        formData.append('file', file);
        const result = await apiUpload<{ url: string }>('/uploads/image', formData, { auth: true });
        setImages((current) => [...current, `${API_URL}${result.url}`]);
      }
    } finally {
      setIsUploading(false);
    }
  }

  async function searchProducts(query: string) {
    setProductQuery(query);
    if (query.length < 2) {
      setProductResults([]);
      return;
    }
    const result = await apiFetch<PaginatedResult<PublicProduct>>(
      `/products?search=${encodeURIComponent(query)}&limit=5`,
    );
    setProductResults(result.items);
  }

  function addProduct(product: PublicProduct) {
    if (!selectedProducts.some((item) => item._id === product._id)) {
      setSelectedProducts((current) => [...current, product]);
    }
    setProductQuery('');
    setProductResults([]);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (images.length === 0) {
      setError(t('errorNoPhoto'));
      return;
    }
    setIsSubmitting(true);
    try {
      await apiFetch('/looks', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          images,
          caption: caption || undefined,
          productIds: selectedProducts.map((product) => product._id),
        }),
      });
      setImages([]);
      setCaption('');
      setSelectedProducts([]);
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-4">
      <p className="mb-3 text-sm font-medium">{t('submitTitle')}</p>

      <div className="mb-3">
        {images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {images.map((image) => (
              <div key={image} className="relative h-16 w-16 overflow-hidden rounded-lg border border-border">
                <Image src={image} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((current) => current.filter((item) => item !== image))}
                  className="absolute end-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white"
                >
                  <X className="h-3 w-3" />
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
          onChange={handlePhotoUpload}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || images.length >= MAX_PHOTOS}
        >
          {isUploading ? t('uploading') : t('addPhotos')}
        </Button>
      </div>

      <textarea
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        maxLength={500}
        rows={3}
        className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        placeholder={t('captionPlaceholder')}
      />

      <div className="mb-3">
        <Input
          value={productQuery}
          onChange={(event) => void searchProducts(event.target.value)}
          placeholder={t('linkProductPlaceholder')}
        />
        {productResults.length > 0 && (
          <div className="mt-1 rounded-md border border-border bg-surface">
            {productResults.map((product) => (
              <button
                key={product._id}
                type="button"
                onClick={() => addProduct(product)}
                className="block w-full px-3 py-2 text-start text-sm hover:bg-background"
              >
                {localize(product.name, locale)}
              </button>
            ))}
          </div>
        )}
        {selectedProducts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedProducts.map((product) => (
              <span
                key={product._id}
                className="flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-xs"
              >
                {localize(product.name, locale)}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedProducts((current) => current.filter((item) => item._id !== product._id))
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {t('submit')}
      </Button>
    </form>
  );
}
