import { useEffect } from "react";
import { useCartStore } from "@/store/cart.store";

export function useDebugCart() {
    const items = useCartStore((s) => s.items);
    const preview = useCartStore((s) => s.preview);

    useEffect(() => {
        console.log("🌀 Cart items changed:", items.length);
    }, [items]);

    useEffect(() => {
        console.log("👀 Preview changed:", preview);
    }, [preview]);
}
