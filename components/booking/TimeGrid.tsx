import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../constants/Colors";
import { Court, TimeSlot } from "../../types/booking";

interface TimeGridProps {
  courts: Court[];
  selectedSlots: string[]; // List ID của slot đang chọn
  onToggleSlot: (court: Court, slot: TimeSlot) => void;
}

export default function TimeGrid({ courts, selectedSlots, onToggleSlot }: TimeGridProps) {
  return (
    <View style={styles.container}>
      {courts.map((court) => (
        <View key={court.id} style={styles.courtContainer}>
          {/* Header tên sân */}
          <View style={styles.courtHeader}>
            <View style={styles.courtIcon}>
              <Ionicons name="football-outline" size={20} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.courtName}>{court.name}</Text>
              <Text style={styles.courtType}>{court.type}</Text>
            </View>
          </View>

          {/* Grid giờ */}
          <View style={styles.grid}>
            {court.slots.map((slot: TimeSlot) => {
              const isSelected = selectedSlots.includes(slot.id);
              const isAvailable = slot.isAvailable;

              return (
                <TouchableOpacity
                  key={slot.id}
                  disabled={!isAvailable}
                  style={[
                    styles.slotItem,
                    !isAvailable && styles.slotDisabled,
                    isSelected && styles.slotSelected,
                  ]}
                  onPress={() => onToggleSlot(court, slot)}
                >
                  <Text
                    style={[
                      styles.timeText,
                      !isAvailable && styles.textDisabled,
                      isSelected && styles.textSelected,
                    ]}
                  >
                    {slot.time}
                  </Text>
                  <Text
                    style={[
                      styles.priceText,
                      !isAvailable && styles.textDisabled,
                      isSelected && styles.textSelected,
                    ]}
                  >
                    {slot.price.toLocaleString("vi-VN")}đ
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100, // Chừa chỗ cho nút Continue
  },
  courtContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  courtHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 12,
  },
  courtIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  courtName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  courtType: {
    fontSize: 12,
    color: "#666",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  slotItem: {
    width: "31%", // Chia 3 cột
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  slotDisabled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#F5F5F5",
  },
  slotSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  priceText: {
    fontSize: 10,
    color: "#666",
  },
  textDisabled: {
    color: "#BBB",
    textDecorationLine: "line-through",
  },
  textSelected: {
    color: "#fff",
  },
});