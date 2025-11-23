// components/common/CourtCard.tsx
import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, } from "react-native";
import { Colors } from "@/constants/Colors";
import type { Court } from "@/types/Court";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

interface CourtCardProps {
  court: Court;
  onPress?: () => void;
}

export const CourtCard: React.FC<CourtCardProps> = ({ court, onPress }) => {
  const priceText =
    court.maxPricePerHour && court.maxPricePerHour !== court.minPricePerHour
      ? `${court.minPricePerHour.toLocaleString()} - ${court.maxPricePerHour.toLocaleString()} đ/h`
      : `${court.minPricePerHour.toLocaleString()} đ/h`;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.85}>
      {court.thumbnailUrl ? (
        <Image source={{ uri: court.thumbnailUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={26} color={Colors.textSecondary} />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {court.name}
        </Text>

        <View style={styles.rowAddress}>
          <Ionicons
            name="location-outline"
            size={14}
            color={Colors.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.address} numberOfLines={1}>
            {court.address}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.price}>{priceText}</Text>
          <View style={styles.ratingWrap}>
            <Ionicons name="star" size={14} color="#ffcc00" />
            <Text style={styles.ratingValue}>{court.ratingAvg.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({court.ratingCount})</Text>
          </View>
        </View>

        {court.distanceKm != null && (
          <View style={styles.rowDistance}>
            <MaterialIcons
              name="directions-walk"
              size={13}
              color={Colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.distance}>
              {court.distanceKm.toFixed(1)} km
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const CARD_HEIGHT = 110;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  image: {
    width: CARD_HEIGHT * 1.1,
    height: CARD_HEIGHT,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card,
  },
  content: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  rowAddress: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  address: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  row: {
    flexDirection: "row",
    marginTop: 6,
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  ratingWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingValue: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: "600",
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  rowDistance: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  distance: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
