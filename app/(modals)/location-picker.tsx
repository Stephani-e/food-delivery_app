import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useLocationStore } from "@/store/location.store";

export default function LocationPicker() {
    const router = useRouter();
    const setSelected = useLocationStore((s) => s.setSelected);

    const [region, setRegion] = useState<any>(null);
    const [picked, setPicked] = useState<any>(null);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            const current = await Location.getCurrentPositionAsync({});
            setRegion({
                latitude: current.coords.latitude,
                longitude: current.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        })();
    }, []);

    const confirmLocation = async () => {
        if (!picked) return;

        const reverse = await Location.reverseGeocodeAsync({
            latitude: picked.latitude,
            longitude: picked.longitude,
        });

        const place = reverse[0];

        const name =
            place.district ||
            place.subregion ||
            place.region ||
            place.name ||
            place.street ||
            'Selected Location'

        setSelected({
            country: place.country ?? "",
            name,
            latitude: picked.latitude,
            longitude: picked.longitude,
        });

        router.back();
    };

    if (!region) return null;

    return (
        <View style={{ flex: 1 }}>
            <MapView
                style={StyleSheet.absoluteFillObject}
                region={region}
                onPress={(e) => setPicked({
                    latitude: e.nativeEvent.coordinate.latitude,
                    longitude: e.nativeEvent.coordinate.longitude,
                })}
            >
                {picked && <Marker coordinate={picked} />}
            </MapView>

            <TouchableOpacity style={{
                position: 'absolute',
                bottom: 50,
                left: 20,
                right: 20,
                backgroundColor: '#f6e05e',
                padding: 15,
                borderRadius: 10,
                alignItems: 'center'
            }} onPress={confirmLocation}>
                <Text style={{
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: '600'
                }}>Confirm location</Text>
            </TouchableOpacity>
        </View>
    );
}

