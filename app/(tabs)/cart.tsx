import {FlatList, Text, View} from 'react-native'
import {useCartStore} from "@/store/cart.store";
import {SafeAreaView} from "react-native-safe-area-context";
import CustomHeader from "@/components/CustomHeader";
import cn from "clsx";
import {PaymentInfoStripeProps} from "@/type";
import CustomButton from "@/components/CustomButton";
import CartItem from "@/components/CartItem";
import EmptyState from "@/components/EmptyState";

const PaymentInfoStripe = ({ label, value, labelStyle, valueStyle }: PaymentInfoStripeProps) => (
    <View className='flex-between flex-row my-1'>
        <Text className={cn('paragraph-medium text-gray-200', labelStyle)}>
            {label}
        </Text>
        <Text className={cn('paragraph-bold text-dark-100', valueStyle)}>
            {value}
        </Text>
    </View>
)

const Cart = () => {
    const { items, getTotalItems, getTotalPrice } = useCartStore();

    const totalItems = getTotalItems();
    const totalPrice = getTotalPrice();

    return (
        <SafeAreaView className='bg-white h-full'>
            <FlatList
                ListHeaderComponent={() =>
                    <CustomHeader title='Your Cart'
                    />
                }
                ListEmptyComponent={() =>
                    <EmptyState
                        imageSource={require('@/assets/images/empty-cart.png')}
                        title='Nothing in your Cart'
                        caption='To add items to your cart, Go to search page or home page to make a selection.'
                    />
                }
                contentContainerClassName='pb-28 px-5 pt-5'
                data={items}
                keyExtractor={item => item.id}
                renderItem={({ item }) =>
                    <CartItem item={item} />
                }
                ListFooterComponent={() => totalItems > 0 && (
                    <View className='gap-5'>
                        <View className='mt-6 border-gray p-5 rounded-2xl'>
                            <Text className='h3-bold text-dark-100 mb-5'>
                                Payment Summary
                            </Text>

                            <PaymentInfoStripe
                                label={`Total Items: (${totalItems})`}
                                value={`$${totalPrice.toFixed(2)}`}
                            />

                            <PaymentInfoStripe
                                label={`Delivery Fee:`}
                                value={`$5.00`}
                            />

                            <PaymentInfoStripe
                                label={`Discount`}
                                value={`- $0.20`}
                                valueStyle='!text-success'
                            />

                            <View className='border-t border-gray-300 my-2'></View>

                            <PaymentInfoStripe
                                label={`Total`}
                                value={`$${(totalPrice + 5 - 0.20).toFixed(2)}`}
                                labelStyle='base-bold !text-dark-100'
                                valueStyle='base-bold !text-dark-100 !text-right'
                            />
                        </View>

                        <CustomButton
                            title='Order Now'
                            onPress={() => {console.log('Order Now')}}
                        />
                    </View>
                )}
            />
        </SafeAreaView>
    )
}
export default Cart
