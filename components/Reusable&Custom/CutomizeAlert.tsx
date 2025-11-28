import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Modal, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { images } from "@/constants";
import {Board, CartCustomization, Customization, SavedBoardPayload} from "@/type";
import CustomizationPicker from "@/components/Reusable&Custom/CustomizationPicker";
import { ID } from "@/lib/appwrite"; // for generating unique IDs

type CustomizeAlertProps = {
    visible: boolean;
    onClose: () => void;
    onUseExisting: () => void;
    onCreateNew: (board: Board) => void;
    onJustItem: () => void;
    toppings: CartCustomization[];
    sides: CartCustomization[];
    itemId: string;
    itemName: string;
    itemImage: string;
    editingBoard?: Board;
};

export default function CustomizeAlert(
    {
        visible,
        onClose,
        onUseExisting,
        onCreateNew,
        onJustItem,
        toppings,
        sides,
        itemId,
        itemName,
        itemImage,
        editingBoard,
    }: CustomizeAlertProps) {

    // Map CartCustomization to Customization with required fields
    const mappedToppings: Customization[] = useMemo(
        () =>
            toppings.map((t) => ({
                $id: ID.unique(),
                $databaseId: "",
                $collectionId: "",
                $createdAt: new Date().toISOString(),
                $updatedAt: new Date().toISOString(),
                $permissions: [],
                $sequence: 0,
                id: t.id,
                name: t.name,
                price: t.price,
                quantity: t.quantity,
                type: t.type,
                image_url: t.image_url,
            })),
        [toppings]
    );

    const mappedSides: Customization[] = useMemo(
        () =>
            sides.map((s) => ({
                $id: ID.unique(),
                $databaseId: "",
                $collectionId: "",
                $createdAt: new Date().toISOString(),
                $updatedAt: new Date().toISOString(),
                $permissions: [],
                $sequence: 0,
                id: s.id,
                name: s.name,
                price: s.price,
                quantity: s.quantity,
                type: s.type,
                image_url: s.image_url,
            })),
        [sides]
    );

    const [showPicker, setShowPicker] = useState(false);
    const [isEditingMode, setIsEditingMode] = useState(false);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View
                style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 20,
                }}
            >
                {!showPicker ? (
                    <View
                        style={{
                            width: "80%",
                            backgroundColor: "#fff",
                            borderRadius: 16,
                            padding: 20,
                        }}
                    >
                        {/* Close Button */}
                        <TouchableOpacity
                            onPress={onClose}
                            style={{
                                position: "absolute",
                                top: 10,
                                right: 10,
                                width: 60,
                                height: 30,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#eee",
                                borderRadius: 12,
                                elevation: 2,
                            }}
                        >
                            <Text style={{ color: "#000", marginRight: 3, fontWeight: "500" }}>
                                Close
                            </Text>
                            <Ionicons name="close" size={15} color="#000" />
                        </TouchableOpacity>

                        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
                            Customize this item?
                        </Text>
                        <Text style={{ marginBottom: 20 }}>
                            Would you like to use an existing customization board or create a new one?
                        </Text>

                        {/* Use Existing */}
                        <TouchableOpacity
                            onPress={onUseExisting}
                            activeOpacity={0.8}
                            style={{
                                flexDirection: "row",
                                backgroundColor: "#F89D3A",
                                paddingVertical: 5,
                                borderRadius: 12,
                                marginBottom: 10,
                                alignItems: "center",
                                shadowColor: "#F89D3A",
                                shadowOffset: { width: 0, height: 3 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                                justifyContent: "center",
                            }}
                        >
                            <Image
                                source={images.existing}
                                className="size-5"
                                resizeMode="contain"
                                style={{ marginRight: 10 }}
                            />
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                                Use Existing/Previous Board
                            </Text>
                        </TouchableOpacity>

                        {/* Create New */}
                        <TouchableOpacity
                            onPress={() => {
                                setIsEditingMode(false)
                                setShowPicker(true)
                            }}
                            style={{
                                flexDirection: "row",
                                backgroundColor: "#FF6B6B",
                                paddingVertical: 5,
                                borderRadius: 12,
                                marginBottom: 10,
                                alignItems: "center",
                                shadowColor: "#FF6B6B",
                                shadowOffset: { width: 0, height: 3 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                                justifyContent: "center",
                            }}
                        >
                            <Image
                                source={images.add}
                                className="size-5"
                                resizeMode="contain"
                                style={{ marginRight: 10 }}
                            />
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                                {isEditingMode ? "Edit Board" : "Create New Board"}
                            </Text>
                        </TouchableOpacity>

                        {/* Just Item */}
                        <TouchableOpacity
                            onPress={onJustItem}
                            activeOpacity={0.8}
                            style={{
                                backgroundColor: "#eee",
                                paddingVertical: 5,
                                borderRadius: 12,
                                alignItems: "center",
                                shadowColor: "#aaa",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 3,
                                flexDirection: "row",
                                justifyContent: "center",
                            }}
                        >
                            <Image
                                source={images.equal}
                                className="size-5"
                                resizeMode="contain"
                                style={{ marginRight: 10 }}
                            />
                            <Text style={{ color: "#111", fontWeight: "700", fontSize: 15 }}>
                                No, Just the Item
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <CustomizationPicker
                        toppings={mappedToppings}
                        sides={mappedSides}
                        itemId={itemId}
                        itemName={itemName}
                        itemImage={itemImage}
                        editingBoard={isEditingMode ? editingBoard : undefined}
                        onClose={() => setShowPicker(false)}
                        onSave={(savePayload) => {
                            setShowPicker(false);
                            onCreateNew(savePayload);
                        }}
                    />
                )}
            </View>
        </Modal>
    );
}
