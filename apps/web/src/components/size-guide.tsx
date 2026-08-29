'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
// Generic approximate chest/waist measurements (cm) — a static reference
// table, not a per-product or personalized recommendation.
const CHEST_CM: Record<(typeof SIZES)[number], string> = {
  XS: '80-84',
  S: '85-89',
  M: '90-95',
  L: '96-102',
  XL: '103-110',
  XXL: '111-118',
};

export function SizeGuide() {
  const t = useTranslations('product');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-sm text-brand-terracotta underline"
      >
        {t('sizeGuide')}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-xl bg-surface p-4">
            <button
              onClick={() => setIsOpen(false)}
              aria-label={t('closeTryOn')}
              className="absolute end-4 top-4"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="mb-4 font-medium">{t('sizeGuideTitle')}</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-start">
                  <th className="py-1 text-start">{t('size')}</th>
                  <th className="py-1 text-start">{t('sizeGuideChest')}</th>
                </tr>
              </thead>
              <tbody>
                {SIZES.map((size) => (
                  <tr key={size} className="border-b border-border last:border-0">
                    <td className="py-1">{size}</td>
                    <td className="py-1 text-muted">{CHEST_CM[size]} cm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
