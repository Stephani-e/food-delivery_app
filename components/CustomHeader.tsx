import { useRouter } from "expo-router";
import {Alert, Image, Text, TouchableOpacity, View} from "react-native";
import {useCartStore} from "@/store/cart.store";
import { CustomHeaderProps } from "@/type";
import {images} from "@/constants";

const CustomHeader = ({ title }: CustomHeaderProps) => {
    const router = useRouter();
    const { clearCart } = useCartStore();

    const handleClearCart = () => {
        Alert.alert(
            'Clear Cart',
            'Are you sure you want to clear your cart?',
            [
                {text: 'Cancel', style: 'cancel'},
                {text: 'Yes Clear It', style: "destructive", onPress: () => clearCart()},
            ]
        )
    }

    return (
        <View className="custom-header">
            <TouchableOpacity onPress={() => router.back()}>
                <Image
                    source={images.arrowBack}
                    className="size-5"
                    resizeMode="contain"
                />
            </TouchableOpacity>

            {title && <Text className="base-semibold text-dark-100">{title}</Text>}

            {/*<Image source={images.search} className="size-5" resizeMode="contain" />*/}
            <TouchableOpacity
                onPress={handleClearCart}
                className="bg-primary p-2 rounded-xl flex-center"
                style={{
                    flexDirection: 'row'
                }}
            >
                <Image source={images.clearCart} className="size-4" resizeMode="contain" />
                {/*<Text className="text-white font-bold text-sm">Clear Cart</Text>*/}
            </TouchableOpacity>
        </View>
    );
};

export default CustomHeader;