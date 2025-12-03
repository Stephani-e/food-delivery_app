import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ImageBackground,
    Image,
    LayoutAnimation,
    Platform,
    UIManager, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useLocationStore } from "@/store/location.store";
import { getBranchesByLocation } from "@/lib/appwrite";
import { haversineKm } from "@/lib/location/distance";
import { images } from "@/constants";
import { Ionicons } from "@expo/vector-icons";

if (Platform.OS === "android") {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type Branch = {
    $id: string;
    country: string;
    city: string;
    name?: string;
    latitude: number;
    longitude: number;
    deliveryRadiusKm: number;
};

type ExplorerState =
    | "loading"
    | "no-country-branches"
    | "no-nearby-branches"
    | "available";

export default function LocationExplorer() {
    const router = useRouter();
    const { detected, setSelected } = useLocationStore();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [expandedCity, setExpandedCity] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        setLoading(true);
        const country = detected?.country ?? "Nigeria";
        const data = await getBranchesByLocation(country);

        setBranches(
            data.map(doc => ({
                $id: doc.$id,
                country: doc.country,
                city: doc.city,
                name: doc.name ?? `${doc.city} Branch`,
                latitude: doc.latitude,
                longitude: doc.longitude,
                deliveryRadiusKm: doc.deliveryRadiusKm,
            }))
        );
        setLoading(false);
    };

    const hasAnyBranch = branches.length > 0;

    const hasDeliverableBranch = branches.some(branch => {
        if (!detected?.latitude || !detected?.longitude) return false;

        const distance = haversineKm(
            detected.latitude,
            detected.longitude,
            branch.latitude,
            branch.longitude
        );

        return distance <= branch.deliveryRadiusKm;
    });

    const explorerState: ExplorerState = loading
        ? "loading"
        : !hasAnyBranch
            ? "no-country-branches"
            : !hasDeliverableBranch
                ? "no-nearby-branches"
                : "available";

    const groupedByCity = branches.reduce((acc: Record<string, Branch[]>, b) => {
        acc[b.city] = acc[b.city] || [];
        acc[b.city].push(b);
        return acc;
    }, {});

    const toggleCity = (city: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedCity(prev => (prev === city ? null : city));
    };

    const handleSelectBranch = (branch: Branch) => {
        setSelected({
            country: branch.country,
            name: branch.name ?? branch.city,
            latitude: branch.latitude,
            longitude: branch.longitude,
        });
    };

    if (explorerState === "loading") {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" />
                <Text style={styles.loaderText}>Checking available locations…</Text>
            </View>
        );
    }

    if (explorerState === "no-country-branches") {
        return (
            <View style={styles.container}>
                <ImageBackground source={images.burgerTwo} style={styles.hero}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={16} color="#fff" />
                    </TouchableOpacity>
                </ImageBackground>

                <View style={styles.emptyWrap}>
                    <Ionicons name="earth-outline" size={46} color="#aaa" />
                    <Text style={styles.emptyTitle}>
                        UEAT isn’t available here yet
                    </Text>
                    <Text style={styles.emptyText}>
                        We currently don’t deliver to{" "}
                        <Text style={{ fontWeight: "600" }}>
                            {detected?.country ?? "this country"}
                        </Text>.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* Hero */}
            <ImageBackground source={images.burgerTwo} style={styles.hero}>
                {/* Back Button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={15} color="#fff" />
                </TouchableOpacity>

                {/* Text Wrapper */}
                <View style={styles.heroTextWrap}>
                    <Text style={styles.heroTitle}>Welcome to UEAT</Text>
                    <Text style={styles.heroSubtitle}>
                        Find what’s cooking near you
                    </Text>
                </View>
            </ImageBackground>

            <FlatList
                ListHeaderComponent={() => (

                    <View className="bg-green-600 p-4 rounded-xl shadow-md flex-row items-start space-x-2 mb-5">
                        {/* Emoji or Icon */}
                        <Ionicons name='location-outline' size={15} color='#fff' />

                        {/* Message */}
                        <Text className="text-sm text-white-100 flex-1 ml-2">
                            <Text className="font-semibold"> See if delivery is available in your locations. </Text>
                        </Text>
                    </View>
                )}
                data={Object.keys(groupedByCity)}
                keyExtractor={item => item}
                contentContainerStyle={styles.list}
                renderItem={({ item: city }) => {
                    const cityBranches = groupedByCity[city];
                    const isExpanded = expandedCity === city;

                    return (
                        <View style={styles.cityCard}>
                            {/* City Header */}
                            <TouchableOpacity onPress={() => toggleCity(city)} style={styles.cityHeader}>
                                <View style={{ flex: 1, paddingRight: 10 }} >
                                    <Text style={styles.cityName}> {city} </Text>
                                    <Text style={styles.subText}>
                                        { cityBranches.length} branch{cityBranches.length > 1 ? "es" : ""  }
                                    </Text>
                                </View>

                                <Ionicons
                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                    size={15}
                                    color="#555"
                                />
                            </TouchableOpacity>

                            {/* Branches */}
                            {isExpanded &&
                                cityBranches.map(branch => {
                                    const distance =
                                        detected?.latitude && detected?.longitude
                                            ? haversineKm(
                                                detected.latitude,
                                                detected.longitude,
                                                branch.latitude,
                                                branch.longitude
                                            )
                                            : 0;

                                    const canDeliver = distance <= branch.deliveryRadiusKm;

                                    return (
                                        <TouchableOpacity
                                            key={branch.$id}
                                            disabled={!canDeliver}
                                            onPress={() => handleSelectBranch(branch)}
                                            style={[
                                                styles.branchItem,
                                                !canDeliver && styles.disabled,
                                            ]}
                                        >
                                            <View style={{ flex: 1, paddingRight: 10 }} >
                                                <Text style={styles.branchName}> {branch.name} </Text>
                                                <Text style={styles.branchMeta}>
                                                    {canDeliver
                                                        ? ` This branch delivers within the range of ${branch.deliveryRadiusKm}km. `
                                                        : "Out of delivery range"}
                                                </Text>
                                            </View>

                                            {canDeliver && (
                                                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                        </View>
                    );
                }}
            />
        </View>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fafafa" },

    loader: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loaderText: { marginTop: 10, fontSize: 13, color: "#666" },


    backButton: {
        position: "absolute",
        top: 45,
        left: 16,
        width: 30,
        height: 30,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "center",
        alignItems: "center",
    },

    hero: {
        height: 150,
        justifyContent: "flex-end",
        padding: 10,
    },
    heroTextWrap: {
        alignSelf: "center",
        alignItems: 'center',
        maxWidth: "85%",
        backgroundColor: "rgba(0,0,0,0.15)",
        paddingVertical: 10,
        paddingHorizontal: 40,
        borderRadius: 14,
        backdropFilter: `blur(4px)`,
    },
    heroTitle: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 2,
        textAlign: 'center'
    },
    heroSubtitle: {
        color: "rgba(255,255,255,0.9)",
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center'
    },

    list: { padding: 16, paddingBottom: 40 },

    cityCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        marginBottom: 14,
        overflow: "hidden",
        elevation: 2,
    },

    cityHeader: {
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    cityName: { fontSize: 17, fontWeight: "600" },
    subText: { fontSize: 12, color: "#666", marginTop: 3 },

    branchItem: {
        borderTopWidth: 1,
        borderTopColor: "#eee",
        padding: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    branchName: { fontWeight: "600", fontSize: 15 },
    branchMeta: { fontSize: 12, color: "#666", marginTop: 2 },

    disabled: { opacity: 0.45 },

    warningBox: {
        backgroundColor: "#fff7ed",
        padding: 14,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 14,
    },
    warningText: {
        fontSize: 12,
        color: "#9a3412",
        marginLeft: 8,
        flex: 1,
    },

    emptyWrap: {
        alignItems: "center",
        padding: 30,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginTop: 12,
    },
    emptyText: {
        fontSize: 13,
        color: "#666",
        textAlign: "center",
        marginTop: 6,
    },
});
