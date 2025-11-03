import { useLocalSearchParams, useRouter } from "expo-router";
import {View, Text, Image, FlatList, ActivityIndicator, TouchableOpacity, Platform, UIManager} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Offer, Category } from "@/type";
import {getOfferCategories, getOffers} from "@/lib/appwrite";
import { LinearGradient } from 'expo-linear-gradient';
import PatternBackground from "@/components/PatternBackground";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function OfferDescription() {

    const { offersId } = useLocalSearchParams();
    const router = useRouter();

    const [offer, setOffer] = useState<Offer | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null); // track which category is open
    const [loading, setLoading] = useState(true);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    useEffect(() => {
        const fetchOfferDetails = async () => {
            try {
                //Fetch Offer Details
                const allOffers = await getOffers();
                const selected = allOffers.find((o) => o.$id === offersId);
                setOffer(selected || null);

                //Fetch its related categories
                const fetchedCategories = await getOfferCategories(offersId as string);
                // @ts-ignore
                setCategories(fetchedCategories);
            } catch (err) {
                console.log('Error Fetching Offer Details:', err);
            } finally {
                setLoading(false);
            }
        };

        if (offersId) fetchOfferDetails();
    }, [offersId]);

    if (loading) {
        return (
            <SafeAreaView className='flex-1 justify-center items-center bg-white'>
                <ActivityIndicator size="large" color="#2B7A78" />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-white">

            {/* HEADER IMAGE WITH BACK BUTTON */}
            <View style={{ position: "relative", width: "100%", height: 240, marginBottom: 8 }}>
                <Image
                    source={offer?.image_url ? { uri: offer.image_url } : require('@/assets/images/burger-one.png')}
                    style={{ width: "100%", height: "100%", borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.65)"]}
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 60,
                        borderBottomLeftRadius: 18,
                        borderBottomRightRadius: 18
                    }}
                />
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        position: "absolute",
                        top: 24,
                        left: 16,
                        backgroundColor: "rgba(255,255,255,0.88)",
                        padding: 10,
                        borderRadius: 22,
                        shadowColor: "#000",
                        shadowOpacity: 0.17,
                        shadowOffset: { width: 1, height: 2 },
                        shadowRadius: 5,
                        elevation: 3
                    }}
                >
                    <Ionicons name="arrow-back" size={22} color="#000" />
                </TouchableOpacity>

                <View style={{
                    position: "absolute",
                    bottom: 14,
                    left: 0,
                    width: "100%",
                    paddingHorizontal: 22
                }}>
                    <Text style={{
                        color: "#fff",
                        fontSize: 24,
                        fontWeight: "bold",
                        textShadowColor: "rgba(0,0,0,0.25)",
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 1
                    }}>{offer?.title}</Text>
                </View>
            </View>

            {/* DETAILS & CATEGORIES */}
            <PatternBackground
                opacity={0.07}
                patternSize={50}
                patternImage={{ uri: offer?.image_url }}
            >
                <FlatList
                    ListHeaderComponent={
                        <View style={{ paddingHorizontal: 22, paddingTop: 16 }}>
                            <Text style={{
                                fontSize: 16,
                                color: "#555",
                                lineHeight: 22,
                                marginBottom: 14
                            }}>
                                {offer?.description}
                            </Text>
                            <Text style={{
                                color: "#2B7A78",
                                fontSize: 20,
                                fontWeight: "700",
                                marginBottom: 12,
                                letterSpacing: 0.7
                            }}>
                                Categories
                            </Text>
                        </View>
                    }
                    contentContainerStyle={{
                        paddingBottom: 20,
                        paddingTop: 2,
                    }}
                    data={categories}
                    keyExtractor={(item) => item.$id}
                    renderItem={({ item }) => {
                        const isExpanded = expandedId === item.$id;

                        return (
                            <View style={{
                                marginHorizontal: 16,
                                marginBottom: 16,
                                backgroundColor: "#fff",
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: "#eee",
                                shadowColor: "#000",
                                shadowOpacity: 0.04,
                                shadowOffset: { width: 0, height: 4 },
                                shadowRadius: 9,
                                elevation: 2
                            }}>
                                <TouchableOpacity
                                    onPress={() => toggleExpand(item.$id)}
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        paddingVertical: 14,
                                        paddingHorizontal: 18,
                                        borderBottomWidth: isExpanded ? 1 : 0,
                                        borderColor: "#efefef"
                                    }}
                                >
                                    <View>
                                        <Text style={{
                                            fontWeight: "700",
                                            fontSize: 17,
                                            color: "#222",
                                            marginBottom: 3,
                                            letterSpacing: 0.1
                                        }}>{item.name}</Text>
                                        <Text style={{
                                            color: "#888",
                                            fontSize: 14
                                        }}>{item.itemCount ?? 0} items</Text>
                                    </View>
                                    <Ionicons
                                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                        size={20}
                                        color='#2B7A78'
                                    />
                                </TouchableOpacity>

                                {isExpanded && (
                                    <View style={{ paddingHorizontal: 12, paddingBottom: 14, paddingTop: 15, }}>
                                        {item.menu?.length ? item.menu.map(food => (
                                            <TouchableOpacity
                                                key={food.$id}
                                                onPress={() => router.push(`/description/item/${food.$id}`)}
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    marginBottom: 11
                                                }}
                                            >
                                                <Image
                                                    source={{ uri: food.image_url }}
                                                    style={{
                                                        width: 54,
                                                        height: 54,
                                                        borderRadius: 13,
                                                        marginRight: 13,
                                                        backgroundColor: "#f6f6f6"
                                                    }}
                                                    resizeMode="cover"
                                                />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{
                                                        fontWeight: "600",
                                                        fontSize: 15,
                                                        color: "#333"
                                                    }}>{food.name}</Text>
                                                    <Text style={{
                                                        color: "#999",
                                                        fontSize: 13
                                                    }}>${food.price}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        )) : (
                                            <Text style={{ color: "#aaa", fontSize: 13, fontStyle: "italic", textAlign: "center", marginTop: 7 }}>
                                                😔 No items found in this category
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>
                        )
                    }}
                />
            </PatternBackground>

        </SafeAreaView>
    )
}
