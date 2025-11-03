import {Stack} from "expo-router";

export default function DescriptionLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false, // hide default headers by default
                contentStyle: {
                    backgroundColor: "#ffffff", // fallback background
                },
            }}
        >
            {/* Description Main Page */}
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                }}
            />

            {/* Offers Details Page */}
            <Stack.Screen
                name="item/[itemId]"
                options={{
                    headerShown: false,
                    headerTransparent: true,
                }}
            />
        </Stack>
    );
}

