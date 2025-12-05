import { create } from "zustand";
import useAuthStore from "@/store/auth.store";
import { CartService } from "@/lib/cartService";
import { client } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwriteConfig";
import {CartCustomization, CartItemType, CartStore} from "@/type";
import {Alert} from "react-native";

// Type guard
function isCartPayload(payload: unknown): payload is { user_id: string } {
    return typeof payload === "object" && payload !== null && "user_id" in payload && typeof (payload as any).user_id === "string";
}

// Generate a unique key for each cart item + customizations
export const generateCartItemKey = (itemId: string, customizations: CartCustomization[] = []) => {
    if (!customizations || customizations.length === 0) return itemId;
    const sortedIds = customizations.map(c => `${c.id}:${c.quantity ?? 1}`).sort().join("|");
    return `${itemId}_${sortedIds}`;
};

let hasSubscribed = false;
const lastUpdateRef = { current: 0 };

export const useCartStore = create<CartStore>((set, get) => ({

    cartMeta: undefined,

    setCartMeta: async (meta) => {
        const state = get();

        // If the branch changed, clear cart
        if (state.cartMeta?.branchId && meta.branchId !== state.cartMeta.branchId) {
            console.log("Branch changed! Clearing cart items...");
            Alert.alert(
                'Branch Changed',
                'Your Previous Cart Items have been cleared as they may not apply to this branch'
            )
            state.clearCart(); // <-- actually removes items from Appwrite
        }

        set({
            cartMeta: meta
        });
    },

    clearCartMeta: () =>
        set({
            cartMeta: undefined,
        }),

    items: [],
    preview: null,

    setPreview: (preview) => {
        set((state) => ({
            preview: typeof preview === "function" ? preview(state.preview ?? null) : preview,
        }));
    },

    updatePreview: (updates) => {
        const current = get().preview;
        if (!current) return;
        set({
            preview: {
                ...current,
                ...updates,
                customizations: updates.customizations ?? current.customizations ?? [],
            },
        });
    },

    clearPreview: () => set({ preview: null }),

    // Load cart from Appwrite and merge with local state
    async loadCartFromServer() {
        const user = useAuthStore.getState().user?.$id;
        if (!user) return;

        const docs = await CartService.getUserCart(user);
        console.log("Fetched cart docs:", docs); // 🔹

        const newItems = docs.map(d => {
            const customizations = typeof d.customizations === "string" ? JSON.parse(d.customizations) : d.customizations ?? [];
            const itemId = d.product_id;
            return {
                id: itemId,
                name: d.product_name,
                basePrice: d.itemPrice,
                quantity: d.quantity ?? 1,
                note: d.note,
                image_url: d.image_url,
                is_checked_out: d.is_checked_out,
                customizations,
                extrasTotal: d.extrasTotal ?? 0,
                totalPrice: d.total ?? (d.itemPrice + (d.extrasTotal ?? 0)),
                key: generateCartItemKey(itemId, customizations),
                cartId: d.$id,
            };
        });

        set((state) => {
            const merged = [...state.items];
            newItems.forEach(newItem => {
                const idx = merged.findIndex(i => i.key === newItem.key);
                if (idx > -1) merged[idx] = newItem; // update existing
                else merged.push(newItem); // add new
            });
            return { items: merged };
        });
    },

     subscribeToCartRealTime: () => {
        if (hasSubscribed) return;
        hasSubscribed = true;

        const user = useAuthStore.getState().user;
        if (!user) return;

        const subscription = client.subscribe(
            [`databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.cartCollectionId}.documents`],
            async (response) => {
                const now = Date.now();
                if (now - lastUpdateRef.current < 500) return;
                lastUpdateRef.current = now;

                const { events, payload } = response;
                if (!isCartPayload(payload)) return;
                if (payload.user_id !== user.$id) return;

                if (events.some(e => e.match(/documents\..*(create|update|delete)/))) {
                    console.log("Realtime Cart Update Detected");
                    await get().loadCartFromServer();
                }
            }
        );

        return () => subscription();
    },

    addItem: async (item: CartItemType) => {
        const { cartMeta } = get();
        if (!cartMeta?.branchId) {
            console.warn("No branchId found in cartMeta. Cannot add item to cart.");
            return;
        }
        const key = generateCartItemKey(item.id, item.customizations ?? []);
        const existing = get().items.find(i => i.key === key);

        const extrasTotal = item.customizations?.reduce(
            (sum, c) => sum + (c.price || 0) * (c.quantity || 1),
            0
        ) ?? 0;

        const totalPrice = ((item.basePrice ?? 0) + extrasTotal) * ((item.quantity ?? 1));

        if (existing) {
            // Item already exists, just increase quantity
            const newQty = (existing.quantity ?? 1) + 1;

            set({
                items: get().items.map(i =>
                    i.key === key
                        ? {
                            ...i,
                            quantity: newQty,
                            totalPrice: ((i.basePrice ?? 0) + (i.extrasTotal ?? 0)) * newQty
                        }
                        : i
                )
            });

            // Update Appwrite if cartId exists
            if (existing.cartId) {
                try {
                    await CartService.updateItemQuantity(existing.cartId, newQty);
                } catch (err) {
                    console.error("Failed to update quantity in Appwrite:", err);
                }
            }

            return;
        }

        // New item — add to local store
        const newItem: CartItemType = {
            ...item,
            key,
            quantity: item.quantity ?? 1,
            extrasTotal,
            totalPrice,
        };

        set({ items: [...get().items, newItem] });

        // Add to Appwrite
        const userId = useAuthStore.getState().user?.$id;
        if (!userId) return;

        try {
            const doc = await CartService.addOrUpdateItem(
                userId,
                item,
                item.customizations ?? [],
                extrasTotal,
                totalPrice
            );

            // Assign the Appwrite cartId if available
            if (doc?.$id) {
                set({
                    items: get().items.map(i =>
                        i.key === key ? { ...i, cartId: doc.$id } : i
                    )
                });
            }
        } catch (err) {
            console.error("Failed to add item to Appwrite:", err);
        }
    },

    removeItem: async (id: string, customizations: CartCustomization[] = []) => {
        const key = generateCartItemKey(id, customizations);
        const item = get().items.find(i => i.key === key);
        if (!item) return;

        set({
            items: get().items.filter(i => i.key !== key),
        });

        //Remove from Appwrite
        if (item?.cartId) {
            try {
                await CartService.removeItem(item.cartId);
            } catch (err) {
                console.error(err);
            }
        }

        // const user = useAuthStore.getState().user;
        // if (user) {
        //     try {
        //         const docs = await CartService.getUserCart(user.accountId);
        //         const target = docs.find(d => generateCartItemKey(d.product_id, d.customizations ? JSON.parse(d.customizations) : []) === key);
        //         if (target) await CartService.removeItem(target.$id);
        //     } catch (err) {
        //         console.error(err);
        //     }
        // }
    },

    increaseQty: async (id: string, customizations: CartCustomization[] = []) => {
        const key = generateCartItemKey(id, customizations);
        const item = get().items.find(i => i.key === key);
        if (!item) return;

        const newQty = (item.quantity ?? 1) + 1;

        set({
            items: get().items.map(i =>
                i.key === key
                    ? {
                         ...i,
                        quantity: newQty,
                        totalPrice: ((i.basePrice ?? 0)+ (i.extrasTotal ?? 0)) * newQty
                    }
                    : i
            )
        });

        if (item.cartId) {
            try {
                await CartService.updateItemQuantity(item.cartId, newQty);
            } catch (e) {
                console.error(e);
            }
        }
    },

    decreaseQty: async (id: string, customizations: CartCustomization[] = []) => {
        const key = generateCartItemKey(id, customizations);
        const item = get().items.find(i => i.key === key);
        if (!item) return;

        const newQty = (item.quantity ?? 1) - 1;

        if (newQty <= 0) {
            // Remove locally
            set({ items: get().items.filter(i => i.key !== key) });

            // Remove from Appwrite if cartId exists
            if (item.cartId) {
                try {
                    await CartService.removeItem(item.cartId);
                } catch (err) {
                    console.error("Failed to remove item from Appwrite:", err);
                }
            }
            return;
        }

        // Decrease quantity locally
        set({
            items: get().items.map(i =>
                i.key === key
                    ? {
                        ...i,
                        quantity: newQty,
                        totalPrice: ((i.basePrice ?? 0) + (i.extrasTotal ?? 0)) * newQty,
                    }
                    : i
            ),
        });

        // Update Appwrite if cartId exists
        if (item.cartId) {
            try {
                await CartService.updateItemQuantity(item.cartId, newQty);
            } catch (err) {
                console.error("Failed to update quantity in Appwrite:", err);
            }
        }
    },

    clearCart: async () => {
        const user = useAuthStore.getState().user;
        const cartStore = useCartStore.getState();
        const itemsToDelete = cartStore.items.filter(i => i.cartId);

        for (const item of itemsToDelete) {
            try {
                await CartService.removeItem(item.cartId!);
            } catch (err) {
                console.error(err);
            }
        }

        set({ items: [] });
    },

    getTotalItems: () => get().items.reduce((total, item) => total + (item.quantity ?? 0), 0),

    getTotalPrice: () => get().items.reduce((total, item) => {
        const base = item.basePrice;
        const customPrice = item.customizations?.reduce((sum, c) => sum + c.price, 0) ?? 0;
        return total + (item.quantity ?? 0) * (base + customPrice);
    }, 0),
}));
