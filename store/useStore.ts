import { create } from "zustand";
import type { Product } from "@/components/products/types";

export interface CartItem {
  product: Product;
  size: number | null;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addToCart: (product: Product, size?: number | null) => void;
  removeFromCart: (productId: string, size: number | null) => void;
  updateQuantity: (productId: string, size: number | null, qty: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
}

function itemKey(productId: string, size: number | null): string {
  return `${productId}-${size ?? "null"}`;
}

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],

  addToCart(product, size = null) {
    set((state) => {
      const key = itemKey(product.id, size);
      const existing = state.items.find(
        (i) => itemKey(i.product.id, i.size) === key
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            itemKey(i.product.id, i.size) === key
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { product, size, quantity: 1 }] };
    });
  },

  removeFromCart(productId, size) {
    const key = itemKey(productId, size);
    set((state) => ({
      items: state.items.filter((i) => itemKey(i.product.id, i.size) !== key),
    }));
  },

  clearCart() {
    set({ items: [] });
  },

  updateQuantity(productId, size, qty) {
    if (qty < 1) {
      get().removeFromCart(productId, size);
      return;
    }
    const key = itemKey(productId, size);
    set((state) => ({
      items: state.items.map((i) =>
        itemKey(i.product.id, i.size) === key ? { ...i, quantity: qty } : i
      ),
    }));
  },

  cartTotal() {
    return get().items.reduce(
      (sum, i) => sum + i.product.price * i.quantity,
      0
    );
  },
}));

interface WishlistStore {
  items: Product[];
  toggle: (product: Product) => void;
  isWishlisted: (productId: string) => boolean;
  remove: (productId: string) => void;
}

export const useWishlistStore = create<WishlistStore>()((set, get) => ({
  items: [],

  toggle(product) {
    set((state) => {
      const exists = state.items.some((i) => i.id === product.id);
      return {
        items: exists
          ? state.items.filter((i) => i.id !== product.id)
          : [...state.items, product],
      };
    });
  },

  isWishlisted(productId) {
    return get().items.some((i) => i.id === productId);
  },

  remove(productId) {
    set((state) => ({
      items: state.items.filter((i) => i.id !== productId),
    }));
  },
}));
