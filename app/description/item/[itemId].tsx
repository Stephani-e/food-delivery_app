import { useLocalSearchParams, useRouter } from "expo-router";
import {View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {Board, CartCustomization, Customization, MenuItem} from "@/type";
import {
    deactivateBoard,
    getBoardsByUser,
    getBoardsForItem,
    getMenuCustomizations,
    getMenuItemById, useBoard
} from "@/lib/appwrite";
import {useCartStore} from "@/store/cart.store";
import CustomizeAlert from "@/components/Reusable&Custom/CutomizeAlert";
import useAuthStore from "@/store/auth.store";
import Toast from "react-native-toast-message";
import { addBoardToCart, addAllBoardsToCart, reuseBoard } from "@/lib/appwriteHelpers";
import CustomizationPicker from "@/components/Reusable&Custom/CustomizationPicker";
import {CartService} from "@/lib/cartService";
import UseBoardModal from "@/components/Reusable&Custom/UseBoardModal";


export default function ItemId() {
    const { user } = useAuthStore()
    const { itemId } = useLocalSearchParams();
    // console.log("🔹 Item ID:", itemId);

    //useDebugCart();
    const router = useRouter();
    const { addItem, increaseQty, decreaseQty, items  } = useCartStore();

    const [item, setItem] = useState<MenuItem | null>(null);
    const [customizations, setCustomizations] = useState<Customization[]>([]);
    const [boards, setBoards] = useState<Board[]>([])
    const [loading, setLoading] = useState(true);
    const [editingBoard, setEditingBoard] = useState<Board | null>(null);
    const [showPicker, setShowPicker] = useState(false);

    const [showCustomizeAlert, setShowCustomizeAlert] = useState(false);
    const [boardsModalVisible, setBoardsModalVisible] = useState(false);
    const [boardsForItem, setBoardsForItem] = useState<Board[]>([]);

    const fetchBoards = async () => {
        if (!user?.$id) return;

        const savedBoards = await getBoardsForItem(itemId as string);
        setBoards(savedBoards);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [menuResponse, customizationResponse] = await Promise.all([
                    getMenuItemById(itemId as string),
                    getMenuCustomizations(itemId as string),
                ]);
                if (menuResponse) setItem(menuResponse);
                if (customizationResponse) setCustomizations(customizationResponse);

                fetchBoards()
            } catch (err) {
                console.error("Error fetching menu item:", err);
            } finally {
                setLoading(false);
            }
        };
        if(itemId) fetchData();
    }, [itemId]);


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

    //console.log("🔍 Customizations:", customizations);
    const toppings = customizations.filter(c => c.type?.toLowerCase().includes("topping"));
    const sides = customizations.filter(c => c.type?.toLowerCase().includes("side"));

    const toppingsForCart: CartCustomization[] = toppings.map(t => ({
        id: t.$id,       // fallback to $id if t.id is missing
        name: t.name,
        price: t.price,
        type: t.type,
        image_url: t.image_url,
        quantity: 1, // default to 1 if missing
    }));

    const sidesForCart: CartCustomization[] = sides.map(s => ({
        id: s.$id,
        name: s.name,
        price: s.price,
        type: s.type,
        image_url: s.image_url,
        quantity: 1,
    }));

    const handleEditBoard = (board: Board) => {
        setEditingBoard(board);
        setShowPicker(true);        // open picker immediately
        setShowCustomizeAlert(false)
    };

    const handleEditUseBoard = (board: Board) => {
        setEditingBoard(board);
        setShowPicker(true);        // open picker immediately
        setShowCustomizeAlert(false)
        setBoardsModalVisible(false)
    };


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

    //console.log("🔍 Customizations:", customizations);
    // console.log("toppings:", toppings);
    // console.log("sides:", sides);

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
                        <Text style={{fontWeight: "bold", color: "#F89D3A", fontSize: 22, marginLeft: 22, marginTop: 7}}>${(item.price ?? 0).toFixed(2) } </Text>

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

                <ScrollView
                    contentContainerStyle={{
                        paddingHorizontal: 20,
                        paddingTop: 10,
                        paddingBottom: 120,
                        alignItems: "stretch",
                        justifyContent: boards.length === 0 ? "center" : "flex-start",
                        flexGrow: 1, // ensures full height even if few boards
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Saved Boards Section */}
                    {boards.length === 0 ? (
                        <ScrollView
                            contentContainerStyle={{
                                width: "auto",
                                padding: 20,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                            <Text
                                style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: '#333',
                                    marginBottom: 10,
                                }}
                            >No Boards Yet
                            </Text>

                            <TouchableOpacity
                                onPress={() => {
                                    setEditingBoard(null);
                                    setShowCustomizeAlert(true);
                                }}
                                style={{
                                    backgroundColor: '#FF9C01',
                                    paddingVertical: 12,
                                    paddingHorizontal: 15,
                                    borderRadius: 10,
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: '700' }}> Create a New Board </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    ) : (
                        <ScrollView style={{paddingHorizontal: 20, marginBottom: 20,}} showsVerticalScrollIndicator={false}>
                            <Text style={{ fontSize: 15, fontWeight: '700', marginBottom: 10 }}> Your Boards </Text>

                            {/* Add Another Board Button */}
                            <TouchableOpacity
                                onPress={() => {
                                    setEditingBoard(null);
                                    setShowCustomizeAlert(true); // open picker to create another board
                                }}
                                style={{
                                    backgroundColor: "#FFF6ED",
                                    borderWidth: 1,
                                    borderColor: "#FF9C01",
                                    paddingVertical: 10,
                                    borderRadius: 8,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 12,
                                }}
                            >
                                <Text style={{ color: "#FF9C01", fontWeight: "700" }}>+ Add Another Board</Text>
                            </TouchableOpacity>

                            {/* Boards List */}
                            {boards.map((board) => {
                                const customizations: CartCustomization[] = safeParseCustomizations(board.customizations);
                                const extrasTotal = Number(board.extrasTotal ?? 0);
                                const price = (item.itemPrice ?? 0);
                                const total = (item.price ?? 0) + (extrasTotal ?? 0);

                                return (
                                    <View
                                        key={board.$id || board.name}
                                        style={{
                                            width: '100%',
                                            borderWidth: 1,
                                            borderColor: "#eee",
                                            borderRadius: 14,
                                            padding: 16,
                                            marginBottom: 16,
                                            backgroundColor: board.isActive ? "#fff" : "#f2f2f2",
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: 0.08,
                                            shadowRadius: 3,
                                            elevation: 2,
                                        }}
                                    >
                                        {/* Header */}
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginBottom: 8,
                                            }}
                                        >
                                            <Text style={{ fontWeight: "700", fontSize: 16, color: "#111" }}>
                                                {board.name}
                                            </Text>

                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    gap: 5,
                                                }}
                                            >
                                                <TouchableOpacity
                                                    onPress={() => {board.isActive && handleEditBoard(board);}}
                                                    style={{
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                        backgroundColor: board.isActive ? "#FF9C01" : "#ccc",
                                                        paddingHorizontal: 10,
                                                        paddingVertical: 5,
                                                        borderRadius: 8,
                                                    }}
                                                    disabled={!board.isActive}
                                                >
                                                    <Text style={{ color: "#fff", fontWeight: "600", fontSize: 8 }}>
                                                        Edit
                                                    </Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={ async () => {
                                                        Alert.alert(
                                                            'Deactivate Board',
                                                            'Do you want to archive this board? You can still reuse it later.',
                                                            [
                                                                {text: 'Cancel', style: 'cancel'},
                                                                {
                                                                    text: 'Archive',
                                                                    style: 'destructive',
                                                                    onPress: async () => {
                                                                        try {
                                                                            await deactivateBoard(board.$id);
                                                                            setBoards(prev => prev.filter(b => b.$id !== board.$id));

                                                                            Toast.show({
                                                                                type: "success",
                                                                                text1: 'Board archived successfully',
                                                                                position: "bottom",
                                                                            })
                                                                        } catch (error) {
                                                                            console.error(error);
                                                                            Toast.show({
                                                                                type: "danger",
                                                                                text1: 'Failed to deactivate board',
                                                                            })
                                                                        }
                                                                    }
                                                                }
                                                            ]
                                                        )
                                                    }}
                                                    style={{
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                        backgroundColor: "red",
                                                        paddingHorizontal: 10,
                                                        paddingVertical: 5,
                                                        borderRadius: 8,
                                                    }}
                                                >
                                                    <Text style={{ color: "#fff", fontWeight: "600", fontSize: 8 }}>Delete</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* Customizations */}
                                        <View style={{ marginBottom: 8 }}>
                                            {customizations.length > 0 ? (
                                                customizations.map((c) => (
                                                    <View
                                                        key={c.id}
                                                        style={{
                                                            flexDirection: "row",
                                                            justifyContent: "space-between",
                                                            marginBottom: 3,
                                                        }}
                                                    >
                                                        <Text style={{ fontSize: 13, color: "#333" }}>
                                                            • {c.name} ×{c.quantity}
                                                        </Text>
                                                        <Text style={{ fontSize: 13, color: "#333" }}>
                                                            ${( (c.price ?? 0 )* (c.quantity ?? 1 )).toFixed(2) }
                                                        </Text>
                                                    </View>
                                                ))
                                            ) : (
                                                <Text style={{ fontSize: 13, color: "#777" }}>
                                                    No extras selected
                                                </Text>
                                            )}
                                        </View>

                                        {/* Divider */}
                                        <View
                                            style={{
                                                borderBottomWidth: 1,
                                                borderColor: "#eee",
                                                marginVertical: 8,
                                            }}
                                        />

                                        {/* Totals */}
                                        <View style={{ marginBottom: 8 }}>
                                            <View
                                                style={{
                                                    flexDirection: "row",
                                                    justifyContent: "space-between",
                                                    marginBottom: 3,
                                                }}
                                            >
                                                <Text style={{ color: "#555" }}>Extras Total</Text>
                                                <Text style={{ color: "#555" }}>${extrasTotal.toFixed(2)}</Text>
                                            </View>

                                            <View
                                                style={{
                                                    flexDirection: "row",
                                                    justifyContent: "space-between",
                                                    marginBottom: 3,
                                                }}
                                            >
                                                <Text style={{ color: "#555" }}>Item Price</Text>
                                                <Text style={{ color: "#FF9C01" }}>
                                                    ${price.toFixed(2)}
                                                </Text>
                                            </View>

                                            <View
                                                style={{
                                                    flexDirection: "row",
                                                    justifyContent: "space-between",
                                                    marginTop: 4,
                                                }}
                                            >
                                                <Text style={{ fontWeight: "700", color: "#111" }}>Total</Text>
                                                <Text style={{ fontWeight: "700", color: "#FF9C01" }}>
                                                    ${total.toFixed(2)}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Add to Cart Button */}
                                        <TouchableOpacity
                                            disabled={!board.isActive}
                                            onPress={async () => {
                                                try {
                                                     await addBoardToCart(board, item, setBoards);
                                                    Toast.show({
                                                        type: "success",
                                                        text1: 'Board Added to Cart',
                                                        position: 'top'
                                                    })

                                                } catch (err) {
                                                    console.error(err);
                                                    Toast.show({
                                                        type: "danger",
                                                        text1: 'Failed to Add Board to Cart',
                                                    })
                                                }
                                            }}
                                            style={{
                                                backgroundColor: board.isActive ? "#F89D3A" : "#ccc",
                                                paddingVertical: 10,
                                                borderRadius: 10,
                                                alignItems: "center",
                                                marginTop: 4,
                                            }}
                                        >
                                            <Text style={{ color: "#fff", fontWeight: "700" }}>{board.isActive ? 'Add to Cart' : 'Added' }</Text>
                                        </TouchableOpacity>

                                        {/* Reuse Button for disabled boards */}
                                        {!board.isActive && (
                                            <TouchableOpacity
                                                onPress={async () => {
                                                    try {
                                                        await reuseBoard(board, setBoards);
                                                    } catch (err) {
                                                        console.error(err);
                                                        Toast.show({
                                                            type: "danger",
                                                            text1: 'Failed to Reuse Board',
                                                        })
                                                    }
                                                }}
                                                style={{
                                                    marginTop: 4,
                                                    backgroundColor: "#FF9C01",
                                                    paddingVertical: 10,
                                                    borderRadius: 10,
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Text style={{ color: "#fff", fontSize: 12 }}> Reuse </Text>
                                            </TouchableOpacity>
                                        )}

                                    </View>
                                );
                            })}

                            {/* Add All to Order Button */}
                            <TouchableOpacity
                                onPress={async () => {
                                    try {
                                        await addAllBoardsToCart(boards, item, setBoards);
                                        Toast.show({
                                            type: "success",
                                            text1: 'All Boards Added to Cart',
                                            position: 'top'
                                        })
                                    } catch (err) {
                                        console.error(err);
                                        Toast.show({
                                            type: "danger",
                                            text1: 'Failed to Add All Boards to Cart',
                                        })
                                    }
                                }}
                                disabled={boards.every(b => !b.isActive)}
                                style={{ backgroundColor: boards.some(b => b.isActive) ? "#F89D3A" : "#ccc", borderRadius: 11, paddingVertical: 14, alignItems: "center", marginTop: 10 }}
                            >
                                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                                    Add All to Order (${boards.reduce((acc, b) => b.isActive ? acc + ((b.extrasTotal || 0) + (item.price ?? 0)) : acc, 0).toFixed(2)})
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    )}
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
                {/*/!* - Button *!/*/}
                {/*<TouchableOpacity*/}
                {/*    onPress={() => decreaseQty(item.$id, cartCustomizations)}*/}
                {/*    style={{*/}
                {/*        width: 40,*/}
                {/*        height: 40,*/}
                {/*        backgroundColor: "#FFF5E3",*/}
                {/*        borderRadius: 8,*/}
                {/*        alignItems: "center",*/}
                {/*        justifyContent: "center"*/}
                {/*    }}*/}
                {/*>*/}
                {/*    <Image*/}
                {/*        source={images.minus}*/}
                {/*        className="size-1/3"*/}
                {/*        resizeMode="contain"*/}
                {/*        tintColor={"#FF9C01"}*/}
                {/*    />*/}
                {/*</TouchableOpacity>*/}

                {/*/!* Quantity *!/*/}
                {/*<Text style={{ fontSize: 15, marginHorizontal: 14, fontWeight: "600" }}>{quantity}</Text>*/}

                {/*/!* + Button *!/*/}
                {/*<TouchableOpacity*/}
                {/*        onPress={() => setShowCustomizeAlert(true)}*/}
                {/*        style={{*/}
                {/*            width: 40,*/}
                {/*            height: 40,*/}
                {/*            backgroundColor: "#FFF5E3",*/}
                {/*            borderRadius: 8,*/}
                {/*            alignItems: "center",*/}
                {/*            justifyContent: "center"*/}
                {/*        }}*/}
                {/*    >*/}
                {/*        <Image*/}
                {/*            source={images.plus}*/}
                {/*            className="size-1/3"*/}
                {/*            resizeMode="contain"*/}
                {/*            tintColor={"#FF9C01"}*/}
                {/*        />*/}
                {/*</TouchableOpacity>*/}

                {/*ADD TO CART BUTTON*/}
                <TouchableOpacity
                    onPress={() => setShowCustomizeAlert(true)}
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
                        Add to cart
                    </Text>
                </TouchableOpacity>
            </View>

            <CustomizeAlert
                visible={showCustomizeAlert}
                onClose={() => setShowCustomizeAlert(false)}

                onUseExisting={async () => {
                    setShowCustomizeAlert(false);

                    if (!user?.accountId) return;

                    try {
                        const boards = await getBoardsForItem(itemId as string);

                        if (!boards.length) {
                            Alert.alert('No Boards Found For this Item', 'Please create a new board for this item');
                            return;
                        }

                        setBoardsForItem(boards);
                        setBoardsModalVisible(true);
                    } catch (err) {
                        console.error(err);
                        Alert.alert('Failed to load boards', 'Please try again later');
                    }
                }}
                onCreateNew={(board) => {
                    setShowCustomizeAlert(false);
                    const parsedCustomizations: CartCustomization[] = Array.isArray(board.customizations)
                        ? board.customizations
                        : JSON.parse(board.customizations || "[]");

                    setBoards(prev => [...prev, {...board, customizations: JSON.stringify(parsedCustomizations)}])
                }}
                onJustItem={async () => {
                    setShowCustomizeAlert(false);

                    const userId = useAuthStore.getState().user?.$id;
                    if (!userId) return;

                    const extrasTotal = 0;
                    const totalPrice = (item?.itemPrice ?? 0);

                    const cartStore = useCartStore.getState();
                    const existing = cartStore.items.find(i => i.key === key);

                    const { $id, key } = await CartService.addOrUpdateItem(
                        userId,
                        item,
                        [],
                        extrasTotal,
                        totalPrice,
                        !!existing
                    );

                    // Add/Update in local cart store
                    if (!existing) {
                        cartStore.addItem({
                            id: item.$id,
                            name: item.name,
                            image_url: item.image_url,
                            basePrice: item?.itemPrice,
                            quantity: 1,
                            customizations: [],
                            extrasTotal,
                            totalPrice,
                            key,
                            cartId: $id,
                        });
                    }
                }}
                toppings={toppingsForCart}
                sides={sidesForCart}
                itemId={item.$id}
                itemName={item.name}
                itemImage={item.image_url}
                editingBoard={editingBoard || undefined}
            />

            {showPicker && (
                <CustomizationPicker
                    itemId={item.$id}
                    itemName={item.name}
                    itemImage={item.image_url}
                    editingBoard={editingBoard}
                    toppings={toppings}
                    sides={sides}
                    onSave={(saved) => {
                        // upsert into boards list (keep isActive property in saved)
                        setBoards(prev => {
                            const found = prev.find(p => p.$id === saved.$id);
                            if (found) return prev.map(p => p.$id === saved.$id ? saved : p);
                            return [saved, ...prev];
                        });
                        setEditingBoard(null);
                        setShowPicker(false);
                    }}
                    onClose={() => {
                        setEditingBoard(null);
                        setShowPicker(false);
                    }}
                />
            )}

            <UseBoardModal
                visible={boardsModalVisible}
                onClose={() => setBoardsModalVisible(false)}
                boards={boardsForItem}
                onUseBoard={(board) => handleEditUseBoard(board)}
            />
        </View>
    );
}