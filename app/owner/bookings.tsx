import CustomHeader from "@/components/ui/CustomHeader";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { bookingApi } from "../../api/bookingApi";
import { BookingListResponse } from "../../types/booking";

const PRIMARY = "#00A36C";

export default function OwnerBookingsScreen() {
  const [bookings, setBookings] = useState<BookingListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'REFUND_PENDING' | 'AWAITING_CONFIRM' | 'CONFIRMED'>('REFUND_PENDING');

  const fetchBookings = async () => {
    try {
      const data = await bookingApi.getOwnerBookings();
      // Sort: REFUND_PENDING, AWAITING_CONFIRM first, then others by startTime DESC
      const sorted = data.sort((a, b) => {
          const priorityStatus = ["REFUND_PENDING", "AWAITING_CONFIRM", "PENDING_PAYMENT"];
          const aPriority = priorityStatus.includes(a.status) ? priorityStatus.indexOf(a.status) : 99;
          const bPriority = priorityStatus.includes(b.status) ? priorityStatus.indexOf(b.status) : 99;
          
          if (aPriority !== bPriority) return aPriority - bPriority;
          
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      });
      setBookings(sorted);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách đặt sân.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBookings();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleConfirmBooking = (bookingId: string) => {
    Alert.alert(
      "Xác nhận thanh toán",
      "Bạn có chắc chắn muốn xác nhận đơn đặt này đã thanh toán?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xác nhận",
          onPress: async () => {
            setLoadingId(bookingId);
            try {
              await bookingApi.confirmBooking(bookingId);
              
              // Update local state to reflect change immediately
              setBookings((prev) =>
                prev.map((booking) =>
                  booking.id === bookingId
                    ? { ...booking, status: "CONFIRMED" }
                    : booking
                )
              );
              Alert.alert("Thành công", "Đã xác nhận thanh toán.");

            } catch (error: any) {
              console.error("Confirmation failed", error);
              Alert.alert("Lỗi", error.message || "Không thể xác nhận đơn hàng.");
            } finally {
                setLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleConfirmRefund = (bookingId: string) => {
      Alert.alert(
        "Xác nhận hoàn tiền",
        "Bạn có chắc chắn đã chuyển khoản hoàn tiền cho khách?",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Xác nhận",
            onPress: async () => {
              setLoadingId(bookingId);
              try {
                await bookingApi.confirmRefund(bookingId);
                setBookings((prev) =>
                  prev.map((booking) =>
                    booking.id === bookingId
                      ? { ...booking, status: "CANCELED" }
                      : booking
                  )
                );
                Alert.alert("Thành công", "Đã xác nhận hoàn tiền.");
              } catch (error: any) {
                Alert.alert("Lỗi", error.message || "Không thể xác nhận hoàn tiền.");
              } finally {
                setLoadingId(null);
              }
            }
          }
        ]
      );
  };

  const handleDeclineBooking = (bookingId: string) => {
    Alert.alert(
      "Từ chối đơn",
      "Bạn có chắc chắn muốn từ chối/hủy đơn này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Từ chối",
          style: 'destructive',
          onPress: async () => {
            setLoadingId(bookingId);
            try {
              await bookingApi.declineBooking(bookingId);
              setBookings((prev) =>
                prev.map((booking) =>
                  booking.id === bookingId
                    ? { ...booking, status: "CANCELED" }
                    : booking
                )
              );
              Alert.alert("Thành công", "Đã hủy đơn.");
            } catch (error: any) {
              Alert.alert("Lỗi", error.message || "Không thể hủy đơn.");
            } finally {
                setLoadingId(null);
            }
          }
        }
      ]
    );
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString("vi-VN"),
      time: date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const renderItem = ({ item }: { item: BookingListResponse }) => {
    const start = formatDateTime(item.startTime);
    const end = formatDateTime(item.endTime);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.userName}>{item.userName || "Khách vãng lai"}</Text>
          <StatusBadge status={item.status} />
        </View>
        
        <View style={styles.cardBody}>
          <Text style={styles.infoText}>🏟 {item.court} ({item.venue})</Text>
          <Text style={styles.infoText}>📅 {start.date}</Text>
          <Text style={styles.infoText}>⏰ {start.time} - {end.time}</Text>
          <Text style={styles.priceText}>
             {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.totalPrice)}
          </Text>
        </View>

        {/* Show Confirm button if status is AWAITING_CONFIRM */}
        {(item.status === "AWAITING_CONFIRM" || item.status === "PENDING_PAYMENT") && (
          <View style={styles.cardFooter}>
             <Text style={styles.noteText}>Khách đã chuyển khoản?</Text>
            <View style={{flexDirection: 'row', gap: 10}}>
                <TouchableOpacity 
                   style={[styles.declineButton, loadingId === item.id && styles.disabledButton]}
                   onPress={() => handleDeclineBooking(item.id)}
                   disabled={loadingId === item.id}
                >
                   <Text style={styles.declineButtonText}>Từ chối</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmButton, loadingId === item.id && styles.disabledButton, { flex: 1 }]}
                  onPress={() => handleConfirmBooking(item.id)}
                  disabled={loadingId === item.id}
                >
                  {loadingId === item.id ? (
                      <ActivityIndicator color="#fff" size="small" />
                  ) : (
                      <Text style={styles.confirmButtonText}>Xác nhận thanh toán</Text>
                  )}
                </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Refund Pending Section */}
        {item.status === "REFUND_PENDING" && (
            <View style={[styles.cardFooter, { backgroundColor: '#FFF0F0', padding: 12, borderRadius: 8 }]}>
                <Text style={[styles.noteText, { color: '#D32F2F', fontWeight: 'bold' }]}>Yêu cầu hoàn tiền:</Text>
                <Text style={styles.refundInfo}>Số tiền: {item.refundAmount?.toLocaleString('vi-VN')} VND</Text>
                <Text style={styles.refundInfo}>Ngân hàng: {item.refundBankName}</Text>
                <Text style={styles.refundInfo} selectable={true}>STK: {item.refundAccountNumber}</Text>
                <Text style={styles.refundInfo}>Chủ TK: {item.refundAccountName}</Text>

                <TouchableOpacity
                    style={[styles.confirmButton, { backgroundColor: '#D32F2F', marginTop: 10 }, loadingId === item.id && styles.disabledButton]}
                    onPress={() => handleConfirmRefund(item.id)}
                    disabled={loadingId === item.id}
                >
                     {loadingId === item.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.confirmButtonText}>Xác nhận đã hoàn tiền</Text>
                    )}
                </TouchableOpacity>
            </View>
        )}
      </View>
    );
  };

  const counts = {
      REFUND_PENDING: bookings.filter(b => b.status === 'REFUND_PENDING').length,
      AWAITING_CONFIRM: bookings.filter(b => b.status === 'AWAITING_CONFIRM' || b.status === 'PENDING_PAYMENT').length,
      CONFIRMED: bookings.filter(b => b.status === 'CONFIRMED').length
  };
  
  // Map PENDING_PAYMENT to AWAITING_CONFIRM category for display if needed, or handle separately.
  // User asked for 'AWAITING_CONFIRM', but we have 'PENDING_PAYMENT' too.
  // I will group PENDING_PAYMENT into AWAITING_CONFIRM for simplicity as they are both "Actionable" or "Pending".
  
  const filteredData = bookings.filter(b => {
      if (selectedCategory === 'AWAITING_CONFIRM') {
          return b.status === 'AWAITING_CONFIRM' || b.status === 'PENDING_PAYMENT';
      }
      return b.status === selectedCategory;
  });

  if (loading && !refreshing && bookings.length === 0) {
      return (
          <View style={[styles.container, styles.center]}>
              <ActivityIndicator size="large" color={PRIMARY} />
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Quản lý đặt sân" showBackButton={true} />

      <View style={styles.categoryContainer}>
        <TouchableOpacity 
            style={[
                styles.categoryBtn, 
                { borderColor: '#D32F2F', backgroundColor: selectedCategory === 'REFUND_PENDING' ? '#D32F2F' : '#fff' }
            ]}
            onPress={() => setSelectedCategory('REFUND_PENDING')}
        >
            <Text style={[styles.categoryText, { color: selectedCategory === 'REFUND_PENDING' ? '#fff' : '#D32F2F' }]}>
                Hoàn tiền ({counts.REFUND_PENDING})
            </Text>
        </TouchableOpacity>

        <TouchableOpacity 
            style={[
                styles.categoryBtn, 
                { borderColor: '#007AFF', backgroundColor: selectedCategory === 'AWAITING_CONFIRM' ? '#007AFF' : '#fff' }
            ]}
            onPress={() => setSelectedCategory('AWAITING_CONFIRM')}
        >
            <Text style={[styles.categoryText, { color: selectedCategory === 'AWAITING_CONFIRM' ? '#fff' : '#007AFF' }]}>
                Chờ duyệt ({counts.AWAITING_CONFIRM})
            </Text>
        </TouchableOpacity>

        <TouchableOpacity 
            style={[
                styles.categoryBtn, 
                { borderColor: PRIMARY, backgroundColor: selectedCategory === 'CONFIRMED' ? PRIMARY : '#fff' }
            ]}
            onPress={() => setSelectedCategory('CONFIRMED')}
        >
            <Text style={[styles.categoryText, { color: selectedCategory === 'CONFIRMED' ? '#fff' : PRIMARY }]}>
                Đã duyệt ({counts.CONFIRMED})
            </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>Không có đơn đặt sân nào trong mục này</Text>}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  let color = "#999";
  let label = status;
  let bg = "#f0f0f0";

  switch (status) {
      case "CONFIRMED":
          color = "#00A36C";
          label = "Đã xác nhận";
          bg = "#E6F6EC";
          break;
      case "CANCELED":
      case "CANCELLED":
          color = "#FF3B30";
          label = "Đã hủy";
          bg = "#FFF0F0";
          break;
      case "PENDING_PAYMENT":
          color = "#F5A623";
          label = "Chờ thanh toán";
          bg = "#FFF8E6";
          break;
      case "AWAITING_CONFIRM":
          color = "#007AFF";
          label = "Chờ xác nhận";
          bg = "#E6F2FF";
          break;
      case "REFUND_PENDING":
          color = "#D32F2F";
          label = "Chờ hoàn tiền";
          bg = "#FFEBEE";
          break;
      default:
          label = status;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  center: {
      justifyContent: 'center',
      alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
      padding: 8,
  },
  backButtonText: {
      fontSize: 24,
      color: '#333',
  },
  headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  cardBody: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: PRIMARY,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: "column",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  noteText: {
      fontSize: 12,
      color: "#888",
      fontStyle: 'italic',
  },
  confirmButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  declineButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  declineButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  refundInfo: {
      fontSize: 14,
      color: '#333',
      marginBottom: 2,
  },
  disabledButton: {
      backgroundColor: '#ccc',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
      textAlign: 'center',
      color: '#999',
      marginTop: 40,
  },
  categoryContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
      gap: 10,
  },
  categoryBtn: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 20,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
  },
  categoryBtnActive: {
      // Background color is handled inline for dynamic colors or I can set a default here
      // But I used inline styles for active background color based on logic? 
      // Actually I used inline logic for text color but not background color in the previous step?
      // Let's check previous step.
      // style={[..., selectedCategory === ... && styles.categoryBtnActive, { borderColor: ... }]}
      // I need to define categoryBtnActive background color dynamically or set it in inline style.
      // Since I used inline logic for color, I should probably use inline logic for background color too.
      // But I can't easily edit the previous step now.
      // I'll make categoryBtnActive generic or override it in inline style.
      // Wait, I see I didn't set backgroundColor in inline style for Active. 
      // I used `styles.categoryBtnActive`.
      // I should update the JSX to include inline background color or define it here.
      // Since I can't update JSX easily without re-doing it, I'll rely on generic active style or...
      // Actually, I can use a default active color or just rely on the border.
      // Let's look at the JSX again:
      // style={[styles.categoryBtn, selectedCategory === 'REFUND_PENDING' && styles.categoryBtnActive, { borderColor: '#D32F2F' }]}
      // If I define categoryBtnActive here:
  },
  categoryText: {
      fontSize: 12,
      fontWeight: '600',
  },
  categoryTextActive: {
      color: '#fff',
  },
});
