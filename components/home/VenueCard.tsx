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

    const hasRating = venue.avgRating != null;
    const ratingText = hasRating ? venue.avgRating!.toFixed(1) : "";

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={onPress}
        >
            {/* IMAGE */}
            {venue.imageUrl ? (
                <Image source={{ uri: venue.imageUrl }} style={styles.image} />
            ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                    <Ionicons name="business-outline" size={26} color={Colors.textSecondary} />
                </View>
            )}

            {/* CONTENT */}
            <View style={styles.info}>
                <View style={styles.headerRow}>
                    <Text style={styles.name} numberOfLines={1}>
                        {venue.name}
                    </Text>

                    <View style={styles.ratingRow}>
                        <Ionicons
                            name="star"
                            size={16}
                            color={hasRating ? "#FFD700" : "#ccc"}
                        />
                        <Text style={styles.ratingText}>{ratingText}</Text>
                    </View>
                </View>

                <Text style={styles.address} numberOfLines={2}>
                    {venue.address}
                    {venue.district ? `, ${venue.district}` : ""}
                    {venue.city ? `, ${venue.city}` : ""}
                </Text>

                <Text style={styles.price}>{priceText}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        backgroundColor: Colors.white,
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
    },

    image: {
        width: 92,
        height: 92,
        borderRadius: 10,
        marginRight: 14,
        backgroundColor: Colors.card,
    },

    imagePlaceholder: {
        justifyContent: "center",
        alignItems: "center",
    },

    info: {
        flex: 1,
        justifyContent: "center",
    },

    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },

    name: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
        color: Colors.text,
    },

    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 6,
    },

    ratingText: {
        fontSize: 14,
        marginLeft: 4,
        fontWeight: "500",
        color: Colors.textSecondary,
    },

    address: {
        fontSize: 14,
        lineHeight: 18,
        color: Colors.textSecondary,
        marginBottom: 8,
    },

    price: {
        fontSize: 15,
        fontWeight: "600",
        color: Colors.primary,
    },
});
