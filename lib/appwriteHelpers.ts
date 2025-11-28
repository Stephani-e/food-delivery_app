import {appwriteConfig} from "@/lib/appwriteConfig";
import {databases} from "@/lib/appwrite";
import {useCartStore, generateCartItemKey} from "@/store/cart.store";
import {Board, CartCustomization, MenuItem} from "@/type";
import React from "react";
import {CartService} from "@/lib/cartService";
import useAuthStore from "@/store/auth.store";

function safeParseCustomizations(input: any): CartCustomization[] {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === "string") {
        try {
            return JSON.parse(input);
        } catch (e) {
            console.warn("Failed to parse customizations:", input);
            return [];
        }
    }
    console.warn("Unexpected customizations type:", input);
    return [];
}

function normalizeCustomization(c: any): CartCustomization {
    return {
        id: c.id ?? c.$id ?? `${Date.now()}-${Math.random()}`,
        name: c.name ?? "Extra",
        price: Number(c.price ?? 0),
        quantity: Number(c.quantity ?? 1),
        type: c.type ?? "custom",
    };
}

export const updateBoardActiveStatus = async (boardId: string, isActive: boolean) => {
    await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.customizationsBoardsCollectionId!,
        boardId,
        { isActive }
    );
};

export const addBoardToCart = async (board: Board, item: MenuItem, setBoards: Function) => {
    console.log("🔥 addBoardToCart TRIGGERED with:", {
        boardId: board?.$id,
        itemId: item?.$id,
    });

    const cartStore = useCartStore.getState();
    const parsedCustomizations = safeParseCustomizations(board.customizations);
    const normalizedCustomizations = parsedCustomizations.map(normalizeCustomization);

    const userId = useAuthStore.getState().user?.$id;
    if (!userId) throw new Error("No user found. Cannot add board to cart.");

    console.log("📤 Sending to Appwrite with:", {
        userId,
        item,
        customizations: normalizedCustomizations,
    });

    const extrasTotal = normalizedCustomizations.reduce(
        (sum, c) => sum + (c.price || 0) * (c.quantity || 1),
        0
    );

    const totalPrice = item.itemPrice + extrasTotal;

    // --- Check if an item with same ID & same customizations (ignoring quantity) exists ---
    const existingItem = cartStore.items.find(i =>
        i.id === item.$id &&
        JSON.stringify(i.customizations?.map(c => ({id: c.id, type: c.type}))) ===
        JSON.stringify(normalizedCustomizations.map(c => ({id: c.id, type: c.type})))
    );

    if (existingItem) {
        //set inacive
        setBoards((prev: Board[]) =>
            prev.map(b => (b.$id === board.$id ? { ...b, isActive: false } : b))
        );

        try {
            await updateBoardActiveStatus(board.$id, false);
        } catch (err) {
            console.error("Failed to update board active status:", err);
        }

        // Increase quantity instead of adding a duplicate
        cartStore.increaseQty(existingItem.id, existingItem.customizations!);

        // Optionally, you can update Appwrite as well if your store doesn't do it automatically
        if (existingItem.cartId) {
            try {
                await CartService.updateItemQuantity(existingItem.cartId, existingItem.quantity! + 1);
            } catch (err) {
                console.error("Failed to update Appwrite quantity:", err);
            }
        }
        return;
    }

    const { $id, key } = await CartService.addOrUpdateItem(
        userId,
        item,
        normalizedCustomizations,
        extrasTotal,
        totalPrice,
        !!cartStore.items.find(i => i.key === key)
    );

    setBoards((prev: Board[]) =>
        prev.map(b => (b.$id === board.$id ? { ...b, isActive: false } : b))
    );

    try {
        await updateBoardActiveStatus(board.$id, false);
    } catch (err) {
        console.error("Failed to update board active status:", err);
    }

};

export const addAllBoardsToCart = async (
    boards: Board[],
    item: MenuItem,
    setBoards: React.Dispatch<React.SetStateAction<Board[]>>
) => {
    const cartStore = useCartStore.getState();
    const userId = useAuthStore.getState().user?.$id;
    if (!userId) throw new Error("No user found. Cannot add boards to cart.");

    const activeBoards = boards.filter(b => b.isActive);

    for (const board of activeBoards) {
        // Parse and normalize customizations
        const parsedCustomizations = safeParseCustomizations(board.customizations);
        const normalizedCustomizations = parsedCustomizations.map(normalizeCustomization);

        const extrasTotal = normalizedCustomizations.reduce(
            (sum, c) => sum + (c.price || 0) * (c.quantity || 1),
            0
        );

        const totalPrice = item.itemPrice + extrasTotal;

        const existingItem = cartStore.items.find(i => i.key === key);
        // Add or update in Appwrite
        const { key, $id } = await CartService.addOrUpdateItem(
            userId,
            item,
            normalizedCustomizations,
            extrasTotal,
            totalPrice,
            !!existingItem
        );

        // Add or update in local cart store
        if (!existingItem) {
            cartStore.addItem({
                id: item.$id,
                name: item.name,
                image_url: item.image_url,
                basePrice: item.itemPrice,
                quantity: 1,
                customizations: normalizedCustomizations,
                extrasTotal,
                totalPrice,
                key,
                cartId: $id,
            });
        }

        // Update board status locally
        setBoards(prev =>
            prev.map(b => (b.$id === board.$id ? { ...b, isActive: false } : b))
        );

        // Update board status in Appwrite
        try {
            await updateBoardActiveStatus(board.$id, false);
        } catch (err) {
            console.error("Failed to update board active status:", err);
        }
    }
};

export const reuseBoard = async (
    board: Board,
    setBoards: React.Dispatch<React.SetStateAction<Board[]>>
) => {
    setBoards((prev: Board[]) =>
        prev.map((b: Board) => (b.$id === board.$id ? { ...b, isActive: true } : b))
    );

    try {
        await updateBoardActiveStatus(board.$id, true);
    } catch (err) {
        console.error("Failed to update board active status:", err);
    }
};

