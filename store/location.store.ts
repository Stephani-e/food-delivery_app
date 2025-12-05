import { create } from "zustand";
import AsyncStorage from '@react-native-async-storage/async-storage'
import {useCartStore} from "@/store/cart.store";
import {Alert} from "react-native";

type BaseLocation = {
    country: string;
    name?: string;
    latitude?: number;
    longitude?: number;
    isDeliverable?: boolean;
};

/** What GPS detection gives us */
type DetectedLocation = {
    country: string;
    latitude?: number;
    longitude?: number;
};

/** What user explicitly chooses */
type SelectedLocation = {
    country: string;
    name: string;
    latitude: number;
    longitude: number;
};


type LocationStore = {
   detected: DetectedLocation | null;
   selected: SelectedLocation | null;
   isDeliverable: boolean;
   hydrated: boolean;

   hydrate: () => Promise<void>;
   setDetected: (location: DetectedLocation | null) => void;
   setSelected: (location: SelectedLocation) => void;
   setIsDeliverable: (v: boolean) => void
   clearSelected: () => void;

   getActiveCountry: () => string | null;
};

const Location_Key = 'selected_location';

export const useLocationStore = create<LocationStore>((set, get) => ({

    detected: null,
    selected: null,
    isDeliverable: false,
    hydrated: false,

    hydrate: async () => {
        try {
            const saved = await AsyncStorage.getItem(Location_Key);
            if (saved) {
                set({ selected: JSON.parse(saved) });
            }
        } catch (err) {
            console.error("Failed to restore location:", err);
        } finally {
            set({ hydrated: true });
        }
    },

    setDetected: (location) =>
        set({
            detected: location
        }),

    setSelected: (location) => {
        const {cartMeta, clearCart, setCartMeta} = useCartStore.getState();

        // If the cart exists and the new location country differs
        if (cartMeta?.country && cartMeta.country !== location.country) {
            Alert.alert(
                'Location Changed',
                'Your cart items have been cleared because they belong to a different location.'
            );
            clearCart();
            setCartMeta({branchId: undefined, country: location.country});
        }

        set({
            selected: location,
            isDeliverable: false,
        });

        AsyncStorage.setItem(Location_Key, JSON.stringify(location));
    },

    setIsDeliverable: (isDeliverable) =>
        set({
            isDeliverable
        }),

    clearSelected: () => {
        set({
            selected: null,
            isDeliverable: false,
        });

        AsyncStorage.removeItem(Location_Key);
    },

    getActiveCountry: () => {
        const {selected, detected} = get();
        return selected?.country ?? detected?.country ?? null;
    },
}));
