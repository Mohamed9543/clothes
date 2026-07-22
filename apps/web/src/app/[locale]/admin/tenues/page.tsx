'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';
import { localize } from '@/lib/localized';
import { OutfitForm } from '@/components/admin/outfit-form';
import type { Outfit } from '@/types';

export default function AdminOutfitsPage() {
  const t = useTranslations('admin');
  const locale = useLocale();

  const [outfits, setOutfits] = useState<Outfit[] | null>(null);
  const [editingOutfit, setEditingOutfit] = useState<Outfit | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const loadOutfits = useCallback(async () => {
    const result = await apiFetch<Outfit[]>('/outfits/admin/all', { auth: true });
    setOutfits(result);
  }, []);

  useEffect(() => {
    void loadOutfits();
  }, [loadOutfits]);

  async function toggleActive(outfit: Outfit) {
    await apiFetch(`/outfits/${outfit._id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ isActive: !outfit.isActive }),
    });
    void loadOutfits();
  }

  async function handleDelete(outfit: Outfit) {
    if (!window.confirm(t('confirmDeleteOutfit'))) return;
    await apiFetch(`/outfits/${outfit._id}`, { method: 'DELETE', auth: true });
    void loadOutfits();
  }

  function handleSaved() {
    setIsCreating(false);
    setEditingOutfit(null);
    void loadOutfits();
  }

  if (isCreating) {
    return <OutfitForm onSaved={handleSaved} onCancel={() => setIsCreating(false)} />;
  }

  if (editingOutfit) {
    return (
      <OutfitForm
        outfit={editingOutfit}
        onSaved={handleSaved}
        onCancel={() => setEditingOutfit(null)}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setIsCreating(true)}
          className="rounded-full bg-brand-terracotta px-6 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {t('newOutfit')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-b border-border text-start text-xs text-muted">
              <th className="p-3 text-start">{t('colOutfitTitle')}</th>
              <th className="p-3 text-start">{t('colProductCount')}</th>
              <th className="p-3 text-start">{t('colFeatured')}</th>
              <th className="p-3 text-start">{t('colStatus')}</th>
              <th className="p-3 text-start">{t('colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {outfits?.map((outfit) => (
              <tr key={outfit._id} className="border-b border-border last:border-0">
                <td className="p-3">{localize(outfit.title, locale)}</td>
                <td className="p-3">{outfit.productIds.length}</td>
                <td className="p-3">{outfit.isFeatured ? t('statusActive') : t('statusInactive')}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      outfit.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {outfit.isActive ? t('statusActive') : t('statusInactive')}
                  </span>
                </td>
                <td className="space-x-2 rtl:space-x-reverse p-3 whitespace-nowrap">
                  <button
                    onClick={() => setEditingOutfit(outfit)}
                    className="text-brand-terracotta underline"
                  >
                    {t('edit')}
                  </button>
                  <button onClick={() => toggleActive(outfit)} className="underline">
                    {outfit.isActive ? t('deactivate') : t('activate')}
                  </button>
                  <button
                    onClick={() => handleDelete(outfit)}
                    className="text-red-600 underline"
                  >
                    {t('delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
