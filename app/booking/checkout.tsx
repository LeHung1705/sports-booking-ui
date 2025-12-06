import { bookingApi } from "@/api/bookingApi";
import { Colors } from "@/constants/Colors";
import { BookingPayload } from "@/types/booking";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView // Added SafeAreaView import
    ,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    venueId: string;
    date: string;
    slots: string;
    totalAmount: string;
  }>();

  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER">("CASH");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse Params
  const selectedSlots = params.slots ? JSON.parse(params.slots) : [];
  const dateObj = new Date(params.date);
  const formattedDate = `Thứ ${dateObj.getDay() + 1}, ${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
  const totalAmount = parseInt(params.totalAmount || "0");

  // Group slots by court for nicer display
  // In this simple UI, we just list them.

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
        if (selectedSlots.length === 0) return;

        // Sort slots by time
        selectedSlots.sort((a: any, b: any) => a.time.localeCompare(b.time));

        const courtId = selectedSlots[0].courtId;
        const datePart = params.date.split("T")[0]; // YYYY-MM-DD
        
        // Helper to format manually to: YYYY-MM-DDTHH:mm:ss+07:00
        const formatISO = (dateStr: string, timeStr: string) => {
            // Ensure timeStr is HH:mm (5 chars)
            const safeTime = timeStr.substring(0, 5); 
            return `${dateStr}T${safeTime}:00+07:00`;
        };

        // Start Time of first slot
        const firstTime = selectedSlots[0].time; // "05:00"
        const startTimeISO = formatISO(datePart, firstTime);
        
        // End Time of LAST slot
        // Note: Backend already returns 'endTime' for the slot (e.g. "05:30")
        // So we just use that directly.
        const lastSlot = selectedSlots[selectedSlots.length - 1];
        const endTimeStr = lastSlot.endTime; 
        const endTimeISO = formatISO(datePart, endTimeStr);

        const payload: BookingPayload = {
            court_id: courtId,
            start_time: startTimeISO,
            end_time: endTimeISO,
        };

        console.log("Booking Payload:", payload);

        const res = await bookingApi.createBooking(payload);
        
        router.replace("/booking/success");

    } catch (error: any) {
        console.error(error);
        Alert.alert("Thất bại", error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Thanh toán",
          headerBackTitle: "Quay lại",
          headerTintColor: Colors.primary,
        }}
      />
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
            
            {/* INVOICE CARD */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.venueName}>Sân bóng TechBo</Text>
                    <Text style={styles.dateText}>{formattedDate}</Text>
                </View>
                <View style={styles.divider} />
                
                {/* Slot List */}
                {selectedSlots.map((slot: any, index: number) => (
                    <View key={index} style={styles.slotRow}>
                        <View>
                            <Text style={styles.slotTime}>
                                {slot.time} - {slot.endTime}
                            </Text>
                            <Text style={styles.courtName}>{slot.courtName}</Text>
                        </View>
                        <Text style={styles.slotPrice}>
                            {(slot.price / 1000).toFixed(0)}k
                        </Text>
                    </View>
                ))}

                <View style={styles.divider} />
                
                {/* Total */}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tổng cộng</Text>
                    <Text style={styles.totalValue}>
                        {totalAmount.toLocaleString("vi-VN")} đ
                    </Text>
                </View>
            </View>

            {/* PAYMENT METHOD */}
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            <View style={styles.paymentContainer}>
                <TouchableOpacity 
                    style={[
                        styles.paymentOption, 
                        paymentMethod === "CASH" && styles.paymentOptionSelected
                    ]}
                    onPress={() => setPaymentMethod("CASH")}
                >
                    <Ionicons 
                        name="cash-outline" 
                        size={24} 
                        color={paymentMethod === "CASH" ? Colors.primary : "#666"} 
                    />
                    <Text style={[
                        styles.paymentText,
                        paymentMethod === "CASH" && styles.paymentTextSelected
                    ]}>Tiền mặt</Text>
                    {paymentMethod === "CASH" && (
                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} style={styles.checkIcon} />
                    )}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[
                        styles.paymentOption, 
                        paymentMethod === "TRANSFER" && styles.paymentOptionSelected
                    ]}
                    onPress={() => setPaymentMethod("TRANSFER")}
                >
                    <Ionicons 
                        name="card-outline" 
                        size={24} 
                        color={paymentMethod === "TRANSFER" ? Colors.primary : "#666"} 
                    />
                    <Text style={[
                        styles.paymentText,
                        paymentMethod === "TRANSFER" && styles.paymentTextSelected
                    ]}>Chuyển khoản</Text>
                    {paymentMethod === "TRANSFER" && (
                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} style={styles.checkIcon} />
                    )}
                </TouchableOpacity>
            </View>

            {/* NOTE INPUT */}
            <Text style={styles.sectionTitle}>Ghi chú</Text>
            <TextInput
                style={styles.input}
                placeholder="Nhập ghi chú cho chủ sân..."
                value={note}
                onChangeText={setNote}
                multiline
            />

        </ScrollView>

        {/* BOTTOM BUTTON */}
        <View style={styles.footer}>
            <TouchableOpacity 
                style={[styles.confirmButton, isSubmitting && styles.disabledButton]} 
                onPress={handleConfirm}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.confirmButtonText}>Xác nhận đặt sân</Text>
                )}
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  cardHeader: {
    marginBottom: 12,
  },
  venueName: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },
  slotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  slotTime: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
  },
  courtName: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  slotPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  paymentContainer: {
    marginBottom: 24,
    gap: 12,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  paymentOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#F0FDF4",
  },
  paymentText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginLeft: 12,
    flex: 1,
  },
  paymentTextSelected: {
    color: Colors.primary,
    fontWeight: "bold",
  },
  checkIcon: {
    marginLeft: "auto",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minHeight: 100,
    textAlignVertical: "top",
    fontSize: 15,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#A0DBC0",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});