// components/home/VenueCard.tsx
import { Colors } from "@/constants/Colors";
import type { VenueListItem } from "@/types/venue";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface VenueCardProps {
    venue: VenueListItem;
    onPress?: () => void;
}

export const VenueCard: React.FC<VenueCardProps> = ({ venue, onPress }) => {
    let priceText = "—";

    if (venue.minPrice != null && venue.maxPrice != null) {
        priceText =
            venue.minPrice !== venue.maxPrice
                ? `${venue.minPrice.toLocaleString()} - ${venue.maxPrice.toLocaleString()} đ/giờ`
                : `${venue.minPrice.toLocaleString()} đ/giờ`;
    }

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={onPress}
        >
            {venue.imageUrl ? (
                <Image source={{ uri: venue.imageUrl }} style={styles.image} />
            ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                    <Ionicons
                        name="business-outline"
                        size={24}
                        color={Colors.textSecondary}
                    />
                </View>
            )}

            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                    {venue.name}
                </Text>
                <Text style={styles.address} numberOfLines={2}>
                    {venue.address}
                </Text>

                <View style={styles.footer}>
                    <Text style={styles.price}>{priceText}</Text>

                    <View style={styles.ratingRow}>
                        <Ionicons
                            name="star"
                            size={14}
                            color={venue.avgRating != null ? "#ffcc00" : "#ccc"}
                            style={{ marginRight: 4 }}
                        />

                        {venue.avgRating != null ? (
                            <Text style={styles.ratingText}>
                                {venue.avgRating.toFixed(1)}
                            </Text>
                        ) : (
                            <Text style={styles.ratingText}>0</Text>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: Colors.card,
    },
    imagePlaceholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    info: {
        flex: 1,
        justifyContent: "space-between",
    },
    name: {
        fontSize: 15,
        fontWeight: "bold",
        color: Colors.text,
        marginBottom: 4,
    },
    address: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    price: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.primary,
    },
    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    ratingText: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginLeft: 4,
    },
});
