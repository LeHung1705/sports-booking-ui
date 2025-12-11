import CustomHeader from "@/components/ui/CustomHeader";
import { useFocusEffect, useRouter } from "expo-router";
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
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      const data = await bookingApi.getOwnerBookings();
      setBookings(data);
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
            <TouchableOpacity
              style={[styles.confirmButton, loadingId === item.id && styles.disabledButton]}
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
        )}
      </View>
    );
  };

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

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>Không có đơn đặt sân nào</Text>}
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
  }
});
