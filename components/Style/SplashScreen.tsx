import React, {useEffect, useState} from "react";
import { View, Text, Image, ActivityIndicator, Animated, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {SplashScreenProps} from "@/type";

const SplashScreen = ({
                                                       message = "Loading...",
                                                       image,
                                                       duration = 3000,
                                                       onFinish
                                                   }: SplashScreenProps) => {

    const [fadeAnim] = useState(new Animated.Value(1));

    useEffect(() => {
        const timer = setTimeout(() => {
            //Fade Out Animation
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                onFinish?.();
            });
        }, duration)

        return () => clearTimeout(timer);
    }, [duration]);

    return (
        <SafeAreaView className="flex-1 bg-white justify-center items-center">
            <Animated.View className="items-center">
                <Image
                    source={
                        image
                            ? image
                            : require("@/assets/images/bacon.png") // 👈 default image
                    }
                    style={styles.image}
                    resizeMode="contain"
                />

                <Text style={styles.text}>
                    {message}
                </Text>

                <ActivityIndicator size="large" color="#2B7A78" />
            </Animated.View>
        </SafeAreaView>
    );
};

export default SplashScreen;

const styles = StyleSheet.create({
    image: {
        width: 200,
        height: 200,
        marginBottom: 20,
    },
    text: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#FE8C00",
    },
})
