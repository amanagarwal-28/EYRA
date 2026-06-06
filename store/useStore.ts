import { create } from "zustand";
import type { Product } from "@/components/products/types";
import type { CartTotals } from "@/lib/medusa-cart";

export interface CartItem {
  product: Product;
  size: number | null;
  quantity: number;
  /** Medusa variant ID — undefined for mock-data items */
  variantId?: string;
  /** Medusa line item ID — set after the first successful backend sync */
  lineItemId?: string;
}

interface CartStore {
  items: CartItem[];
  cartId: string | null;
  syncStatus: "idle" | "syncing" | "error";
  serverTotals: CartTotals | null;

  addToCart: (product: Product, size?: number | null, variantId?: string) => void;
  removeFromCart: (productId: string, size: number | null) => void;
  updateQuantity: (productId: string, size: number | null, qty: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
  setCartId: (id: string) => void;
  initCart: () => Promise<void>;
}

function itemKey(productId: string, size: number | null): string {
  return `${productId}-${size ?? "null"}`;
}

/** Module-level debounce map for updateQuantity syncs. */
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  cartId: null,
  syncStatus: "idle",
  serverTotals: null,

  setCartId(id) {
    set({ cartId: id });
  },

  addToCart(product, size = null, variantId) {
    const key = itemKey(product.id, size);

    // Optimistic update
    set((state) => {
      const existing = state.items.find((i) => itemKey(i.product.id, i.size) === key);
      if (existing) {
        return {
          items: state.items.map((i) =>
            itemKey(i.product.id, i.size) === key
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
          syncStatus: "syncing" as const,
        };
      }
      return {
        items: [...state.items, { product, size, quantity: 1, variantId }],
        syncStatus: "syncing" as const,
      };
    });

    // Background Medusa sync — only when a variant ID is available
    if (!variantId) {
      set({ syncStatus: "idle" });
      return;
    }

    (async () => {
      try {
        const {
          getOrCreateCartId,
          addCartLineItem,
        } = await import("@/lib/medusa-cart");

        const cartId = await getOrCreateCartId();
        if (!cartId) { set({ syncStatus: "error" }); return; }

        const result = await addCartLineItem(cartId, variantId, 1);
        if (!result) { set({ syncStatus: "error" }); return; }

        set((state) => ({
          cartId,
          syncStatus: "idle",
          serverTotals: result.totals,
          items: state.items.map((i) =>
            itemKey(i.product.id, i.size) === key
              ? { ...i, lineItemId: result.lineItemId }
              : i
          ),
        }));
      } catch {
        set({ syncStatus: "error" });
      }
    })();
  },

  removeFromCart(productId, size) {
    const key = itemKey(productId, size);

    // Capture lineItemId before optimistic remove
    const item = get().items.find((i) => itemKey(i.product.id, i.size) === key);
    const { lineItemId } = item ?? {};
    const cartId = get().cartId;

    // Optimistic update
    set((state) => ({
      items: state.items.filter((i) => itemKey(i.product.id, i.size) !== key),
      syncStatus: lineItemId ? ("syncing" as const) : ("idle" as const),
    }));

    if (!lineItemId || !cartId) return;

    (async () => {
      try {
        const { removeCartLineItem } = await import("@/lib/medusa-cart");
        const totals = await removeCartLineItem(cartId, lineItemId);
        set({ syncStatus: "idle", serverTotals: totals ?? get().serverTotals });
      } catch {
        set({ syncStatus: "error" });
      }
    })();
  },

  updateQuantity(productId, size, qty) {
    if (qty < 1) {
      get().removeFromCart(productId, size);
      return;
    }
    const key = itemKey(productId, size);

    // Optimistic update
    set((state) => ({
      items: state.items.map((i) =>
        itemKey(i.product.id, i.size) === key ? { ...i, quantity: qty } : i
      ),
    }));

    // Debounced sync
    const existing = debounceTimers.get(key);
    if (existing) clearTimeout(existing);

    debounceTimers.set(
      key,
      setTimeout(async () => {
        debounceTimers.delete(key);

        const cartId = get().cartId;
        const item = get().items.find((i) => itemKey(i.product.id, i.size) === key);
        const lineItemId = item?.lineItemId;
        if (!cartId || !lineItemId) return;

        try {
          const { updateCartLineItem } = await import("@/lib/medusa-cart");
          const totals = await updateCartLineItem(cartId, lineItemId, qty);
          if (totals) set({ serverTotals: totals, syncStatus: "idle" });
        } catch {
          set({ syncStatus: "error" });
        }
      }, 500)
    );
  },

  clearCart() {
    // Cancel any pending debounced updates
    debounceTimers.forEach((timer) => clearTimeout(timer));
    debounceTimers.clear();

    set({ items: [], cartId: null, serverTotals: null, syncStatus: "idle" });

    // Fire-and-forget localStorage cleanup (client-only)
    if (typeof window !== "undefined") {
      import("@/lib/medusa-cart").then(({ clearStoredCartId }) => clearStoredCartId());
    }
  },

  cartTotal() {
    return get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  },

  async initCart() {
    if (typeof window === "undefined") return;

    const { getStoredCartId, fetchCart } = await import("@/lib/medusa-cart");
    const storedId = getStoredCartId();
    if (!storedId) return;

    const fetched = await fetchCart(storedId);
    if (!fetched) {
      // Cart expired on server — clear the stale ID
      const { clearStoredCartId } = await import("@/lib/medusa-cart");
      clearStoredCartId();
      return;
    }

    set((state) => {
      // Reconnect lineItemIds for any matching items already in Zustand state
      const updatedItems = state.items.map((item) => {
        const serverItem = fetched.lineItems.find(
          (li) => li.variantId === item.variantId
        );
        return serverItem ? { ...item, lineItemId: serverItem.id } : item;
      });

      return {
        cartId: storedId,
        serverTotals: fetched.totals,
        items: updatedItems,
      };
    });
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
