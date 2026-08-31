import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from './auth-context';
import type { EnrichedCart } from '@/types';

interface CartContextValue {
  cart: EnrichedCart | null;
  itemCount: number;
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity: number, size: string, color: string) => Promise<void>;
  updateItem: (productId: string, size: string, color: string, quantity: number) => Promise<void>;
  removeItem: (productId: string, size: string, color: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<EnrichedCart | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    const result = await apiFetch<EnrichedCart>('/cart', { auth: true });
    setCart(result);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function addItem(productId: string, quantity: number, size: string, color: string) {
    const result = await apiFetch<EnrichedCart>('/cart/items', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ productId, quantity, size, color }),
    });
    setCart(result);
  }

  async function updateItem(productId: string, size: string, color: string, quantity: number) {
    const result = await apiFetch<EnrichedCart>(`/cart/items/${productId}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ size, color, quantity }),
    });
    setCart(result);
  }

  async function removeItem(productId: string, size: string, color: string) {
    const result = await apiFetch<EnrichedCart>(
      `/cart/items/${productId}?size=${encodeURIComponent(size)}&color=${encodeURIComponent(color)}`,
      { method: 'DELETE', auth: true },
    );
    setCart(result);
  }

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <CartContext.Provider value={{ cart, itemCount, refresh, addItem, updateItem, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
