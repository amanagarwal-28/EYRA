import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
  syncError: string | null;
  serverTotals: CartTotals | null;

  addToCart: (product: Product, size?: number | null, variantId?: string) => void;
  removeFromCart: (productId: string, size: number | null) => void;
  updateQuantity: (productId: string, size: number | null, qty: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
  clearSyncError: () => void;
  setCartId: (id: string) => void;
  initCart: () => Promise<void>;
}

function itemKey(productId: string, size: number | null): string {
  return `${productId}-${size ?? "null"}`;
}

/** Module-level debounce map for updateQuantity syncs. */
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
  items: [],
  cartId: null,
  syncStatus: "idle",
  syncError: null,
  serverTotals: null,

  setCartId(id) {
    set({ cartId: id });
  },

  clearSyncError() {
    set({ syncError: null, syncStatus: "idle" });
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
        const { createCart, setStoredCartId, addCartLineItem } = await import("@/lib/medusa-cart");

        // Prefer the cartId already in the store (rehydrated by persist middleware).
        // Only create a new cart when there genuinely isn't one.
        let cartId = get().cartId;
        if (!cartId) {
          cartId = await createCart();
          if (!cartId) { set({ syncStatus: "error" }); return; }
          setStoredCartId(cartId); // keep eyra_cart_id in sync as a fallback
        }

        const result = await addCartLineItem(cartId, variantId, 1);
        if (!result) {
          set({ syncStatus: "error", syncError: "Could not add item to cart. Please try again." });
          return;
        }

        set((state) => ({
          cartId,
          syncStatus: "idle",
          syncError: null,
          serverTotals: result.totals,
          items: state.items.map((i) =>
            itemKey(i.product.id, i.size) === key
              ? { ...i, lineItemId: result.lineItemId }
              : i
          ),
        }));
      } catch (err) {
        console.error("[cart] addToCart sync failed:", err);
        set({ syncStatus: "error", syncError: "Cart sync failed. Your item is saved locally." });
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
        set({ syncStatus: "idle", syncError: null, serverTotals: totals ?? get().serverTotals });
      } catch (err) {
        console.error("[cart] removeFromCart sync failed:", err);
        set({ syncStatus: "error", syncError: "Could not remove item from the server cart. It has been removed locally." });
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
          if (totals) set({ serverTotals: totals, syncStatus: "idle", syncError: null });
        } catch (err) {
          console.error("[cart] updateQuantity sync failed:", err);
          set({ syncStatus: "error", syncError: "Quantity updated locally but could not sync to server." });
        }
      }, 500)
    );
  },

  clearCart() {
    // Cancel any pending debounced updates
    debounceTimers.forEach((timer) => clearTimeout(timer));
    debounceTimers.clear();

    set({ items: [], cartId: null, serverTotals: null, syncStatus: "idle", syncError: null });

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

    // cartId is already rehydrated from localStorage by persist middleware.
    // Use it directly; no need to read localStorage manually.
    const cartId = get().cartId;
    if (!cartId) return;

    const { fetchCart, clearStoredCartId } = await import("@/lib/medusa-cart");
    const fetched = await fetchCart(cartId);

    if (!fetched) {
      // Cart expired on the server — clear stale state so the next addToCart
      // creates a fresh cart rather than retrying a dead cartId.
      clearStoredCartId();
      set({ cartId: null, items: [], serverTotals: null });
      return;
    }

    // Reconnect server lineItemIds to the persisted items array.
    // Items already in state (from localStorage) are preserved; we only
    // patch in the lineItemId so subsequent quantity/remove syncs work.
    set((state) => ({
      serverTotals: fetched.totals,
      items: state.items.map((item) => {
        const serverItem = fetched.lineItems.find(
          (li) => li.variantId === item.variantId
        );
        return serverItem ? { ...item, lineItemId: serverItem.id } : item;
      }),
    }));
  },
}),
    {
      name: "eyra-cart-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist the cart contents and backend cart ID.
      // UI flags and server-computed totals are always derived fresh.
      partialize: (state) => ({
        items: state.items,
        cartId: state.cartId,
      }),
    }
  )
);

/** A wishlist entry pairs the product with the variant that was active when
 *  the user hearted it. variantId is forwarded to addToCart so Medusa can
 *  sync the correct SKU without requiring the user to re-select a size. */
export interface WishlistItem {
  product: Product;
  /** Resolved Medusa variant ID (size-specific or product default). */
  variantId: string | undefined;
}

interface WishlistStore {
  items: WishlistItem[];
  toggle: (product: Product, variantId?: string) => void;
  isWishlisted: (productId: string) => boolean;
  remove: (productId: string) => void;
}

export const useWishlistStore = create<WishlistStore>()((set, get) => ({
  items: [],

  toggle(product, variantId) {
    set((state) => {
      const exists = state.items.some((i) => i.product.id === product.id);
      return {
        items: exists
          ? state.items.filter((i) => i.product.id !== product.id)
          : [...state.items, { product, variantId: variantId ?? product.variantId }],
      };
    });
  },

  isWishlisted(productId) {
    return get().items.some((i) => i.product.id === productId);
  },

  remove(productId) {
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    }));
  },
}));
