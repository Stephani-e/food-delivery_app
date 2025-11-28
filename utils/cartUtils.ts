import { CartItemType, CartCustomization } from "@/type";
import { generateCartItemKey } from '@/store/cart.store';

export const mapAppwriteItemToCartItem = (
    item: any,
    customizations: CartCustomization[] = [],
    quantity: number = 1
): CartItemType => {
    const id = item.id || item.$id;
    const key = generateCartItemKey(id, customizations);

    return {
        id,
        name: item.name,
        basePrice: item.price,
        image_url: item.image_url,
        customizations,
        quantity,
        key,
        cartId: item.cartId || undefined,
        is_checked_out: item.is_checked_out ?? false,
        note: item.note ?? '',
        totalPrice: item.price * quantity + (customizations.reduce((sum, c) => sum + (c.price ?? 0) * (c.quantity ?? 1), 0)),
    };
};
