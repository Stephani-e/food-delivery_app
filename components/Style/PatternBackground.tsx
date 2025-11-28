import React from "react";
import { Image, StyleSheet, View, ViewStyle, ImageSourcePropType } from "react-native";

interface PatternBackgroundProps {
    children?: React.ReactNode;
    patternImage?: ImageSourcePropType | { uri: string } ;
    opacity?: number;
    patternSize?: number;
    style?: ViewStyle;
    rows?: number;
    columns?: number;
}

export default function PatternBackground({children, patternImage = require("@/assets/images/fries.png"), opacity = 0.1, patternSize = 100, rows = 10, columns = 10}: PatternBackgroundProps) {
    const tiles = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            tiles.push(
                <Image
                    key={`${r}-${c}`}
                    source={patternImage}
                    style={[
                        styles.tile,
                        { width: patternSize, height: patternSize, opacity },
                    ]}
                    resizeMode="cover"
                />
            );
        }
    }

    return (
        <View style={[styles.container]}>
            {tiles}
            <View style={StyleSheet.absoluteFill}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexWrap: "wrap",
        flexDirection: 'row',
    },
    tile: {
        position: "relative",
    },
});

