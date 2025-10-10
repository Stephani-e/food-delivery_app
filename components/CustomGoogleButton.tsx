import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, View, Image } from "react-native";
import {CustomGoogleButtonProps} from "@/type";
import {images} from "@/constants";
import cn from "clsx";


const CustomGoogleButton = ({
                                                       title,
                                                       onPress,
                                                       leftIcon,
                                                       isLoading = false,
                                                       style = "",
                                                       textStyle = "",
                                                       disabled = false,
                                                   }: CustomGoogleButtonProps ) => {
    return (
        <TouchableOpacity
            disabled={isLoading || disabled}
            onPress={onPress}
            className={cn("custom-google-btn", style)}
        >
            {isLoading ? (
                <ActivityIndicator color="orange" size="small" />
            ) : (
                <View className="flex-row items-center justify-center">
                    <Image
                        source={images.google}
                        className="w-5 h-5"
                        resizeMode="contain"
                    />
                    <Text className={`text-primary base-bold ml-3 ${textStyle}`}>
                        {isLoading ? 'Connecting...' : title}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

export default CustomGoogleButton;
