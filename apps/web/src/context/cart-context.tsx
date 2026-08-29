'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import type { Cart } from '@/types';

interface CartContextValue {
  cart: Cart | null;
  itemCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity: number, size: string, color: string) => Promise<void>;
  updateItem: (productId: string, size: string, color: string, quantity: number) => Promise<void>;
  removeItem: (productId: string, size: string, color: string) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    setIsLoading(true);
    try {
      const data = await apiFetch<Cart>('/cart', { auth: true });
      setCart(data);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (productId: string, quantity: number, size: string, color: string) => {
      const data = await apiFetch<Cart>('/cart/items', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ productId, quantity, size, color }),
      });
      setCart(data);
    },
    [],
  );

  const updateItem = useCallback(async (productId: string, size: string, color: string, quantity: number) => {
    const data = await apiFetch<Cart>(`/cart/items/${productId}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ quantity, size, color }),
    });
    setCart(data);
  }, []);

  const removeItem = useCallback(async (productId: string, size: string, color: string) => {
    const data = await apiFetch<Cart>(
      `/cart/items/${productId}?size=${encodeURIComponent(size)}&color=${encodeURIComponent(color)}`,
      { method: 'DELETE', auth: true },
    );
    setCart(data);
  }, []);

  const clear = useCallback(async () => {
    await apiFetch('/cart', { method: 'DELETE', auth: true });
    setCart({ items: [], total: 0 });
  }, []);

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{ cart, itemCount, isLoading, refresh, addItem, updateItem, removeItem, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
