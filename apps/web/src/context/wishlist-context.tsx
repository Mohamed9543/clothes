'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import type { Wishlist } from '@/types';

interface WishlistContextValue {
  lists: Wishlist[];
  defaultList: Wishlist | null;
  isLoading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
  createList: (name: string) => Promise<void>;
  removeFromList: (listId: string, productId: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [lists, setLists] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setLists([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await apiFetch<Wishlist[]>('/wishlist', { auth: true });
      setLists(data);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const defaultList = lists.find((list) => list.isDefault) ?? null;

  const isInWishlist = useCallback(
    (productId: string) => lists.some((list) => list.productIds.includes(productId)),
    [lists],
  );

  const toggle = useCallback(async (productId: string) => {
    const updatedDefault = await apiFetch<Wishlist>('/wishlist/default/toggle', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ productId }),
    });
    setLists((current) => {
      const others = current.filter((list) => list._id !== updatedDefault._id);
      return [updatedDefault, ...others];
    });
  }, []);

  const createList = useCallback(async (name: string) => {
    const created = await apiFetch<Wishlist>('/wishlist', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ name }),
    });
    setLists((current) => [...current, created]);
  }, []);

  const removeFromList = useCallback(async (listId: string, productId: string) => {
    const updated = await apiFetch<Wishlist>(`/wishlist/${listId}/items/${productId}`, {
      method: 'DELETE',
      auth: true,
    });
    setLists((current) => current.map((list) => (list._id === updated._id ? updated : list)));
  }, []);

  const deleteList = useCallback(async (listId: string) => {
    await apiFetch(`/wishlist/${listId}`, { method: 'DELETE', auth: true });
    setLists((current) => current.filter((list) => list._id !== listId));
  }, []);

  return (
    <WishlistContext.Provider
      value={{ lists, defaultList, isLoading, isInWishlist, toggle, refresh, createList, removeFromList, deleteList }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
