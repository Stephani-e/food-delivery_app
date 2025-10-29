import {FlatList, Image, Pressable, Text, TouchableOpacity, View} from "react-native";
import {images} from "@/constants";
import { useRouter } from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";
import CartButton from "@/components/CartButton";
import {Fragment, useEffect, useState} from "react";
import cn from 'clsx'
import useAuthStore from "@/store/auth.store";
import {Offer} from "@/type";
import {getOffers} from "@/lib/appwrite";

export default function Index() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [ offers, setOffers ] = useState<Offer[]>([]);
    const [ loading, setLoading ] = useState(true);

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                const result = await getOffers();
                setOffers(result);
            } catch (err) {
                console.log('Error Fetching Offers:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchOffers();
    }, []);

    console.log("useAuthStore:", JSON.stringify(user, null, 2));
  return (
    <SafeAreaView className="flex-1 bg-white">
      <FlatList
          ListHeaderComponent={() => (
              <View className="flex-between flex-row w-full my-5 px-5">
                  <View className="flex-start">
                      <Text className="small-bold text-primary">DELIVER TO</Text>
                      <TouchableOpacity className="flex-center flex-row gap-x-1 mt-0.5">
                          <Text className="paragraph-bold text-dark-100">Nigeria</Text>
                          <Image
                              source={images.arrowDown}
                              className="size-3"
                              resizeMode="contain"
                          />
                      </TouchableOpacity>
                  </View>
                  <CartButton />
              </View>
          )}
          contentContainerClassName="pb-28 px-25"
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
    </SafeAreaView>
  );
}
