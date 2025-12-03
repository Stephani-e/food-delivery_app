import * as Location from "expo-location";
import { useLocationStore } from "@/store/location.store";

export const detectLocation = async ( mode: 'country-only' | 'full' = 'full' ) => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            console.warn("Location permission not granted");
            return { granted: false };
        }

        // Get the freshest, high-accuracy location
        const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
        });
        console.log("GPS coords:", pos.coords);

        let place: Partial<Location.LocationGeocodedAddress> = {};

        try {
            const reverse = await Location.reverseGeocodeAsync({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
            });
            place = reverse[0] ?? {};
            console.log("Reverse geocode result:", JSON.stringify(place, null, 2));
        } catch (err) {
            console.warn("Reverse geocode failed, using coordinates only:", err);
        }

        const country = place.country ?? place.isoCountryCode ?? "Unknown";

       if (mode === 'country-only') {
           useLocationStore.getState().setDetected({
               country,
           });

           return { granted: true, place: { country } };
       }

        useLocationStore.getState().setDetected({
            country,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
        });

        return { granted: true, coords: pos.coords, place };
    } catch (err) {
        console.error("detectLocation error:", err);
        return { granted: false, error: err };
    }
};
