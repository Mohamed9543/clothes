import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import type { Wishlist } from '@/types';

interface WishlistContextValue {
  lists: Wishlist[];
  isInWishlist: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  removeFromList: (listId: string, productId: string) => Promise<void>;
  createList: (name: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [lists, setLists] = useState<Wishlist[]>([]);

  useEffect(() => {
    if (!user) {
      setLists([]);
      return;
    }
    apiFetch<Wishlist[]>('/wishlist', { auth: true })
      .then(setLists)
      .catch(() => setLists([]));
  }, [user]);

  const isInWishlist = useCallback(
    (productId: string) => lists.some((list) => list.productIds.includes(productId)),
    [lists],
  );

  const toggle = useCallback(async (productId: string) => {
    const updated = await apiFetch<Wishlist>('/wishlist/default/toggle', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ productId }),
    });
    setLists((current) => [updated, ...current.filter((list) => list._id !== updated._id)]);
  }, []);

  const removeFromList = useCallback(async (listId: string, productId: string) => {
    const updated = await apiFetch<Wishlist>(`/wishlist/${listId}/items/${productId}`, {
      method: 'DELETE',
      auth: true,
    });
    setLists((current) => current.map((list) => (list._id === updated._id ? updated : list)));
  }, []);

  const createList = useCallback(async (name: string) => {
    const created = await apiFetch<Wishlist>('/wishlist', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ name }),
    });
    setLists((current) => [...current, created]);
  }, []);

  const deleteList = useCallback(async (listId: string) => {
    await apiFetch(`/wishlist/${listId}`, { method: 'DELETE', auth: true });
    setLists((current) => current.filter((list) => list._id !== listId));
  }, []);

  return (
    <WishlistContext.Provider value={{ lists, isInWishlist, toggle, removeFromList, createList, deleteList }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
