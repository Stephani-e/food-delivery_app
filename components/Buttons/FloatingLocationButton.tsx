import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function FloatingLocationButton({ onPress }: { onPress: () => void }) {
    return (
        <TouchableOpacity
            style={styles.floatingButton}
            onPress={onPress}
        >
            <Ionicons name="location-outline" size={20} color="#f3f3f3" />
            <Text style={styles.buttonText}>Check Locations</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    floatingButton: {
        position: "absolute",
        bottom: 100, // above cart
        right: 20,
        backgroundColor: "#E4A900",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        marginLeft: 6,
    },
});
