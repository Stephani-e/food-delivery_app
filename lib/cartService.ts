import { databases, Query } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite";
import {ID} from "react-native-appwrite";

const dbId = appwriteConfig.databaseId;
const cartId = appwriteConfig.cartCollectionId;

export const CartService = {
    async getUserCart(userId: string) {
        const res = await databases.listDocuments(dbId, cartId, [
            Query.equal('user_id', userId),
            Query.equal('is_checked_out', false),
        ]);
        return res.documents;
    },

    async addOrUpdateItem(userId: string, item: any, customizations: any[]) {
        const res = await databases.listDocuments(dbId, cartId, [
            Query.equal('user_id', userId),
            Query.equal('product_id', item.id),
            Query.equal('is_checked_out', false),
        ]);

        if (res.documents.length > 0) {
            // Item already in cart — increment quantity
            const existing = res.documents[0];
            await databases.updateDocument(dbId, cartId, existing.$id, {
                quantity: (existing.quantity ?? 0) + 1,
            });
        } else {
            await databases.createDocument(dbId, cartId, ID.unique(), {
                user_id: userId,
                product_id: item.id,
                product_name: item.name,
                price: item.price ?? 0,
                quantity: item.quantity || 1,
                is_checked_out: false,
                note: item.note || '',
                image_url: item.image_url || '',
                customizations: JSON.stringify(item.customizations) ?? [] ,
            });
        }
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