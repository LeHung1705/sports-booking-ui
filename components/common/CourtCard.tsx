import { Colors } from "@/constants/Colors";
import type { VenueDetailCourtItem } from "@/types/venue";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface CourtCardProps {
  court: VenueDetailCourtItem;
  onPress?: () => void;
}

export default function CourtCard({ court, onPress }: CourtCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.75}
    >
    
      <View style={styles.topRow}>
        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {court.name}
          </Text>

          {court.sport && (
            <Text style={styles.sport} numberOfLines={1}>
              {court.sport}
            </Text>
          )}

          <Text style={styles.priceRow}>
            <Text style={styles.priceLabel}>Giá: </Text>
            <Text style={styles.priceValue}>
              {court.pricePerHour ? court.pricePerHour.toLocaleString() : 0} đ/giờ
            </Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  sport: {
    marginTop: 4,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  priceRow: {
    marginTop: 8,
    fontSize: 14,
  },
  priceLabel: {
    fontWeight: "600",
    color: Colors.text,
  },
  priceValue: {
    color: Colors.primary,
    fontWeight: "600",
  },
  buttonRow: {
    marginTop: 10,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
  },
});