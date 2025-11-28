import { useCartStore } from "@/store/cart.store";
import { CartItemType } from "@/type";
import {Alert, Image, Text, TouchableOpacity, View} from "react-native";
import {images} from "@/constants";
import {useEffect, useState} from "react";
import {Ionicons} from "@expo/vector-icons";

type CustomizationsCardProps = {
    toppings?: CartItemType["customizations"];
    sides?: CartItemType["customizations"];
    extrasTotal?: number;
    quantity?: number;
};

const CustomizationsCard = ({ toppings = [], sides = [], extrasTotal = 0, quantity = 1 }: CustomizationsCardProps) => {
    if (!toppings.length && !sides.length) return null;

    return (
        <View className="bg-white-100 p-4 rounded-lg mt-4">
            {extrasTotal > 0 && (
                <Text className="text-primary/50 mb-2 text-left">
                    Extras Total: ${extrasTotal.toFixed(2)}
                </Text>
            )}

            {toppings.length > 0 && (
                <View style={{marginBottom: 20}}>
                    <Text className="text-primary mb-1">Toppings</Text>
                    {toppings.map(t => (
                        <Text key={t.id} className='text-dark-80 ml-2.5'>
                            • {t.name} {t.price ? `(+$${t.price.toFixed(2)})` : ""}
                        </Text>
                    ))}
                </View>
            )}

            {sides.length > 0 && (
                <View>
                    <Text className="text-primary mb-1">Sides</Text>
                    {sides.map(s => (
                        <Text key={s.id} className="text-dark-80 ml-2.5">
                            • {s.name} {s.price ? `(+$${s.price.toFixed(2)})` : ""}
                        </Text>
                    ))}
                </View>
            )}
        </View>
    );
};

const CartItem = ({ item }: { item: CartItemType }) => {
    const { increaseQty, decreaseQty, removeItem } = useCartStore();

    const handleRemoveItem = () => {
        Alert.alert(
            'Remove Item?',
            `Are you sure you want to remove '${item.name}' from your cart?`,
            [
                {text: 'Cancel', style: 'cancel'},
                {text: 'Yes Remove It', style: "destructive", onPress: () => removeItem(item.id, item.customizations!)},
            ]
        )
    }

    const toppings = item.customizations?.filter(c => c.type === "topping") || [];
    const sides = item.customizations?.filter(c => c.type === "side") || [];
    const customizationTotal = item.extrasTotal ?? (item.customizations ?? []).reduce(
        (sum, c) => sum + (c.price ?? 0) * (c.quantity ?? 1),
        0
    );
    const basePrice = item.basePrice ?? 0;
    const quantity = item.quantity ?? 1;
    const totalPrice = (basePrice + customizationTotal);
    const Price = totalPrice! * quantity;
    const totalExtrasPrice = customizationTotal * quantity;

    const hasExtras = toppings.length + sides.length > 0;
    const [showExtras, setShowExtras] = useState(
        toppings.length + sides.length <= 2
    );

    return (
        <View>
            <View className="cart-item">
                <View className="flex-1 flex-row items-center gap-x-3">
                    <View className="cart-item__image">
                        <Image
                            source={{ uri: item.image_url }}
                            className="size-4/5 rounded-lg"
                            resizeMode="cover"
                        />
                    </View>

                    <View className='flex-1'>
                        <Text className="base-bold text-dark-100">{item.name} <Text className='text-primary text-sm '>(${item.basePrice})</Text>  </Text>
                        <Text className="paragraph-bold text-primary mt-1">
                           <Text className='text-dark-100'> Total Price: </Text>
                            { Price > 0  && ( `${Price.toFixed(2)}` )}
                            { customizationTotal > 0 && (
                                <Text className='text-dark-100 text-sm'> (includes +${totalExtrasPrice.toFixed(2)} extras) </Text>
                            )}
                        </Text>

                        <View className="flex flex-row items-center gap-x-4 mt-3">
                            <TouchableOpacity
                                onPress={() => decreaseQty(item.id, item.customizations!)}
                                className="cart-item__actions"
                            >
                                <Image
                                    source={images.minus}
                                    className="size-1/2"
                                    resizeMode="contain"
                                    tintColor={"#FF9C01"}
                                />
                            </TouchableOpacity>

                            <Text className="base-bold text-dark-100">{item.quantity}</Text>

                            <TouchableOpacity
                                onPress={() => increaseQty(item.id, item.customizations!)}
                                className="cart-item__actions"
                            >
                                <Image
                                    source={images.plus}
                                    className="size-1/2"
                                    resizeMode="contain"
                                    tintColor={"#FF9C01"}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleRemoveItem}
                    className="flex-center"
                >
                    <Image source={images.trash} className="size-5" resizeMode="contain" />
                </TouchableOpacity>
            </View>

            {/* Arrow pointing down/right */}
            {(toppings.length || sides.length) > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5, marginHorizontal: 15 }}>

                    {/* Left arrow using a rotated View */}
                    <View
                        style={{
                            width: 10,
                            height: 10,
                            borderRightWidth: 2,
                            borderBottomWidth: 2,
                            borderColor: '#FF9C01',
                            transform: [{ rotate: showExtras ? '45deg' : '225deg' }],
                        }}
                    />

                    {/*COLLAPSE TOGGLE */}
                    {hasExtras && (
                        <TouchableOpacity
                            onPress={() => setShowExtras(v => !v)}
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, flexDirection: 'row' }}
                            activeOpacity={0.5}
                        >
                            <Ionicons
                                name={showExtras ? "chevron-up-circle" : "chevron-down-circle"}
                                size={12}
                                color="#FF9C01"
                            />
                            <Text className="text-primary text-sm font-semibold">
                                {showExtras ? " Hide Customizations " : " Show Customizations "}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Small arrow using a rotated View */}
                    <View
                        style={{
                            width: 10,
                            height: 10,
                            borderRightWidth: 2,
                            borderBottomWidth: 2,
                            borderColor: '#FF9C01',
                            transform: [{ rotate: showExtras ? '45deg' : '225deg' }],
                        }}
                    />
                </View>
            )}

            {showExtras && hasExtras && (
                <CustomizationsCard toppings={toppings} sides={sides} extrasTotal={customizationTotal} quantity={item.quantity ?? 1} />
            )}
        </View>
    );
};

export default CartItem;