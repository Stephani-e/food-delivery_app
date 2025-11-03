import { useLocalSearchParams, useRouter } from "expo-router";
import {View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {Customization, MenuItem} from "@/type";
import {getMenuCustomizations, getMenuItemById} from "@/lib/appwrite";
import {useCartStore} from "@/store/cart.store";
import {images} from "@/constants";

export default function ItemId() {
    const { itemId } = useLocalSearchParams();
    // console.log("🔹 Item ID:", itemId);

    const router = useRouter();
    const { addItem, increaseQty, decreaseQty, items  } = useCartStore();

    const [item, setItem] = useState<MenuItem | null>(null);
    const [customizations, setCustomizations] = useState<Customization[]>([]);
    const [loading, setLoading] = useState(true);

    const cartItem = items.find(i => i.id === item?.$id);
    const quantity = cartItem?.quantity ?? 0;
    const cartCustomizations = cartItem?.customizations ?? [];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [menuResponse, customizationResponse] = await Promise.all([
                    getMenuItemById(itemId as string),
                    getMenuCustomizations(itemId as string),
                ]);
                if (menuResponse) setItem(menuResponse);
                if (customizationResponse) setCustomizations(customizationResponse);
            } catch (err) {
                console.error("Error fetching menu item:", err);
            } finally {
                setLoading(false);
            }
        };
        if(itemId) fetchData();
    }, [itemId]);

    //console.log("🔍 Customizations:", customizations);
    const toppings = customizations.filter(c => c.type?.toLowerCase().includes("topping"));
    const sides = customizations.filter(c => c.type?.toLowerCase().includes("side"));

    // console.log("toppings:", toppings);
    // console.log("sides:", sides);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#F89D3A" />
            </View>
        );
    }

    if (!item) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <Text className="text-gray-500">Item not found 😔</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
            {/* Top bar */}
            <View style={{flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18, paddingBottom: 15, paddingTop: 50}}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#222" />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Ionicons name="search" size={22} color="#222" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{paddingHorizontal: 10,}} >
                    <Text style={{ fontWeight: "bold", fontSize: 22, marginLeft: 22 }}>{item.name}</Text>
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'stretch',
                        justifyContent: 'space-between',
                        paddingHorizontal: 10,
                        marginVertical: 10
                    }}
                >
                    <View style={{ flex: 1, paddingRight: 10, justifyContent: 'space-around', gap: 10 }}>
                        {/* Core Info */}
                        <Text style={{ color: "#989FAA", fontSize: 16, marginLeft: 22 }}>
                            {typeof item.categories === 'object'
                                ? item.categories?.name
                                : 'Uncategorized'
                            }
                        </Text>

                        {/*Rating*/}
                        <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 22, marginTop: 4 }}>
                            <Ionicons name="star" size={18} color="#FDBB2C" />
                            <Text style={{marginLeft: 5, fontSize: 16, color: "#FDBB2C", fontWeight: "500"}}>{item.avgRating?.toFixed(1)}/5</Text>
                            {item.reviewCount ? (
                                <Text style={{ marginLeft: 7, fontSize: 15, color: "#aaa" }}>({item.reviewCount})</Text>
                            ) : null}
                        </View>

                        {/* Price */}
                        <Text style={{fontWeight: "bold", color: "#F89D3A", fontSize: 22, marginLeft: 22, marginTop: 7}}>${item.price.toFixed(2)}</Text>

                        {/* Nutrition Info */}
                        <View style={{flexDirection: "row", marginLeft: 22, marginTop: 8, marginBottom: 12}}>
                            <View style={{ flexDirection: 'column', gap: 5 }}>
                                <Text style={{ fontWeight: "600", color: "#777", marginRight: 13 }}>Calories</Text>
                                <Text style={{ color: "#2B7A78" }}>{item.calories} Cal</Text>
                            </View>
                            <View style={{ flexDirection: 'column', gap: 5 }}>
                                <Text style={{ fontWeight: "600", color: "#777" }}> Protein</Text>
                                <Text style={{ color: "#2B7A78" }}>{item.protein}g</Text>
                            </View>
                        </View>


                        {typeof item.categories === "object" &&
                            item.categories?.name?.toLowerCase().includes("burger") && (
                                <Text style={{ marginLeft: 22, color: "#777", marginBottom: 7 }}>
                                    Bun Type: <Text style={{ color: "#111" }}>{item.bun_type}</Text>
                                </Text>
                            )}
                    </View>

                    {/* Product Image */}
                    <View
                        style={{
                            width: '50%',
                            alignItems: "flex-end",
                            justifyContent: 'center'
                        }}
                    >
                        <Image
                            source={{ uri: item.image_url }}
                            style={{
                                width: '100%',
                                aspectRatio: 1,
                                borderRadius: 22,
                                shadowColor: "#aaa",
                                shadowRadius: 10,
                                shadowOpacity: 0.17,
                                shadowOffset: { width: 0, height: 7 }
                            }}
                            resizeMode="cover"
                        />
                    </View>
                </View>

                {/* Meta Row */}
                <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#FFF6ED",
                    borderRadius: 14,
                    padding: 11,
                    marginHorizontal: 22,
                    marginBottom: 20
                }}>
                    <Ionicons name="cash" size={15} color="#F89D3A" />
                    <Text style={{ marginLeft: 7, marginRight: 18, fontWeight: "700", color: "#F89D3A" }}>{item.delivery}</Text>
                    <Ionicons name="time" size={15} color="#F89D3A" />
                    <Text style={{ marginLeft: 7, marginRight: 18, fontWeight: "600", color: "#111" }}>{item.deliveryTime}</Text>
                    <Ionicons name="star" size={15} color="#FDBB2C" style={{ marginRight: 5 }} />
                    <Text style={{ color: "#FDBB2C", fontWeight: "600" }}>{item.avgRating}</Text>
                </View>


                {/* Description */}
                <Text style={{
                    marginHorizontal: 22, color: "#555", marginBottom: 16,
                    fontSize: 15, lineHeight: 22
                }}>{item.description}</Text>

                {/* Toppings */}
                <Text
                    style={{fontWeight: "700", fontSize: 16, marginLeft: 22, marginBottom: 5}}
                >
                    Toppings
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 22, marginBottom: 10 }}>
                    {toppings.map(top => (
                        <View
                            key={top.$id}
                            style={{
                                width: 74,
                                height: 90,
                                backgroundColor: "#fff",
                                borderRadius: 20,
                                alignItems: "center",
                                justifyContent: "flex-start",
                                marginRight: 16,
                                shadowColor: "#000",
                                shadowRadius: 8,
                                shadowOpacity: 0.12,
                                shadowOffset: { width: 0, height: 3 },
                            }}
                        >
                            <Image
                                source={{ uri: top.image_url }}
                                style={{
                                    width: 40,
                                    height: 40,
                                    marginTop: 12,
                                    marginBottom: 6,
                                    resizeMode: 'contain'
                                }}
                            />

                            {/* Bottom Section */}
                            <View
                                style={{
                                    width: '100%',
                                    backgroundColor: '#2E2E2E',
                                    borderBottomLeftRadius: 20,
                                    borderBottomRightRadius: 20,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingHorizontal: 12,
                                    paddingVertical: 8
                                }}
                            >
                                <Text
                                    style={{
                                        color: "#fff",
                                        fontWeight: "600",
                                        fontSize: 8,
                                        maxWidth: 38
                                    }}
                                    numberOfLines={1}
                                    ellipsizeMode='tail'
                                >
                                        {top.name}
                                </Text>
                                <View
                                    style={{
                                        backgroundColor: '#F95837',
                                        borderRadius: 10,
                                        width: 10,
                                        height: 10,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Ionicons name="add" size={7} color="#fff" />
                                </View>
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* Sides */}
                <Text
                    style={{
                        fontWeight: "700", fontSize: 16, marginLeft: 22, marginBottom: 5, marginTop: 15
                    }}
                >
                    Side options
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 22, marginBottom: 22, marginTop: 10 }}>
                    {sides.map(side => (
                        <View key={side.$id}
                              style={{
                                  width: 74,
                                  height: 90,
                                  backgroundColor: "#fff",
                                  borderRadius: 20,
                                  alignItems: "center",
                                  justifyContent: "flex-start",
                                  marginRight: 16,
                                  shadowColor: "#000",
                                  shadowRadius: 8,
                                  shadowOpacity: 0.12,
                                  shadowOffset: { width: 0, height: 3 },
                        }}>
                            <Image
                                source={{ uri: side.image_url }}
                                style={{
                                    width: 45,
                                    height: 45,
                                    resizeMode: 'contain',
                                }}
                            />

                            {/* Bottom Section */}
                            <View
                                style={{
                                    width: '100%',
                                    backgroundColor: '#2E2E2E',
                                    borderBottomLeftRadius: 20,
                                    borderBottomRightRadius: 20,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingHorizontal: 12,
                                    paddingVertical: 8
                                }}
                            >
                                <Text
                                    style={{
                                        color: "#fff",
                                        fontWeight: "600",
                                        fontSize: 8,
                                        maxWidth: 38
                                    }}
                                    numberOfLines={1}
                                    ellipsizeMode='tail'
                                >
                                    {side.name}
                                </Text>
                                <View
                                    style={{
                                        backgroundColor: '#F95837',
                                        borderRadius: 10,
                                        width: 10,
                                        height: 10,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Ionicons name="add" size={7} color="#fff" />
                                </View>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </ScrollView>

            {/* Sticky Add to Cart */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#fff",
                    padding: 15,
                    borderRadius: 16,
                    shadowColor: "#222",
                    shadowOffset: { width: 0, height: -1 },
                    shadowRadius: 4,
                    shadowOpacity: 0.09,
                    marginHorizontal: 18,
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 6
                }}
            >
                <TouchableOpacity
                    onPress={() => decreaseQty(item.$id, cartCustomizations)}
                    style={{
                        width: 40,
                        height: 40,
                        backgroundColor: "#FFF5E3",
                        borderRadius: 8,
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    <Image
                        source={images.minus}
                        className="size-1/3"
                        resizeMode="contain"
                        tintColor={"#FF9C01"}
                    />
                </TouchableOpacity>

                <Text style={{ fontSize: 15, marginHorizontal: 14, fontWeight: "600" }}>{quantity}</Text>
                    <TouchableOpacity
                        onPress={() => increaseQty(item.$id, cartCustomizations)}
                        style={{
                            width: 40,
                            height: 40,
                            backgroundColor: "#FFF5E3",
                            borderRadius: 8,
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <Image
                            source={images.plus}
                            className="size-1/3"
                            resizeMode="contain"
                            tintColor={"#FF9C01"}
                        />
                </TouchableOpacity>

                {/*ADD TO CART BUTTON*/}
                <TouchableOpacity
                    onPress={() => addItem( {
                        id: item.$id,
                        name: item?.name,
                        image_url: item?.image_url,
                        price: item?.price,
                        customizations: cartCustomizations,
                    })}
                    style={{
                      flex: 1,
                      marginLeft: 18,
                      backgroundColor: "#F89D3A",
                      borderRadius: 11,
                      paddingVertical: 14,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center"
                    }}
                >
                    <Ionicons name="cart" color="#fff" size={15} style={{ marginRight: 6 }} />
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                        Add to cart ({item.price.toFixed(2)})
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
