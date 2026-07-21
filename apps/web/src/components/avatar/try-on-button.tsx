'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { AvatarViewer } from '@/components/avatar/avatar-viewer';
import { colorNameToHex } from '@/lib/colors';
import type { Product } from '@/types';

export function TryOnButton({ product }: { product: Product }) {
  const t = useTranslations('avatar');
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user?.avatarUrl) {
    return (
      <Link href="/avatar" className="block text-center text-sm text-brand-terracotta underline">
        {t('createAvatarFirst')}
      </Link>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full rounded-full border border-border px-6 py-3 text-sm font-medium hover:border-brand-gold"
      >
        {t('tryOn')}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg rounded-xl bg-surface p-4">
            <button
              onClick={() => setIsOpen(false)}
              aria-label={t('closeTryOn')}
              className="absolute end-4 top-4 z-10"
            >
              <X className="h-5 w-5" />
            </button>
            <AvatarViewer
              avatarUrl={user.avatarUrl}
              overlay={{ type: product.type, colorHex: colorNameToHex(product.colors[0]) }}
              className="h-[480px] w-full overflow-hidden rounded-lg bg-background"
            />
          </div>
        </div>
      )}
    </>
  );
}
