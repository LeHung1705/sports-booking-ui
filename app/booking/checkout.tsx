import { bookingApi } from "@/api/bookingApi";
import { venueApi } from "@/api/venueApi"; // Import venueApi
import { voucherApi } from "@/api/voucherApi";
import CustomHeader from "@/components/ui/CustomHeader";
import { Colors } from "@/constants/Colors";
import { BookingPayload } from "@/types/booking";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react"; // Import useEffect
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  const [paymentOption, setPaymentOption] = useState<"FULL_PAYMENT" | "DEPOSIT">("FULL_PAYMENT");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [venueName, setVenueName] = useState("Đang tải..."); // State for venue name

  // Voucher State
  const [voucherCode, setVoucherCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState("");

  // Parse Params
  const selectedSlots = params.slots ? JSON.parse(params.slots) : [];
  const dateObj = new Date(params.date);
  const formattedDate = `Thứ ${dateObj.getDay() + 1}, ${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
  const totalAmount = parseInt(params.totalAmount || "0");
  const finalAmount = totalAmount - discount;
  const depositAmount = Math.round(finalAmount * 0.3);

  // Fetch venue name on component mount
  useEffect(() => {
    const fetchVenueName = async () => {
      if (params.venueId) {
        try {
          const response = await venueApi.getVenueDetail(params.venueId);
          setVenueName(response.name);
        } catch (error) {
          console.error("Error fetching venue details:", error);
          setVenueName("Không xác định");
        }
      }
    };
    fetchVenueName();
  }, [params.venueId]);

  const handleCheckVoucher = async () => {
    if (!voucherCode.trim()) return;
    setIsCheckingVoucher(true);
    setVoucherError("");
    setDiscount(0);

    try {
        console.log("🔍 CHECKING VOUCHER Payload:", { code: voucherCode, order_amount: totalAmount, venue_id: params.venueId });
        const res = await voucherApi.previewVoucher(voucherCode, totalAmount, params.venueId);
        if (res.valid) {
            setDiscount(res.discount);
            Alert.alert("Thành công", `Áp dụng mã giảm giá: -${(res.discount / 1000).toLocaleString()}k`);
        } else {
            setVoucherError(res.reason || "Voucher không hợp lệ");
            Alert.alert("Lỗi", res.reason || "Voucher không hợp lệ");
        }
    } catch (error: any) {
        console.log("Voucher check error:", error);
        setVoucherError("Lỗi kiểm tra voucher");
        Alert.alert("Lỗi", "Không thể kiểm tra voucher lúc này");
    } finally {
        setIsCheckingVoucher(false);
    }
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
        if (selectedSlots.length === 0) return;

        // 1. Sort slots to ensure chronological order
        selectedSlots.sort((a: any, b: any) => a.time.localeCompare(b.time));

        const courtId = selectedSlots[0].courtId;
        const datePart = params.date.split("T")[0]; // YYYY-MM-DD
        
        // 2. Calculate Start Time (First Slot)
        const firstSlot = selectedSlots[0];
        // Clean format for LocalDateTime: "2025-12-14T09:00:00" (No offset)
        const startTimeISO = `${datePart}T${firstSlot.time}:00`;

        // 3. Calculate End Time (Last Slot + 30 mins)
        const lastSlot = selectedSlots[selectedSlots.length - 1];
        const [lastHourStr, lastMinuteStr] = lastSlot.time.split(":");
        let endHour = parseInt(lastHourStr, 10);
        let endMinute = parseInt(lastMinuteStr, 10);

        // Add 30 minutes for the last slot duration
        endMinute += 30;
        if (endMinute >= 60) {
            endHour += 1;
            endMinute -= 60;
        }

        const endTimeFormatted = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        const endTimeISO = `${datePart}T${endTimeFormatted}:00`;

        const payload: BookingPayload = {
            court_id: courtId,
            start_time: startTimeISO,
            end_time: endTimeISO,
            payment_option: paymentOption
        };

        // 4. Create Booking
        const bookingRes = await bookingApi.createBooking(payload);
        const bookingId = bookingRes.id;

        // 5. Apply Voucher (if valid discount exists)
        if (discount > 0 && voucherCode) {
            try {
                await bookingApi.applyVoucher(bookingId, voucherCode);
                console.log("✅ Voucher applied successfully to booking", bookingId);
            } catch (voucherErr) {
                console.error("❌ Failed to apply voucher:", voucherErr);
                Alert.alert("Lưu ý", "Đã đặt sân thành công nhưng áp dụng voucher thất bại. Vui lòng liên hệ nhân viên.");
            }
        }
        
        // Always navigate to Payment Screen now
        router.replace({
            pathname: "/booking/payment",
            params: {
                bookingId: bookingId,
                totalAmount: bookingRes.amountToPay.toString(), // Use amountToPay from backend
                bankBin: bookingRes.bankBin,
                bankAccount: bookingRes.bankAccountNumber,
                bankName: bookingRes.bankAccountName
            }
        });

    } catch (error: any) {
        console.error(error);
        Alert.alert("Thất bại", error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Thanh toán" showBackButton />
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
            
            {/* INVOICE CARD */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.venueName}>{venueName}</Text>
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

                {/* Voucher Section inside Card */}
                <View style={styles.voucherSection}>
                     <View style={styles.voucherInputRow}>
                        <TextInput
                            style={styles.voucherInput}
                            placeholder="Mã giảm giá"
                            placeholderTextColor="#999"
                            value={voucherCode}
                            onChangeText={(text) => {
                                setVoucherCode(text);
                                if (discount > 0) setDiscount(0); // Reset discount if code changes
                                if (voucherError) setVoucherError("");
                            }}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity 
                            style={[
                                styles.applyButton, 
                                (!voucherCode || isCheckingVoucher) && styles.applyButtonDisabled
                            ]}
                            onPress={handleCheckVoucher}
                            disabled={!voucherCode || isCheckingVoucher}
                        >
                            {isCheckingVoucher ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.applyButtonText}>Áp dụng</Text>
                            )}
                        </TouchableOpacity>
                     </View>
                     {discount > 0 && <Text style={styles.successText}>Đã áp dụng giảm giá</Text>}
                     {voucherError ? <Text style={styles.errorText}>{voucherError}</Text> : null}
                </View>

                <View style={styles.divider} />
                
                {/* Total */}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tạm tính</Text>
                    <Text style={styles.totalValue}>
                        {totalAmount.toLocaleString("vi-VN")} đ
                    </Text>
                </View>

                {discount > 0 && (
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Giảm giá</Text>
                        <Text style={[styles.totalValue, { color: Colors.primary }]}>
                            - {discount.toLocaleString("vi-VN")} đ
                        </Text>
                    </View>
                )}

                <View style={[styles.totalRow, { marginTop: 12 }]}>
                    <Text style={[styles.totalLabel, { fontWeight: "bold", fontSize: 18 }]}>Tổng thanh toán</Text>
                    <Text style={[styles.totalValue, { fontSize: 22, color: Colors.primary }]}>
                        {finalAmount.toLocaleString("vi-VN")} đ
                    </Text>
                </View>
            </View>

            {/* PAYMENT OPTIONS */}
            <Text style={styles.sectionTitle}>Hình thức thanh toán</Text>
            <View style={styles.paymentContainer}>
                
                {/* Option 1: Full Payment */}
                <TouchableOpacity 
                    style={[
                        styles.paymentOption, 
                        paymentOption === "FULL_PAYMENT" && styles.paymentOptionSelected
                    ]}
                    onPress={() => setPaymentOption("FULL_PAYMENT")}
                >
                    <Ionicons 
                        name={paymentOption === "FULL_PAYMENT" ? "radio-button-on" : "radio-button-off"}
                        size={24} 
                        color={paymentOption === "FULL_PAYMENT" ? Colors.primary : "#666"} 
                    />
                    <View style={styles.optionContent}>
                        <Text style={[
                            styles.paymentText,
                            paymentOption === "FULL_PAYMENT" && styles.paymentTextSelected
                        ]}>Thanh toán toàn bộ (100%)</Text>
                        <Text style={styles.subText}>
                           Thanh toán ngay: <Text style={{fontWeight:'bold', color: Colors.primary}}>{finalAmount.toLocaleString("vi-VN")} đ</Text>
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Option 2: Deposit 30% */}
                <TouchableOpacity 
                    style={[
                        styles.paymentOption, 
                        paymentOption === "DEPOSIT" && styles.paymentOptionSelected
                    ]}
                    onPress={() => setPaymentOption("DEPOSIT")}
                >
                    <Ionicons 
                        name={paymentOption === "DEPOSIT" ? "radio-button-on" : "radio-button-off"} 
                        size={24} 
                        color={paymentOption === "DEPOSIT" ? Colors.primary : "#666"} 
                    />
                    <View style={styles.optionContent}>
                        <Text style={[
                            styles.paymentText,
                            paymentOption === "DEPOSIT" && styles.paymentTextSelected
                        ]}>Đặt cọc giữ chỗ (30%)</Text>
                         <Text style={styles.subText}>
                           Thanh toán trước: <Text style={{fontWeight:'bold', color: Colors.primary}}>{depositAmount.toLocaleString("vi-VN")} đ</Text>
                        </Text>
                         <Text style={styles.noteText}>
                           Phần còn lại thanh toán tại sân.
                        </Text>
                    </View>
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
                    <Text style={styles.confirmButtonText}>
                        Thanh toán {paymentOption === "FULL_PAYMENT" ? finalAmount.toLocaleString("vi-VN") : depositAmount.toLocaleString("vi-VN")} đ
                    </Text>
                )}
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
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
    marginLeft: 0,
    flex: 1,
  },
  paymentTextSelected: {
    color: Colors.primary,
    fontWeight: "bold",
  },
  checkIcon: {
    marginLeft: "auto",
  },
  optionContent: {
    marginLeft: 12,
    flex: 1,
  },
  subText: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  noteText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginTop: 2,
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
  // Voucher Styles
  voucherSection: {
    marginVertical: 4,
  },
  voucherInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  voucherInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
    textTransform: "uppercase",
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 8,
    height: 44,
  },
  applyButtonDisabled: {
    backgroundColor: "#ccc",
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  successText: {
    color: Colors.primary,
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
});