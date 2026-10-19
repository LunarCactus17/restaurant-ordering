"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { CartItem } from "@/lib/types";

const CART_STORAGE_KEY = "restaurant-ordering-cart";

type AddCartItemInput = Omit<CartItem, "id">;

type CartContextValue = {
  cart: CartItem[];
  addItem: (item: AddCartItemInput) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function createCartItemId() {
  return `cart_${Math.random().toString(36).slice(2, 10)}`;
}

function getInitialCart() {
  if (typeof window === "undefined") {
    return [] as CartItem[];
  }

  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) {
      return [] as CartItem[];
    }

    const parsed = JSON.parse(stored) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as CartItem[];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(getInitialCart);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addItem = useCallback((item: AddCartItemInput) => {
    setCart((current) => [
      ...current,
      {
        ...item,
        id: createCartItemId(),
      },
    ]);
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.id !== cartItemId));
      return;
    }

    setCart((current) =>
      current.map((item) =>
        item.id === cartItemId
          ? {
              ...item,
              quantity,
            }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    setCart((current) => current.filter((item) => item.id !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const value = useMemo(
    () => ({
      cart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [addItem, cart, clearCart, removeItem, updateQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }

  return context;
}
