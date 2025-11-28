import { databases, Query } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwriteConfig";
import {ID} from "react-native-appwrite";
import {mapAppwriteItemToCartItem} from "@/utils/cartUtils";

const dbId = appwriteConfig.databaseId;
const cartId = appwriteConfig.cartCollectionId;

// Generate a unique key for an item + customizations
const generateCartKey = (itemId: string, customizations: any[] = []) => {
    if (!customizations || customizations.length === 0) return itemId;
    const sorted = customizations
        .map(c => `${c.id}:${c.quantity ?? 1}`)
        .sort()
        .join('|');
    return `${itemId}_${sorted}`;
};

export const CartService = {
    async getUserCart(userId: string) {
        const res = await databases.listDocuments(dbId, cartId, [
            Query.equal('user_id', userId),
            Query.equal('is_checked_out', false),
        ]);
        return res.documents;
        // return res.documents.map(doc => mapAppwriteItemToCartItem(doc, JSON.parse(doc.customizations || '[]')));
    },

    async addOrUpdateItem(userId: string, item: any, customizations: any[], extrasTotal: number, totalPrice: number, incrementQty = false): Promise<{ $id: string; key: string}> {
        const productId = item.$id ?? item.id;
        if (!productId) throw new Error(`Item must have an ID. Make sure you're passing the item object directly from the store, not a proxy object.`)

        const key = generateCartKey(productId, customizations);

        let docId: string;

        console.log("📝 CartService.addOrUpdateItem called", { userId, itemId: item.$id, customizations, key });

        const res = await databases.listDocuments(dbId, cartId, [
            Query.equal('user_id', userId),
            Query.equal('cart_key', key),
            Query.equal('is_checked_out', false),
        ]);

        if (res.documents.length > 0) {
            // Item already in cart — increment quantity
            const existing = res.documents[0];
            if (incrementQty) {
                await databases.updateDocument(dbId, cartId, existing.$id, {
                    quantity: (existing.quantity ?? 0) + 1,
                });
            }

            docId = existing.$id;
        } else {
            console.log("➕ Creating new cart item in Appwrite");
            const newDoc = await databases.createDocument(dbId, cartId, ID.unique(), {
                user_id: userId,
                product_id: productId,
                product_name: item.name,
                itemPrice: item.itemPrice ?? 0,
                quantity: item.quantity ?? 1,
                is_checked_out: false,
                note: item.note || '',
                image_url: item.image_url || '',
                customizations: JSON.stringify(customizations) ?? [] ,
                cart_key: key,
                extrasTotal: extrasTotal,
                total: totalPrice,
            });
            docId = newDoc.$id;
        }

        return { $id: docId, key };
    },

    async updateItemQuantity(cartItemId: string, quantity: number) {
        await databases.updateDocument(dbId, cartId, cartItemId, { quantity });
    },

    async removeItem(cartItemId: string) {
        await databases.deleteDocument(dbId, cartId, cartItemId);
    },

    async clearCart(userId: string) {
        const res = await databases.listDocuments(dbId, cartId, [
            Query.equal('user_id', userId),
            Query.equal('is_checked_out', false),
        ]);

        await Promise.all(
            res.documents.map(async (doc) => {
                databases.deleteDocument(dbId, cartId, doc.$id);
            })
        )
    }
}