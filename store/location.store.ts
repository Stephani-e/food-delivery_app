import { create } from "zustand";

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

   setDetected: (location: DetectedLocation | null) => void;
   setSelected: (location: SelectedLocation) => void;
   setIsDeliverable: (v: boolean) => void
   clearSelected: () => void;

   getActiveCountry: () => string | null;
};

export const useLocationStore = create<LocationStore>((set, get) => ({
    detected: null,
    selected: null,
    isDeliverable: false,

    setDetected: (location) =>
        set({
            detected: location
        }),

    setSelected: (location) =>
        set({
            selected: location,
            isDeliverable: false,
        }),

    setIsDeliverable: (isDeliverable) =>
        set({
            isDeliverable
        }),

    clearSelected: () =>
        set({
            selected: null,
            isDeliverable: false,
        }),

    getActiveCountry: () => {
        const { selected, detected } = get();
        return selected?.country ?? detected?.country ?? null;
    }
}));
