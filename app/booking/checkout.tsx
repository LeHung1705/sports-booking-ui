import { bookingApi } from "@/api/bookingApi";
import { voucherApi } from "@/api/voucherApi";
import CustomHeader from "@/components/ui/CustomHeader";
import PolicyModal from "@/components/ui/PolicyModal";
import { Colors } from "@/constants/Colors";
import { BookingDetailResponse } from "@/types/booking";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;
  
  // Extract primitive params to use in dependency array
  const courtId = params.courtId as string;
  const startTime = params.startTime as string;
  const endTime = params.endTime as string;
  const totalPrice = params.totalPrice ? Number(params.totalPrice) : 0;
  const venueId = params.venueId as string;
  const venueName = params.venueName as string;
  const courtName = params.courtName as string;

  const [booking, setBooking] = useState<BookingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentOption, setPaymentOption] = useState<"FULL_PAYMENT" | "DEPOSIT">("DEPOSIT");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [creating, setCreating] = useState(false);

  // Voucher State
  const [voucherCode, setVoucherCode] = useState("");
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState("");

  useEffect(() => {
    const init = async () => {
      if (bookingId) {
        // Mode 1: Existing booking
        try {
          const data = await bookingApi.getBookingDetail(bookingId);
          setBooking(data);
        } catch (error) {
          Alert.alert("Lỗi", "Không thể tải thông tin đơn hàng.");
          router.back();
        }
      } else if (courtId && startTime) {
        // Mode 2: New booking flow (from Schedule)
        // Construct mock booking object for display
        const mockBooking: BookingDetailResponse = {
            id: '', 
            venue: venueName || 'Venue',
            court: courtName || 'Court',
            startTime: startTime,
            endTime: endTime,
            totalPrice: totalPrice,
            status: 'PENDING_PAYMENT',
            createdAt: new Date().toISOString(),
            venueId: venueId,
            discountAmount: 0,
            voucherCode: '',
        } as any; 
        
        setBooking(mockBooking);
      }
      setLoading(false);
    };
    
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, courtId, startTime, endTime, totalPrice, venueId, venueName, courtName]);

  // Timer Logic - Only active if booking already exists on backend
  useEffect(() => {
    if (!booking?.createdAt || !bookingId) return;

    const createdTime = new Date(booking.createdAt).getTime();
    const expireTime = createdTime + 10 * 60 * 1000; // 10 minutes

    const updateTimer = () => {
        const now = Date.now();
        const diff = Math.floor((expireTime - now) / 1000);
        
        if (diff <= 0) {
            setTimeLeft(0);
            setIsExpired(true);
        } else {
            setTimeLeft(diff);
            setIsExpired(false);
        }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [booking?.createdAt, bookingId]);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim() || !booking) return;
    setIsCheckingVoucher(true);
    setVoucherError("");

    try {
        if (bookingId) {
            // Apply to existing booking
            await bookingApi.applyVoucher(booking.id, voucherCode);
            Alert.alert("Thành công", "Đã áp dụng mã giảm giá.");
            const updated = await bookingApi.getBookingDetail(booking.id);
            setBooking(updated);
        } else {
            // Preview for new booking
            const currentTotal = Number(booking.totalPrice) || 0;
            const currentDiscount = Number(booking.discountAmount) || 0;
            const originalPrice = currentTotal + currentDiscount;

            const res = await voucherApi.previewVoucher(voucherCode, originalPrice, booking.venueId);
            if (res.valid) {
                // Update local mock booking
                setBooking(prev => {
                    if (!prev) return null;
                    // Recalculate original price from PREVIOUS state to be safe (though it should match)
                    const pTotal = Number(prev.totalPrice) || 0;
                    const pDisc = Number(prev.discountAmount) || 0;
                    const basePrice = pTotal + pDisc;
                    
                    const newDiscount = Number(res.discount) || 0;
                    const newTotal = Math.max(0, basePrice - newDiscount);
                    
                    return {
                        ...prev,
                        discountAmount: newDiscount,
                        voucherCode: voucherCode,
                        totalPrice: newTotal 
                    };
                });
                Alert.alert("Thành công", "Voucher hợp lệ.");
            } else {
                throw new Error(res.reason);
            }
        }
    } catch (error: any) {
        setVoucherError(error.response?.data?.message || error.message || "Voucher không hợp lệ");
        Alert.alert("Lỗi", error.response?.data?.message || error.message || "Không thể áp dụng voucher");
    } finally {
        setIsCheckingVoucher(false);
    }
  };

  const onConfirmPolicy = async () => {
      setShowPolicy(false);
      if (!booking) return;

      let finalBookingId = bookingId;
      let finalAmount = booking.totalPrice;
      
      // Initialize with potentially existing info
      let bankBin = booking.bankBin;
      let bankAccountNumber = booking.bankAccountNumber;
      let bankAccountName = booking.bankAccountName;

      // Create booking if not exists
      if (!finalBookingId) {
          setCreating(true);
          try {
              // 1. Create Booking
              const createRes = await bookingApi.createBooking({
                  court_id: courtId,
                  start_time: startTime,
                  end_time: endTime,
                  payment_option: paymentOption
              });
              finalBookingId = createRes.id;
              finalAmount = createRes.totalAmount;
              
              // Capture bank info from response
              bankBin = createRes.bankBin;
              bankAccountNumber = createRes.bankAccountNumber;
              bankAccountName = createRes.bankAccountName;

              // 2. Apply voucher if selected
              if (booking.voucherCode) {
                  try {
                      await bookingApi.applyVoucher(finalBookingId, booking.voucherCode);
                      const details = await bookingApi.getBookingDetail(finalBookingId);
                      finalAmount = details.totalPrice;
                      // Update bank info just in case
                      bankBin = details.bankBin;
                      bankAccountNumber = details.bankAccountNumber;
                      bankAccountName = details.bankAccountName;
                  } catch (e) {
                      console.error("Failed to apply voucher to new booking", e);
                  }
              }
          } catch (e: any) {
              setCreating(false);
              Alert.alert("Lỗi", e.response?.data?.message || "Không thể tạo đơn hàng. Vui lòng thử lại.");
              return;
          }
          setCreating(false);
      }

      // Calculate deposit if needed
      let amountToPay = 0;
      if (paymentOption === "DEPOSIT") {
          amountToPay = Math.round(finalAmount * 0.3);
      } else {
          amountToPay = finalAmount;
      }

      router.push({
          pathname: "/booking/payment",
          params: {
              bookingId: finalBookingId,
              totalAmount: amountToPay.toString(),
              bankBin: bankBin || '',
              bankAccount: bankAccountNumber || '',
              bankName: bankAccountName || '',
          }
      });
  };

  const handleProceed = () => {
      if (!booking) return;
      if (bookingId && isExpired) { // Only check expiry if real booking
          Alert.alert("Hết hạn", "Đơn hàng đã hết hạn giữ chỗ.");
          return;
      }
      setShowPolicy(true);
  };

  if (loading) {
      return (
          <View style={[styles.container, styles.center]}>
              <ActivityIndicator size="large" color={Colors.primary} />
          </View>
      );
  }

  if (!booking) return null;

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Helper date format
  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);
  const dateStr = `Thứ ${startDate.getDay() + 1}, ${startDate.getDate()}/${startDate.getMonth() + 1}/${startDate.getFullYear()}`;
  
  const startHour = startDate.getHours().toString().padStart(2, '0');
  const startMin = startDate.getMinutes().toString().padStart(2, '0');
  const endHour = endDate.getHours().toString().padStart(2, '0');
  const endMin = endDate.getMinutes().toString().padStart(2, '0');
  
  const timeStr = `${startHour}:${startMin} - ${endHour}:${endMin}`;

  return (
    <View style={styles.container}>
      <CustomHeader title="Thanh toán" showBackButton />
      <StatusBar barStyle="dark-content" />

      {/* COUNTDOWN TIMER - Only if bookingId exists */}
      {bookingId && timeLeft !== null && (
          <View style={[styles.timerContainer, isExpired && styles.timerExpired]}>
              <Text style={styles.timerLabel}>
                  {isExpired ? "Hết thời gian giữ chỗ" : "Thời gian giữ chỗ còn lại:"}
              </Text>
              <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
          </View>
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
            
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.venueName}>{booking.venue}</Text>
                    <Text style={styles.dateText}>{dateStr}</Text>
                </View>
                <View style={styles.divider} />
                
                <View style={styles.slotRow}>
                    <View>
                        <Text style={styles.slotTime}>{timeStr}</Text>
                        <Text style={styles.courtName}>{booking.court}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        {(booking.discountAmount && booking.discountAmount > 0) ? (
                            <Text style={styles.originalPriceText}>
                                {(Number(booking.totalPrice) + Number(booking.discountAmount)).toLocaleString("vi-VN")} đ
                            </Text>
                        ) : null}
                        {(booking.discountAmount && booking.discountAmount > 0) ? (
                            <Text style={styles.discountText}>
                                -{booking.discountAmount.toLocaleString("vi-VN")} đ
                            </Text>
                        ) : null}
                        <Text style={styles.finalPriceText}>
                            {booking.totalPrice.toLocaleString("vi-VN")} đ
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Voucher */}
                <View style={styles.voucherSection}>
                     <View style={styles.voucherInputRow}>
                        <TextInput
                            style={styles.voucherInput}
                            placeholder="Mã giảm giá"
                            value={voucherCode}
                            onChangeText={setVoucherCode}
                            autoCapitalize="characters"
                            editable={!isExpired && !booking.voucherCode} // Disable if applied or expired
                        />
                        <TouchableOpacity 
                            style={[ 
                                styles.applyButton, 
                                (!voucherCode || isCheckingVoucher || isExpired || !!booking.voucherCode) && styles.applyButtonDisabled
                            ]}
                            onPress={handleApplyVoucher}
                            disabled={!voucherCode || isCheckingVoucher || isExpired || !!booking.voucherCode}
                        >
                            {isCheckingVoucher ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.applyButtonText}>Áp dụng</Text>
                            )}
                        </TouchableOpacity>
                     </View>
                     {voucherError ? <Text style={styles.errorText}>{voucherError}</Text> : null}
                     {booking.voucherCode && booking.discountAmount && booking.discountAmount > 0 ? (
                        <View style={styles.voucherAppliedContainer}>
                            <Ionicons name="checkmark-circle" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
                            <View>
                                <Text style={styles.voucherAppliedText}>
                                    Voucher đã áp dụng: <Text style={styles.voucherCodeApplied}>{booking.voucherCode}</Text>
                                </Text>
                                <Text style={styles.voucherAppliedDiscount}>
                                    Giảm: -{booking.discountAmount.toLocaleString("vi-VN")} đ
                                </Text>
                            </View>
                        </View>
                     ) : null}
                </View>

                <View style={styles.divider} />
                
                {/* Price Breakdown */}
                {(booking.discountAmount && booking.discountAmount > 0) ? (
                    <>
                        <View style={[styles.totalRow, { marginTop: 4 }]}>
                            <Text style={[styles.totalLabel, { fontSize: 14, color: '#666' }]}>Tạm tính</Text>
                            <Text style={[styles.totalValue, { fontSize: 16, color: '#666', textDecorationLine: 'line-through' }]}>
                                {(Number(booking.totalPrice) + Number(booking.discountAmount)).toLocaleString("vi-VN")} đ
                            </Text>
                        </View>
                        <View style={[styles.totalRow, { marginTop: 4 }]}>
                            <Text style={[styles.totalLabel, { fontSize: 14, color: Colors.primary }]}>Giảm giá</Text>
                            <Text style={[styles.totalValue, { fontSize: 16, color: Colors.primary }]}>
                                -{booking.discountAmount.toLocaleString("vi-VN")} đ
                            </Text>
                        </View>
                        <View style={[styles.divider, { marginVertical: 8 }]} />
                    </>
                ) : null}

                <View style={[styles.totalRow, { marginTop: 4 }]}>
                    <Text style={[styles.totalLabel, { fontWeight: "bold", fontSize: 18 }]}>Tổng thanh toán</Text>
                    <Text style={[styles.totalValue, { fontSize: 22, color: Colors.primary }]}>
                        {booking.totalPrice.toLocaleString("vi-VN")} đ
                    </Text>
                </View>
            </View>

            {/* Payment Options */}
            <Text style={styles.sectionTitle}>Hình thức thanh toán</Text>
            <View style={styles.paymentContainer}>
                <TouchableOpacity 
                    style={[styles.paymentOption, paymentOption === "DEPOSIT" && styles.paymentOptionSelected]}
                    onPress={() => setPaymentOption("DEPOSIT")}
                    disabled={isExpired}
                >
                    <Ionicons name={paymentOption === "DEPOSIT" ? "radio-button-on" : "radio-button-off"} size={24} color={paymentOption === "DEPOSIT" ? Colors.primary : "#666"} />
                    <View style={styles.optionContent}>
                        <Text style={[styles.paymentText, paymentOption === "DEPOSIT" && styles.paymentTextSelected]}>Đặt cọc (30%)</Text>
                        <Text style={styles.subText}>{Math.round(booking.totalPrice * 0.3).toLocaleString("vi-VN")} đ</Text>
                        <Text style={[styles.subText, { fontSize: 12, color: '#FF9800', marginTop: 2 }]}>
                             (Còn lại tại sân: {(booking.totalPrice - Math.round(booking.totalPrice * 0.3)).toLocaleString("vi-VN")} đ)
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.paymentOption, paymentOption === "FULL_PAYMENT" && styles.paymentOptionSelected]}
                    onPress={() => setPaymentOption("FULL_PAYMENT")}
                    disabled={isExpired}
                >
                     <Ionicons name={paymentOption === "FULL_PAYMENT" ? "radio-button-on" : "radio-button-off"} size={24} color={paymentOption === "FULL_PAYMENT" ? Colors.primary : "#666"} />
                    <View style={styles.optionContent}>
                        <Text style={[styles.paymentText, paymentOption === "FULL_PAYMENT" && styles.paymentTextSelected]}>Thanh toán hết</Text>
                        <Text style={styles.subText}>{booking.totalPrice.toLocaleString("vi-VN")} đ</Text>
                    </View>
                </TouchableOpacity>
            </View>

        </ScrollView>

        <View style={styles.footer}>
            <TouchableOpacity 
                style={[styles.confirmButton, (isExpired || creating) && styles.disabledButton]} 
                onPress={handleProceed}
                disabled={isExpired || creating}
            >
                {creating ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.confirmButtonText}>
                        {isExpired ? "Đã hết hạn" : "Tiếp tục thanh toán"}
                    </Text>
                )}
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <PolicyModal
        visible={showPolicy}
        title="CHÍNH SÁCH ĐẶT SÂN & THANH TOÁN"
        onConfirm={onConfirmPolicy}
        onCancel={() => setShowPolicy(false)}
      >
        <Text style={styles.policyHeader}>1. Quy định đặt cọc & Giữ chỗ</Text>
        <Text style={styles.policyText}>
          • <Text style={styles.bold}>Thời gian giữ chỗ:</Text> Sau khi bấm xác nhận đặt sân, bạn có <Text style={styles.bold}>10 phút</Text> để thực hiện chuyển khoản. Quá thời gian này, hệ thống sẽ tự động hủy đơn và mở lại lịch cho người khác.{"\n"}
          • <Text style={styles.bold}>Mức thanh toán:</Text> Bạn có thể chọn một trong hai hình thức:{"\n"}
          {"  "}- <Text style={styles.bold}>Đặt cọc (30%):</Text> Thanh toán trước 30% giá trị đơn hàng (hoặc tối thiểu 50.000đ) để giữ sân. Phần còn lại thanh toán trực tiếp tại sân.{"\n"}
          {"  "}- <Text style={styles.bold}>Thanh toán hết (100%):</Text> Chuyển khoản toàn bộ giá trị đơn hàng.{"\n"}
          • <Text style={styles.bold}>Phương thức:</Text> Chuyển khoản nhanh qua mã QR (VietQR) hiển thị trên ứng dụng.
        </Text>

        <Text style={styles.policyHeader}>2. Quy trình Thanh toán (Đặt sân)</Text>
        <Text style={styles.policyText}>
          Để đảm bảo minh bạch, vui lòng đọc kỹ quy trình dòng tiền dưới đây:{"\n"}
          1. <Text style={styles.bold}>Đặt sân:</Text> Bạn chọn giờ và hình thức thanh toán (Cọc 30% hoặc Trả hết).{"\n"}
          2. <Text style={styles.bold}>Quét mã:</Text> Ứng dụng hiển thị mã QR chứa thông tin tài khoản của Chủ sân.{"\n"}
          3. <Text style={styles.bold}>Chuyển khoản:</Text> Bạn quét mã và thực hiện chuyển khoản trên app ngân hàng của mình.{"\n"}
          4. <Text style={styles.bold}>Xác nhận:</Text> Bạn bấm nút <Text style={styles.bold}>"Tôi đã thanh toán"</Text> trên ứng dụng.{"\n"}
          5. <Text style={styles.bold}>Thành công:</Text> Chủ sân nhận được thông báo, kiểm tra tài khoản và xác nhận đơn hàng của bạn.
        </Text>
        
        <Text style={styles.policyNote}>
            *Bấm "Tôi đã hiểu và Đồng ý" đồng nghĩa với việc bạn đã hiểu và đồng ý với toàn bộ chính sách trên.*
        </Text>
      </PolicyModal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 100 },
  
  // Timer
  timerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFF8E1',
      padding: 12,
      gap: 8,
  },
  timerExpired: {
      backgroundColor: '#FFEBEE',
  },
  timerLabel: {
      fontSize: 14,
      color: '#F57C00',
      fontWeight: '600'
  },
  timerValue: {
      fontSize: 16,
      color: '#E65100',
      fontWeight: 'bold',
      fontVariant: ['tabular-nums']
  },

  card: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 24, elevation: 2 },
  cardHeader: { marginBottom: 12 },
  venueName: { fontSize: 18, fontWeight: "bold", color: Colors.text, marginBottom: 4 },
  dateText: { fontSize: 14, color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 12 },
  slotRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  slotTime: { fontSize: 15, fontWeight: "500", color: Colors.text },
  courtName: { fontSize: 12, color: Colors.textSecondary },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  totalLabel: { fontSize: 16, color: Colors.text },
  totalValue: { fontSize: 20, fontWeight: "bold", color: Colors.primary },
  
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: Colors.text, marginBottom: 12, marginLeft: 4 },
  paymentContainer: { marginBottom: 24, gap: 12 },
  paymentOption: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#E0E0E0" },
  paymentOptionSelected: { borderColor: Colors.primary, backgroundColor: "#F0FDF4" },
  paymentText: { fontSize: 15, fontWeight: "500", color: "#333", flex: 1 },
  paymentTextSelected: { color: Colors.primary, fontWeight: "bold" },
  optionContent: { marginLeft: 12, flex: 1 },
  subText: { fontSize: 13, color: "#666", marginTop: 2 },

  voucherSection: { marginVertical: 4 },
  voucherInputRow: { flexDirection: "row", gap: 8 },
  voucherInput: { flex: 1, height: 44, borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 8, paddingHorizontal: 12, backgroundColor: "#F9FAFB", textTransform: "uppercase" },
  applyButton: { backgroundColor: Colors.primary, paddingHorizontal: 16, justifyContent: "center", borderRadius: 8, height: 44 },
  applyButtonDisabled: { backgroundColor: "#ccc" },
  applyButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  errorText: { color: "red", fontSize: 12, marginTop: 4 },

  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", padding: 16, borderTopWidth: 1, borderTopColor: "#E0E0E0" },
  confirmButton: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  disabledButton: { backgroundColor: "#ccc" },
  confirmButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  
  // Policy Styles
  policyHeader: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginTop: 12, marginBottom: 8 },
  policyText: { fontSize: 14, color: '#444', lineHeight: 22, marginBottom: 8 },
  policyNote: { fontSize: 13, fontStyle: 'italic', color: '#666', marginTop: 12, textAlign: 'center' },
  bold: { fontWeight: 'bold', color: '#000' },

  // New price display styles
  originalPriceText: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discountText: {
    fontSize: 12,
    color: Colors.primary, // Or another color for emphasis
    fontWeight: '500',
  },
  finalPriceText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
  },

  // Voucher Applied Display Styles
  voucherAppliedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E6F4EA', // Light green background for success
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#AED581',
  },
  voucherAppliedText: {
    fontSize: 14,
    color: '#388E3C', // Darker green text
  },
  voucherCodeApplied: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  voucherAppliedDiscount: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: 'bold',
    marginTop: 2,
  },
});