import { CartCustomization, CartStore } from "@/type";
import { create } from "zustand";
import useAuthStore from "@/store/auth.store";
import { CartService } from "@/lib/cartService";
import {appwriteConfig, client} from "@/lib/appwrite";

function areCustomizationsEqual(
    a: CartCustomization[] = [],
    b: CartCustomization[] = []
): boolean {
    if (a.length !== b.length) return false;

    const aSorted = [...a].sort((x, y) => x.id.localeCompare(y.id));
    const bSorted = [...b].sort((x, y) => x.id.localeCompare(y.id));

    return aSorted.every((item, idx) => item.id === bSorted[idx].id);
}

export const useCartStore = create<CartStore>((set, get) => ({
    items: [],

    async loadCartFromServer() {
        const user = useAuthStore.getState().user;
        if (!user) return;

        const docs = await CartService.getUserCart(user.$id);
        set({
            items: docs.map((d: any) => ({
                id: d.product_id,
                name: d.product_name,
                price: d.price,
                quantity: d.quantity,
                note: d.note,
                image_url: d.image_url,
                is_checked_out: d.is_checked_out,
                customizations: (() => {
                    try {
                        return d.customizations ? JSON.parse(d.customizations) : []
                    } catch {
                        return [];
                    }
                })(),
            })),
        });
    },

    subscribeToCartRealTime() {
        const user = useAuthStore.getState().user;
        if (!user) return;

        const subscription = client.subscribe(
            [`databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.cartCollectionId}.documents`],
            (response) => {
                const { events, payload } = response;

                //Only listen for this user's cart
                if (payload.user_id !== user.$id) return;

                //Handle creates, updates, deletes
                if (
                    events.includes('databases.*.collections.*.documents.*.create') ||
                    events.includes('databases.*.collections.*.documents.*.update') ||
                    events.includes('databases.*.collections.*.documents.*.delete')
                ) {
                    console.log('Tealtime Cart Update Detected');
                    get().loadCartFromServer();
                }
            }
        );

        return () => subscription;
    },

    addItem: async (item) => {
        const user = useAuthStore.getState().user;
        const customizations = item.customizations ?? [];

        const existing = get().items.find(
            (i) =>
                i.id === item.id &&
                areCustomizationsEqual(i.customizations ?? [],
                    customizations
                )
        );

        if (existing) {
            set({
                items: get().items.map((i) =>
                    i.id === item.id &&
                    areCustomizationsEqual(i.customizations ?? [], customizations)
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                ),
            });
        } else {
            set({
                items: [...get().items, { ...item, quantity: 1, customizations }],
            });
        }

        //Send to Appwrite (only if logged in)
        if (user) {
            try {
                console.log("🧩 Adding item to Appwrite:", item);
                await CartService.addOrUpdateItem(user.$id, item, customizations);
                console.log('Cart item added to Appwrite, for:', item.name);
            } catch (error) {
                console.log('Error adding cart item to Appwrite:', error);
            }
        }
    },

    removeItem: async (id, customizations = []) => {
        const user = useAuthStore.getState().user;

        //Update Locally
        set({
            items: get().items.filter(
                (i) =>
                    !(
                        i.id === id &&
                        areCustomizationsEqual(i.customizations ?? [],
                            customizations
                        )
                    )
            ),
        });

        //Update Appwrite
        if (user) {
            try {
                const docs = await CartService.getUserCart(user.$id);
                const target = docs.find(
                    (d: any) =>
                        d.product_id === id &&
                        areCustomizationsEqual(
                            d.customizations ? JSON.parse(d.customizations) : [],
                            customizations
                        )
                );
                set({
                    items: get().items.filter((i) => i.id !== id) });
                if (target) {
                    await CartService.removeItem(target.$id)
                    console.log('Cart item removed from Appwrite, for:', name);
                }
            } catch (error) {
                console.log('Error removing cart item from Appwrite:', error);
            }
        }
    },

    increaseQty: async (id, customizations = []) => {
        const user = useAuthStore.getState().user;
        const item = get().items.find(
            (i) =>
                i.id === id &&
                areCustomizationsEqual(i.customizations ?? [], customizations)
        );
        if (!item) return;

        const newQty = item.quantity + 1;

        set({
            items: get().items.map((i) =>
                i.id === id &&
                areCustomizationsEqual(i.customizations ?? [], customizations)
                    ? { ...i, quantity: newQty }
                    : i
            ),
        });

        if (user) {
            const docs = await CartService.getUserCart(user.$id);
            const target = docs.find(
                (d: any) =>
                    d.product_id === id &&
                    areCustomizationsEqual(
                        d.customizations ? JSON.parse(d.customizations) : [],
                        customizations
                    )
            );
            if (target) await CartService.updateItemQuantity(target.$id, newQty)
        }
    },

    decreaseQty: async (id, customizations = []) => {
        const user = useAuthStore.getState().user;
        const item = get().items.find(
            (i) =>
                i.id && areCustomizationsEqual(i.customizations ?? [], customizations)
        );
        if (!item) return;

        const newQty = item.quantity - 1;

        set({
            items: get()
                .items.map((i) =>
                    i.id === id &&
                    areCustomizationsEqual(i.customizations ?? [], customizations)
                        ? { ...i, quantity: newQty}
                        : i
                )
                .filter((i) => i.quantity > 0),
        });

        if (user) {
            const docs = await CartService.getUserCart(user.$id);
            const target = docs.find(
                (d: any) =>
                    d.product_id === id &&
                    areCustomizationsEqual(
                        d.customizations ? JSON.parse(d.customizations) : [],
                        customizations
                    )
            );
            if (target) await CartService.updateItemQuantity(target.$id, newQty)
        }
    },

    clearCart: async () => {
        const user = useAuthStore.getState().user;

        //clear locally
        set({items: []})
        if (user) {
            try {
                await CartService.clearCart(user.$id)
            } catch (error) {
                console.error('Error Clearing Cart:', error)
            }
        }
    },

    getTotalItems: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

    getTotalPrice: () =>
        get().items.reduce((total, item) => {
            const base = item.price;
            const customPrice =
                item.customizations?.reduce(
                    (s: number, c: CartCustomization) => s + c.price,
                    0
                ) ?? 0;
            return total + item.quantity * (base + customPrice);
        }, 0),
}));