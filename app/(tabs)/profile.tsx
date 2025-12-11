  // app/(tabs)/profile.tsx
  import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { authApi } from "../../api/authApi";
import { bookingApi } from "../../api/bookingApi";
import { BookingListResponse } from "../../types/booking";

  const PRIMARY = "#00A36C";

  interface UserProfile {
      email: string;
      full_name: string;
      phone?: string;
      role?: string;
  }

  export default function ProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false); // Loading state for logout action
    const [isLoadingProfile, setIsLoadingProfile] = useState(true); // Loading state for initial profile fetch
    const [user, setUser] = useState<UserProfile | null>(null);
    const [pendingBookings, setPendingBookings] = useState<BookingListResponse[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useFocusEffect(
      useCallback(() => {
        loadUser();
      }, [])
    );

    useEffect(() => {
        if (user?.role === 'OWNER') {
            fetchPendingBookings();
        }
    }, [user]);

    const loadUser = async () => {
        try {
            setIsLoadingProfile(true);
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const userData = JSON.parse(userStr);
                setUser(userData);
            } else {
                setUser(null);
            }
        } catch (e) {
            console.error("Failed to load user", e);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const fetchPendingBookings = async () => {
        try {
            const bookings = await bookingApi.getOwnerPendingBookings();
            setPendingBookings(bookings);
        } catch (error) {
            console.error("Failed to fetch pending bookings", error);
        }
    };

    const handleConfirmBooking = async (bookingId: string) => {
        setProcessingId(bookingId);
        try {
            await bookingApi.confirmBooking(bookingId);
            Alert.alert("Thành công", "Đã xác nhận thanh toán");
            // Refresh list
            fetchPendingBookings();
        } catch (error: any) {
            Alert.alert("Lỗi", error.message || "Không thể xác nhận");
        } finally {
            setProcessingId(null);
        }
    };

    const handleLogout = () => {
      Alert.alert("Xác nhận đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await authApi.logout();
              await AsyncStorage.removeItem('accessToken');
              await AsyncStorage.removeItem('user');
              router.replace("/login");
            } catch (error) {
              console.error("❌ Logout failed:", error);
              // Force logout even if API fails
               await AsyncStorage.removeItem('accessToken');
               await AsyncStorage.removeItem('user');
              router.replace("/");
            } finally {
              setLoading(false);
            }
          },
        },
      ]);
    };

    if (isLoadingProfile) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={PRIMARY} />
            </View>
        );
    }

    if (!user) {
        return (
             <View style={[styles.container, styles.center]}>
                <Text style={{ marginBottom: 20, fontSize: 16, color: '#666' }}>Bạn chưa đăng nhập</Text>
                <TouchableOpacity 
                    onPress={() => router.replace('/login')} 
                    style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: PRIMARY, borderRadius: 8 }}
                >
                    <Text style={{color: 'white', fontWeight: 'bold'}}>Đăng nhập ngay</Text>
                </TouchableOpacity>
             </View>
        );
    }

    return (
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.name}>{user.full_name || "User"}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        {/* Thông tin cá nhân */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="📧" label="Email" value={user.email} />
            <InfoRow icon="📱" label="Số điện thoại" value={user.phone || "Chưa cập nhật"} />
          </View>
        </View>

        {/* Owner Management Section */}
        {user.role === 'OWNER' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quản lý sân</Text>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push("/owner/bookings")}
            >
              <Text style={styles.menuIcon}>📅</Text>
              <Text style={styles.menuText}>Xem tất cả đặt sân</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            {/* Pending Bookings List */}
            {pendingBookings.length > 0 && (
                <View style={styles.pendingContainer}>
                    <Text style={styles.pendingTitle}>Đơn chờ xác nhận ({pendingBookings.length})</Text>
                    {pendingBookings.map(item => (
                        <View key={item.id} style={styles.pendingItem}>
                            <View style={{flex: 1}}>
                                <Text style={styles.pendingCourt}>{item.court} - {item.venue}</Text>
                                <Text style={styles.pendingUser}>{item.userName || "Khách"}</Text>
                                <Text style={styles.pendingPrice}>
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.totalPrice)}
                                </Text>
                            </View>
                            <TouchableOpacity 
                                style={[styles.confirmBtn, processingId === item.id && {backgroundColor: '#ccc'}]}
                                onPress={() => handleConfirmBooking(item.id)}
                                disabled={processingId === item.id}
                            >
                                {processingId === item.id ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.confirmBtnText}>Xác nhận</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}
          </View>
        )}

        {/* Cài đặt */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt</Text>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>✏️</Text>
            <Text style={styles.menuText}>Chỉnh sửa thông tin</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={styles.menuText}>Đổi mật khẩu</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📜</Text>
            <Text style={styles.menuText}>Lịch sử đặt sân</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>ℹ️</Text>
            <Text style={styles.menuText}>Về ứng dụng</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutButton, loading && styles.logoutButtonDisabled]}
            onPress={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.logoutIcon}>🚪</Text>
                <Text style={styles.logoutText}>Đăng xuất</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Phiên bản 1.0.0</Text>
      </ScrollView>
    );
  }

  function InfoRow({
    icon,
    label,
    value,
  }: {
    icon: string;
    label: string;
    value: string;
  }) {
    return (
      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>{icon}</Text>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
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
      backgroundColor: PRIMARY,
      padding: 32,
      alignItems: "center",
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    logo: {
      width: 100,
      height: 100,
      marginBottom: 16,
    },
    name: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#fff",
      marginBottom: 4,
    },
    email: {
      fontSize: 14,
      color: "#fff",
      opacity: 0.9,
    },
    section: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#666",
      marginBottom: 12,
      textTransform: "uppercase",
    },
    infoCard: {
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#f0f0f0",
    },
    infoIcon: {
      fontSize: 22,
      marginRight: 12,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      color: "#888",
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 15,
      color: "#1a1a1a",
      fontWeight: "500",
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    menuIcon: {
      fontSize: 20,
      marginRight: 12,
    },
    menuText: {
      flex: 1,
      fontSize: 16,
      color: "#1a1a1a",
    },
    menuArrow: {
      fontSize: 22,
      color: "#ccc",
    },
    logoutButton: {
      flexDirection: "row",
      backgroundColor: "#FF3B30",
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    logoutButtonDisabled: {
      backgroundColor: "#ccc",
    },
    logoutIcon: {
      fontSize: 20,
      marginRight: 8,
    },
    logoutText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    version: {
      textAlign: "center",
      color: "#999",
      fontSize: 12,
      paddingBottom: 20,
    },
    pendingContainer: {
        marginTop: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    pendingTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: PRIMARY,
        marginBottom: 8,
    },
    pendingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    pendingCourt: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    pendingUser: {
        fontSize: 12,
        color: '#666',
    },
    pendingPrice: {
        fontSize: 13,
        fontWeight: 'bold',
        color: PRIMARY,
    },
    confirmBtn: {
        backgroundColor: PRIMARY,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        marginLeft: 10,
    },
    confirmBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
  });
