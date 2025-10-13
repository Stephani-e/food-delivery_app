import React, {useEffect, useState} from 'react'
import {Redirect, Tabs} from "expo-router";
import useAuthStore from "@/store/auth.store";
import {TabBarIconProps} from "@/type";
import {Image, Text, View} from "react-native";
import {images} from "@/constants";
import cn from "clsx";
import SplashScreen from "@/components/SplashScreen";

const TabBarIcon = ({ focused, icon, title }: TabBarIconProps) => (
    <View className="tab-icon">
        <Image
            source={icon}
            className="size-5"
            resizeMode="contain"
            tintColor={focused ? "#FE8C00" : "#5D5F6D"}
        />
        <Text className={cn('text-sm font-bold', focused ? 'text-primary' : 'text-gray-200')}>
            {title}
        </Text>
    </View>
)

export default function TabLayout() {
    const { isAuthenticated, isLoading } = useAuthStore();
    const [ showSplash, setShowSplash ] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 2500); // splash will show for 2.5 seconds
        return () => clearTimeout(timer);
    }, []);

    if (showSplash) {
        return (
            <SplashScreen
                message="Loading your dashboard..."
                image={require("@/assets/images/login-graphic.png")}
                duration={2000}
            />
        );
    }

    if (isLoading) {
        return (
            <SplashScreen
                message="Checking your session..."
                duration={1500}
            />
        );
    }

    // 👇 Redirect if not logged in
    if (!isAuthenticated) return <Redirect href="/sign-in" />;

    // 👇 Show main tabs once ready
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    borderTopLeftRadius: 50,
                    borderTopRightRadius: 50,
                    borderBottomLeftRadius: 50,
                    borderBottomRightRadius: 50,
                    marginHorizontal: 20,
                    height: 50,
                    position: 'absolute',
                    bottom: 40,
                    backgroundColor: 'white',
                    shadowColor: '#1a1a1a',
                    shadowOffset: {
                        width: 0,
                        height: 10,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 5,
                }
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ focused }) =>
                        <TabBarIcon
                            focused={focused}
                            icon={images.home}
                            title='Home'
                        />
                }}
            />

            <Tabs.Screen
                name="search"
                options={{
                    title: "Search",
                    tabBarIcon: ({ focused }) =>
                        <TabBarIcon
                            focused={focused}
                            icon={images.search}
                            title='Search'
                        />
                }}
            />

            <Tabs.Screen
                name="cart"
                options={{
                    title: "Cart",
                    tabBarIcon: ({ focused }) =>
                        <TabBarIcon
                            focused={focused}
                            icon={images.bag}
                            title='Cart'
                        />
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ focused }) =>
                        <TabBarIcon
                            focused={focused}
                            icon={images.person}
                            title='Profile'
                        />
                }}
            />
        </Tabs>
    )
}
