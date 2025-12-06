import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "@/constants/Colors";

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { venueId, date, slots, totalPrice } = params;

  // Parse slots back to array
  const selectedSlots = slots ? JSON.parse(slots as string) : [];
  const displayDate = date ? new Date(date as string).toLocaleDateString("vi-VN") : "";

  const handleConfirm = () => {
    // Implement booking API call here
    alert("Tính năng đặt sân đang được phát triển!");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Xác nhận đặt sân",
          headerBackTitle: "Quay lại",
          headerTintColor: Colors.primary,
        }}
      />
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
            <Text style={styles.label}>Ngày đặt:</Text>
            <Text style={styles.value}>{displayDate}</Text>
        </View>

        <View style={styles.card}>
            <Text style={styles.label}>Khung giờ đã chọn:</Text>
            {selectedSlots.map((slot: any, index: number) => (
                <View key={index} style={styles.slotRow}>
                    <Text style={styles.slotTime}>{slot.time}</Text>
                    <Text style={styles.slotPrice}>{slot.price.toLocaleString("vi-VN")}đ</Text>
                </View>
            ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
          <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Tổng cộng:</Text>
              <Text style={styles.priceValue}>{Number(totalPrice).toLocaleString("vi-VN")} đ</Text>
          </View>

          <TouchableOpacity style={styles.btnConfirm} onPress={handleConfirm}>
              <Text style={styles.btnText}>Xác nhận & Thanh toán</Text>
          </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
  },
  slotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  slotTime: {
    fontSize: 15,
    color: Colors.text,
  },
  slotPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  bottomBar: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
  },
  btnConfirm: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
