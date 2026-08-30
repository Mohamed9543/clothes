'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { GARMENT_SLOTS, slotsForType } from '@/lib/garment-slots';
import { productColors } from '@/lib/product-variants';
import type { GarmentSlot } from '@/lib/garment-slots';
import type { Product, ProductType } from '@/types';

export interface FittingRoomItem {
  productId: string;
  type: ProductType;
  name: string;
  image: string | null;
  modelUrl: string | null;
  availableColors: string[];
  selectedColor: string;
}

type FittingRoomItems = Partial<Record<GarmentSlot, FittingRoomItem>>;

interface FittingRoomContextValue {
  items: FittingRoomItems;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addProduct: (product: Product, name: string) => void;
  removeSlot: (slot: GarmentSlot) => void;
  setColor: (slot: GarmentSlot, color: string) => void;
  clear: () => void;
}

const FittingRoomContext = createContext<FittingRoomContextValue | undefined>(undefined);

export function FittingRoomProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FittingRoomItems>({});
  const [isOpen, setIsOpen] = useState(false);

  const addProduct = useCallback((product: Product, name: string) => {
    const slots = slotsForType(product.type);
    const colors = productColors(product);
    const item: FittingRoomItem = {
      productId: product._id,
      type: product.type,
      name,
      image: product.images[0] ?? null,
      modelUrl: product.modelUrl,
      availableColors: colors,
      selectedColor: colors[0] ?? '',
    };

    setItems((current) => {
      const next = { ...current };
      // A full-body garment (robe) replaces both upper and lower; conversely,
      // adding an upper/lower piece while a robe occupies those slots must
      // clear the robe from every slot it was covering.
      for (const slot of GARMENT_SLOTS) {
        const occupant = next[slot];
        if (occupant && slotsForType(occupant.type).some((s) => slots.includes(s))) {
          delete next[slot];
        }
      }
      for (const slot of slots) {
        next[slot] = item;
      }
      return next;
    });
  }, []);

  const removeSlot = useCallback((slot: GarmentSlot) => {
    setItems((current) => {
      const next = { ...current };
      delete next[slot];
      return next;
    });
  }, []);

  const setColor = useCallback((slot: GarmentSlot, color: string) => {
    setItems((current) => {
      const item = current[slot];
      if (!item) return current;
      // A robe occupies two slots with the same item reference — keep them in sync.
      const next = { ...current };
      for (const s of GARMENT_SLOTS) {
        if (next[s]?.productId === item.productId) {
          next[s] = { ...next[s]!, selectedColor: color };
        }
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => setItems({}), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ items, isOpen, open, close, addProduct, removeSlot, setColor, clear }),
    [items, isOpen, open, close, addProduct, removeSlot, setColor, clear],
  );

  return <FittingRoomContext.Provider value={value}>{children}</FittingRoomContext.Provider>;
}

export function useFittingRoom() {
  const context = useContext(FittingRoomContext);
  if (!context) {
    throw new Error('useFittingRoom must be used within a FittingRoomProvider');
  }
  return context;
}
