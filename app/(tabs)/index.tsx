import {ActivityIndicator, FlatList, Image, Pressable, Text, TouchableOpacity, View} from "react-native";
import {images} from "@/constants";
import { useRouter } from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";
import CartButton from "@/components/Buttons/CartButton";
import {Fragment, useEffect, useState} from "react";
import cn from 'clsx'
import useAuthStore from "@/store/auth.store";
import {Offer} from "@/type";
import {getBranchesByLocation, getOffers, getOffersByUserLocation} from "@/lib/appwrite";
import {useLocationStore} from "@/store/location.store";
import {detectLocation} from "@/lib/location/location";
import {selectBestBranch} from "@/lib/location/selectBranch";
import {haversineKm} from "@/lib/location/distance";
import {Ionicons} from "@expo/vector-icons";
import FloatingLocationButton from "@/components/Buttons/FloatingLocationButton";
import {useCartStore} from "@/store/cart.store";

export default function Index() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [ offers, setOffers ] = useState<Offer[]>([]);
    const [ loading, setLoading ] = useState(true);
    const { detected, selected, setIsDeliverable, setSelected } = useLocationStore();
    const country = selected?.country ?? detected?.country;
    const hasSelectedLocation = !!selected;

    const fetchOffers = async () => {
        if (!country) return;

        setLoading(true);

        try {

            //fetch offers by country
            const result = await getOffersByUserLocation(country)

            if (!hasSelectedLocation) {
                setOffers(result);
                setLoading(false);
                return;
            }

            //fetch branches
            const branches = await getBranchesByLocation(country,)

            console.log("Branches:", Array.isArray(branches), 'count:', branches?.length);

            const validBranches = branches
                .map(branch => {
                    const distanceKm = haversineKm(
                        selected!.latitude!,
                        selected!.longitude!,
                        branch.latitude,
                        branch.longitude
                    );

                return {
                    ...branch,
                    distanceKm,
                    canDeliver: distanceKm <= branch.deliveryRadiusKm
                };
            })
                .filter(branch => branch.canDeliver);

            if (validBranches.length === 0) {
                setIsDeliverable(false);
                setOffers([])
                return;
            }

            //select the closest valid branch
            const bestBranch = selectBestBranch(
                validBranches,
                selected!.latitude,
                selected!.longitude
            )

            //delivery location
            if (!bestBranch) {
                setIsDeliverable(false);
                setOffers([])
                return;
            }

            setIsDeliverable(true);

            useCartStore.getState().setCartMeta({
                branchId: bestBranch.$id,
                branchName: bestBranch.name,
                country: bestBranch.country,
            });


            const deliverableOffers = result.filter(offer =>
                offer.restaurants.some(r => r.$id === bestBranch.$id)
            );

            setOffers(deliverableOffers);
        } catch (err) {
            console.log('Error Fetching Offers:', err);
        } finally {
            setLoading(false);
        }
    }

    console.log("Active location:", country);

    useEffect(() => {
        if (country)
            fetchOffers();
    }, [country, selected?.latitude, selected?.longitude,]);

    // console.log("useAuthStore:", JSON.stringify(user, null, 2));
  return (
    <SafeAreaView className="flex-1 bg-white">
        {loading ? (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#FF6347" />
            </View>
        ) : (
            <>
                <FlatList
                    ListHeaderComponent={() => (
                        <View className='flex-col'>
                            <View className="flex-between flex-row w-full my-5 px-5">
                                <View className="flex-start">
                                    <Text className="small-bold text-primary">DELIVER TO</Text>
                                    <TouchableOpacity
                                        className="flex-center flex-row gap-x-1 mt-0.5"
                                        onPress={() => router.push("/location-picker")}
                                    >
                                        <Text className="paragraph-bold text-dark-100">
                                            {selected?.name || selected?.country || 'Select a location'}
                                        </Text>
                                        <Image
                                            source={images.arrowDown}
                                            className="size-3"
                                            resizeMode="contain"
                                        />
                                    </TouchableOpacity>
                                </View>
                                <CartButton />
                            </View>

                            {/* Info message about location-dependent offers */}
                            {!selected && detected?.country && (
                                <View className="w-full my-5 px-5">
                                    <View className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-xl shadow-md flex-row items-start space-x-2">
                                        {/* Emoji or Icon */}
                                        <Ionicons name='information-circle-sharp' size={17} />

                                        {/* Message */}
                                        <Text className="text-sm text-yellow-900 flex-1 ml-2">
                                            <Text className="font-semibold">Heads up!</Text> Some offers may vary depending on your
                                            <Text className="font-semibold"> delivery location</Text>. Select your location to see what’s
                                            available near you before adding items to your cart.
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
                    ListEmptyComponent={() => (
                        <View className="px-5 py-10 items-center">
                            <Ionicons
                                name="location-outline"
                                size={30}
                                color="#9CA3AF"
                            />
                            <Text className="mt-3 text-center text-gray-500 text-base">
                                No offers available for this delivery location.
                            </Text>
                            <Text className="mt-1 text-center text-gray-400 text-sm">
                                Try selecting another nearby area.
                            </Text>
                        </View>
                    )}
                    contentContainerClassName="pb-28 px-25"
                    contentContainerStyle={{
                        paddingBottom: 120,
                        flexGrow: offers.length === 0 ? 1 : 0
                    }}
                    data={offers}
                    keyExtractor={(item) => item.$id}
                    renderItem={({ item, index }) => {
                        const isEven = index % 2 === 0;
                        return(
                            <View
                                style={{
                                    marginHorizontal: 15,
                                    marginBottom: 5,
                                }}
                            >
                                <Pressable
                                    className={cn ("offer-card", isEven ? 'flex-row-reverse' : 'flex-row')}
                                    style={{
                                        backgroundColor: item.color,
                                        borderRadius: 15,
                                        overflow: "hidden"
                                    }}
                                    android_ripple={{ color: "#fffff22" }}
                                    onPress={() => router.push(`/description?offersId=${item.$id}` as any)}
                                >
                                    {({pressed}) => (
                                        <Fragment>
                                            <View
                                                className="h-full w-1/2"
                                            >
                                                <Image
                                                    source={{uri: item.image_url}}
                                                    className="size-full"
                                                    resizeMode="contain"
                                                />
                                            </View>
                                            <View className={cn ("offer-card__info", isEven ? "pl-10" : "pr-10")}>
                                                <Text
                                                    className="h1-bold text-white leading-tight"
                                                >
                                                    {item.title}
                                                </Text>
                                                <Image
                                                    source={images.arrowRight}
                                                    className="size-10"
                                                    resizeMode="contain"
                                                    tintColor="#ffffff"
                                                />
                                            </View>
                                        </Fragment>
                                    )}
                                </Pressable>
                            </View>
                        )
                    }}
                />
                <FloatingLocationButton
                    onPress={() => router.push('/(modals)/LocationExplorer')}
                />
            </>
        )}
    </SafeAreaView>
  );
}
