import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors } from "../../constants/Colors";

// Chiều rộng card (để hiển thị đẹp trên list ngang hoặc dọc)
const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.7; // Card chiếm 70% màn hình

interface CourtCardProps {
  title: string;
  price: string; // Ví dụ: "200.000đ/h"
  rating: number;
  imageUrl: string;
  address: string;
  onPress: () => void;
}

export default function CourtCard({
  title,
  price,
  rating,
  imageUrl,
  address,
  onPress,
}: CourtCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Ảnh sân */}
      <Image source={{ uri: imageUrl }} style={styles.image} />
      
      {/* Badge giá tiền */}
      <View style={styles.priceBadge}>
        <Text style={styles.priceText}>{price}</Text>
      </View>

      <View style={styles.content}>
        {/* Tên sân & Đánh giá */}
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>

        {/* Địa chỉ */}
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.addressText} numberOfLines={1}>
            {address}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginRight: 16,
    marginBottom: 10,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
  content: {
    padding: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9C4",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
    color: "#FBC02D",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  priceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
});