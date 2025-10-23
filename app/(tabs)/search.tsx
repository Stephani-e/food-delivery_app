import {View, Text, Button, FlatList} from 'react-native'
import React, {useEffect} from 'react'
import {SafeAreaView} from "react-native-safe-area-context";
import useAppwrite from "@/lib/useAppwrite";
import {getCategories, getMenu} from "@/lib/appwrite";
import {useLocalSearchParams} from "expo-router";
import CartButton from "@/components/CartButton";
import cn from "clsx";
import MenuCard from "@/components/MenuCard";
import {MenuItem} from "@/type";
import Filter from "@/components/Filter";
import SearchBar from "@/components/SearchBar";

const Search = () => {
    const { category, query } = useLocalSearchParams<{query: string; category: string}>()
    const { data, refetch, loading } = useAppwrite({ fn: getMenu, params: { category, query, limit: 6 } });
    const { data: categories } = useAppwrite({ fn: getCategories })

    useEffect(() => {
        refetch( {category, query, limit: 6})
    }, [category, query]);
    //console.log("data:", JSON.stringify(data));

    // console.log("🔍 Search data length:", data?.length);
    // if (data?.length) {
    //     console.log("🧾 First menu item:", data[0]);
    // }

    return (
        <SafeAreaView className='bg-white h-full'>
            <FlatList
                ListHeaderComponent={() => (
                    <View className='my-5 gap-5'>
                        <View className='flex-between flex-row w-full'>
                            <View className='flex-start'>
                                <Text className='small-bold uppercase text-primary'>Search</Text>
                                <View className='flex-start flex-row gap-x-1 mt-0.5'>
                                    <Text className='paragraph-semibold text-dark-100'>Find Your Favorite Food</Text>
                                </View>
                            </View>

                            <CartButton />
                        </View>

                        <SearchBar />

                        <Filter categories={categories!} />
                    </View>
                )}
                data={data}
                renderItem={({ item, index }) => {
                    const isFirstRightColItem = index % 2 === 0;
                    return (
                        <View
                            className={cn('flex-1 max-w-[48%]', !isFirstRightColItem ? 'mt-10': 'mt-0')}
                        >
                            <MenuCard item={item} />
                        </View>
                    )
                }}
                keyExtractor={item => item.$id}
                numColumns={2}
                columnWrapperClassName='gap-7'
                contentContainerClassName='gap-7 px-5 pb-32'
                ListEmptyComponent={() => !loading && <Text>No Results</Text>}
            />
        </SafeAreaView>
    )
}
export default Search
