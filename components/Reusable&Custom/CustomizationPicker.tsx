import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from "react-native";
import { createBoard, updateBoard } from "@/lib/appwrite";
import { Customization, CartCustomization, Board, SavedBoardPayload } from "@/type";
import useAuthStore from "@/store/auth.store";

interface CustomizationPickerProps {
    toppings: Customization[];
    sides: Customization[];
    itemId: string;
    itemName: string;
    itemImage: string;
    onSave: (board: Board) => void;
    onClose: () => void;
    editingBoard?: Board & { parsedCustomizations?: CartCustomization[] } | null;
}

export default function CustomizationPicker({
                                                toppings,
                                                sides,
                                                itemId,
                                                itemName,
                                                itemImage,
                                                onSave,
                                                onClose,
                                                editingBoard,
                                            }: CustomizationPickerProps) {
    const user = useAuthStore((state) => state.user);

    const [selected, setSelected] = useState<CartCustomization[]>([]);
    const [boardName, setBoardName] = useState<string>("");
    const scrollRef = useRef<ScrollView>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setReady(false);

        if (editingBoard) {
            setBoardName(editingBoard.name || "");
            const parsed: CartCustomization[] = editingBoard.parsedCustomizations ?? [];

            const mapped = parsed.map((c) => ({
                $id: c.id ?? c.$id,
                id: c.id ?? c.$id,
                name: c.name,
                price: c.price,
                quantity: c.quantity,
                type: c.type,
                image_url: c.image_url,
            }));

            setSelected(mapped);
        } else {
            setBoardName("");
            setSelected([]);
        }

        setReady(true);
    }, [editingBoard]);

    // Adjust quantity
    const adjustQuantity = (item: Customization, delta: number) => {
        setSelected((prev) =>
            prev
                .map((c) =>
                    c.name === item.name && c.type === item.type
                        ? { ...c, quantity: c.quantity + delta }
                        : c
                )
                .filter((c) => c.quantity > 0)
        );
    };

    // Toggle selection
    const toggleSelect = (item: Customization) => {
        setSelected((prev) => {
            const exists = prev.find((sel) => sel.name === item.name && sel.type === item.type);

            if (exists) {
                if (exists.quantity === 1) return prev.filter((sel) => sel.id !== item.$id);
                return prev.map((sel) =>
                    sel.id === item.$id ? { ...sel, quantity: sel.quantity - 1 } : sel
                );
            }

            return [
                ...prev,
                {
                    id: item.$id,
                    name: item.name,
                    price: item.price,
                    quantity: 1,
                    type: item.type,
                    image_url: item.image_url,
                },
            ];
        });
    };

    const totalExtra = selected.reduce((acc, cur) => acc + cur.price * cur.quantity, 0);

    const handleSave = async () => {
        if (!user?.$id) {
            Alert.alert("No user found. Board cannot be saved.");
            return;
        }
        if (!boardName.trim()) {
            Alert.alert("Please enter a name for your board.");
            return;
        }
        if (!selected.length) {
            Alert.alert("Cannot save a board with no customizations.");
            return;
        }

        const safeCustomizations = selected.map(({ image_url, ...rest }) => rest);

        const payload: SavedBoardPayload = {
            userId: user.accountId,
            itemId,
            name: boardName.trim(),
            itemName,
            itemImage,
            customizations: JSON.stringify(safeCustomizations),
            extrasTotal: totalExtra,
        };

        try {
            let savedBoard: Board;
            if (editingBoard) {
                savedBoard = await updateBoard(editingBoard.$id, payload);
            } else {
                savedBoard = await createBoard(payload);
            }
            onSave(savedBoard);
            onClose();
        } catch (err) {
            console.error("Failed to save board:", err);
            Alert.alert("Unable to save board");
        }
    };

    const renderCustomizationRow = (c: Customization) => {
        const sel = selected.find((s) => s.name === c.name && s.type === c.type);
        const unitPrice = Number(sel?.price ?? c.price ?? 0);
        const lineTotal = unitPrice * (sel?.quantity ?? 1);

        return (
            <View
                key={c.$id}
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 10,
                    borderBottomWidth: 1,
                    borderColor: "#eee",
                    backgroundColor: sel ? "#FFF6ED" : "#fff",
                }}
            >
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text> {c.name} </Text>
                    <Text style={{ color: "#777" }}> — ${unitPrice.toFixed(2)} </Text>
                </View>

                {sel ? (
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <TouchableOpacity onPress={() => adjustQuantity(c, -1)} style={{ marginHorizontal: 6 }}>
                            <Text style={{ fontSize: 18 }}> – </Text>
                        </TouchableOpacity>
                        <Text style={{ fontSize: 16 }}>{sel.quantity}</Text>
                        <TouchableOpacity onPress={() => adjustQuantity(c, 1)} style={{ marginHorizontal: 6 }}>
                            <Text style={{ fontSize: 18 }}> + </Text>
                        </TouchableOpacity>
                        <Text style={{ marginLeft: 8 }}> ${lineTotal.toFixed(2)} </Text>
                    </View>
                ) : (
                    <TouchableOpacity onPress={() => toggleSelect(c)}>
                        <Text style={{ color: "#F89D3A" }}> Add </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    if (!ready) return null;

    return (
        <View
            style={{
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 16,
                maxHeight: "85%",
                width: "100%",
            }}
        >
            <Text style={{ fontWeight: "700", fontSize: 18, marginBottom: 10 }}>
                {editingBoard ? "Edit Board" : "Create Your Board"}
            </Text>

            <TextInput
                placeholder="Enter a name for your board"
                value={boardName}
                onChangeText={setBoardName}
                style={{
                    borderWidth: 1,
                    borderColor: "#eee",
                    borderRadius: 10,
                    padding: 10,
                    marginBottom: 10,
                }}
                placeholderTextColor="#777"
                autoCapitalize="none"
            />

            <ScrollView ref={scrollRef} style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                <Text style={{ fontWeight: "600", marginVertical: 8 }}>Toppings</Text>
                {toppings.map((c) => renderCustomizationRow(c))}
                <Text style={{ fontWeight: "600", marginVertical: 8 }}>Sides</Text>
                {sides.map((c) => renderCustomizationRow(c))}
            </ScrollView>

            <TouchableOpacity
                disabled={!selected.length || !boardName.trim()}
                onPress={handleSave}
                style={{
                    backgroundColor: selected.length ? "#F89D3A" : "#ccc",
                    padding: 14,
                    borderRadius: 10,
                    alignItems: "center",
                    marginTop: 20,
                }}
            >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Save Board</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={{ marginTop: 10, alignItems: "center" }}>
                <Text style={{ color: "#777" }}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );
}
