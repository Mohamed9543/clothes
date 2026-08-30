'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { useFittingRoom } from '@/context/fitting-room-context';
import { AvatarViewer } from '@/components/avatar/avatar-viewer';
import { AddOutfitToCartButton } from '@/components/add-outfit-to-cart-button';
import { colorNameToHex } from '@/lib/colors';
import { GARMENT_SLOTS } from '@/lib/garment-slots';

export function FittingRoomModal() {
  const t = useTranslations('fittingRoom');
  const { user } = useAuth();
  const { items, isOpen, close, removeSlot, setColor } = useFittingRoom();

  if (!isOpen || !user?.avatarUrl) return null;

  const occupiedSlots = GARMENT_SLOTS.filter((slot) => items[slot]);
  const uniqueProductIds = [...new Set(occupiedSlots.map((slot) => items[slot]!.productId))];

  const overlays = occupiedSlots
    .filter((slot, index) => occupiedSlots.findIndex((s) => items[s]!.productId === items[slot]!.productId) === index)
    .map((slot) => {
      const item = items[slot]!;
      return {
        id: item.productId,
        type: item.type,
        colorHex: colorNameToHex(item.selectedColor),
        modelUrl: item.modelUrl,
      };
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-surface p-4">
        <button onClick={close} aria-label={t('close')} className="absolute end-4 top-4 z-10">
          <X className="h-5 w-5" />
        </button>
        <h2 className="mb-3 font-medium">{t('title')}</h2>

        <div className="grid gap-4 overflow-y-auto sm:grid-cols-2">
          <AvatarViewer
            avatarUrl={user.avatarUrl}
            overlays={overlays}
            heightCm={user.heightCm}
            weightKg={user.weightKg}
            className="h-[380px] w-full overflow-hidden rounded-lg bg-background"
          />

          <div className="space-y-3">
            {occupiedSlots.length === 0 && <p className="text-sm text-muted">{t('empty')}</p>}
            {occupiedSlots.map((slot) => {
              const item = items[slot]!;
              return (
                <div key={slot} className="flex items-center gap-3 rounded-lg border border-border p-2">
                  {item.image && (
                    <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded bg-background">
                      <Image src={item.image} alt="" fill className="object-cover" sizes="44px" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    {item.availableColors.length > 1 && (
                      <div className="mt-1 flex gap-1">
                        {item.availableColors.map((color) => (
                          <button
                            key={color}
                            title={color}
                            onClick={() => setColor(slot, color)}
                            className={`h-4 w-4 rounded-full border ${
                              item.selectedColor === color ? 'border-brand-terracotta' : 'border-border'
                            }`}
                            style={{ backgroundColor: colorNameToHex(color) }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeSlot(slot)}
                    className="text-xs text-brand-terracotta underline"
                  >
                    {t('remove')}
                  </button>
                </div>
              );
            })}

            {uniqueProductIds.length > 0 && (
              <AddOutfitToCartButton productIds={uniqueProductIds} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
