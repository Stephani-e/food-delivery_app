import React from "react";
import { View, Image, Text } from "react-native";
import {EmptyStateProps} from "@/type";


const EmptyState = ({ imageSource, title, caption, height = 160, width = 180,}: EmptyStateProps) => {
    return (
        <View
            style={{
                alignItems: "center",
                justifyContent: "center",
                marginTop: 40,
                paddingHorizontal: 20,
            }}
        >
            <Image
                source={imageSource}
                style={{
                    width,
                    height,
                    marginBottom: 20,
                    resizeMode: "contain",
                }}
            />

            <Text
                style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: "#111827",
                    textAlign: "center",
                    marginBottom: 6,
                }}
            >
                {title}
            </Text>

            {caption && (
                <Text
                    style={{
                        fontSize: 14,
                        color: "#6B7280",
                        textAlign: "center",
                        maxWidth: 250,
                        lineHeight: 20,
                    }}
                >
                    {caption}
                </Text>
            )}
        </View>
    );
};

export default EmptyState;
