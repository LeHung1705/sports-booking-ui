// app/(tabs)/profile.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { adminApi } from '../../api/adminApi';
import { authApi } from '../../api/authApi';
import { bookingApi } from '../../api/bookingApi';
import { userApi } from '../../api/userApi';
import { Colors } from '../../constants/Colors';
import { User } from '../../types/User';
import { BookingListResponse } from "../../types/booking";

import MenuOption from '../../components/profile/MenuOption';
import ProfileHeader from '../../components/profile/ProfileHeader';
import RevenueChart from '../../components/profile/RevenueChart';
import StatsCard from '../../components/profile/StatsCard';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Owner specific state
  const [pendingBookings, setPendingBookings] = useState<BookingListResponse[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [chartStats, setChartStats] = useState<{ revenue: number; bookings: number; label: string } | null>(null);

  // Admin specific state
  const [adminStats, setAdminStats] = useState<{ users: number; venues: number; pendingVenues: number } | null>(null);

  // 1. Fetch User Data (Logic từ feature/user-history: Tối ưu UX)
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchUserData = async () => {
        try {
          // Chỉ set loading lần đầu
          const userData = await userApi.getMyInfo();
          
          if (isActive) {
            setUser(userData);
            setLoading(false);
          }
        } catch (error) {
          console.error('❌ Failed to load user info:', error);
          if (isActive) {
            setLoading(false);
          }
        }
      };

      fetchUserData();

      return () => {
        isActive = false;
      };
    }, [])
  );

  // 2. Fetch Owner Pending Bookings (Logic từ feature/booking: Tính năng Owner)
  useEffect(() => {
    const role = (user?.role || '').toUpperCase();
    if (role.includes('OWNER')) {
      fetchPendingBookings();
    }
    if (role.includes('ADMIN')) {
      fetchAdminStats();
    }
  }, [user]);

  const fetchPendingBookings = async () => {
    try {
      const bookings = await bookingApi.getOwnerPendingBookings();
      setPendingBookings(bookings);
    } catch (error) {
      console.error("Failed to fetch pending bookings", error);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const stats = await adminApi.getStats();
      setAdminStats({
        users: stats.totalUsers,
        venues: stats.totalVenues,
        pendingVenues: stats.pendingVenues ?? 0
      });
    } catch (error) {
      console.error("Failed to fetch admin stats", error);
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    setProcessingId(bookingId);
    try {
      await bookingApi.confirmBooking(bookingId);
      Alert.alert("Thành công", "Đã xác nhận thanh toán");
      fetchPendingBookings(); // Refresh list
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể xác nhận");
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = () => {
    Alert.alert('Xác nhận đăng xuất', 'Bạn có chắc chắn muốn đăng xuất không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          setLogoutLoading(true);
          try {
            await authApi.logout(); 
            // Xóa sạch các key có thể tồn tại
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('user');
            router.replace('/(auth)/login');
          } catch (error) {
            console.error('❌ Logout failed:', error);
            // Force logout nếu API lỗi
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            router.replace('/(auth)/login');
          } finally {
            setLogoutLoading(false);
          }
        },
      },
    ]);
  };

  // 3. Stats Logic (Logic từ feature/user-history: Tính toán thống kê)
  const stats = useMemo(() => {
    const meta: any = user || {};
    const nestedStats = meta.stats || meta.statistics || {};

    const parseNumber = (value: any) => {
      if (value === undefined || value === null) return undefined;
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Number(value))) {
        return Number(value);
      }
      return undefined;
    };

    const formatCompact = (value?: number) => {
      if (value === undefined) return undefined;
      const abs = Math.abs(value);
      if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
      if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
      if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
      return `${value}`;
    };

    return {
      bookings: parseNumber(nestedStats.bookings ?? nestedStats.totalBookings ?? meta.totalBookings ?? meta.bookingCount ?? meta.bookingsCount ?? meta.bookings),
      hoursPlayed: parseNumber(nestedStats.hoursPlayed ?? nestedStats.totalHours ?? nestedStats.playTime ?? meta.totalHours ?? meta.hoursPlayed),
      favoriteSport: nestedStats.favoriteSport ?? nestedStats.favouriteSport ?? nestedStats.favorite ?? meta.favoriteSport ?? meta.favouriteSport,
      owner: {
        revenue: parseNumber(nestedStats.revenue ?? nestedStats.totalRevenue ?? nestedStats.income ?? meta.totalRevenue ?? meta.revenue),
        bookings: parseNumber(nestedStats.totalBookings ?? nestedStats.bookings ?? meta.totalBookings ?? meta.bookingCount ?? meta.bookings),
        activeCourts: parseNumber(nestedStats.activeCourts ?? nestedStats.courts ?? nestedStats.courtsActive ?? meta.activeCourts ?? meta.courtsCount),
        formatCompact,
      },
    };
  }, [user]);

  const renderMenuByRole = () => {
    if (!user) return null;
    const role = (user.role || 'USER').toUpperCase();
    
    if (role.includes('USER')) {
        return (
          <>
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>TÀI KHOẢN</Text>
              <View style={styles.menuCard}>
                <MenuOption
                  icon="person-outline"
                  title="Chỉnh sửa hồ sơ"
                  onPress={() => router.push('/profile/edit')}
                />
                <MenuOption
                  icon="card-outline"
                  title="Phương thức thanh toán"
                  onPress={() => Alert.alert('Sắp ra mắt', 'Tính năng phương thức thanh toán sẽ sớm ra mắt')}
                />
                <MenuOption
                  icon="lock-closed-outline"
                  title="Đổi mật khẩu"
                  onPress={() => router.push('/profile/change-password')}
                  showBorder={false}
                />
              </View>
            </View>

            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>HOẠT ĐỘNG</Text>
              <View style={styles.menuCard}>
                <MenuOption
                  icon="time-outline"
                  title="Lịch sử đặt sân"
                  onPress={() => router.push('/booking/my_bookings')}
                />
                <MenuOption
                  icon="heart-outline"
                  title="Yêu thích"
                  onPress={() => Alert.alert('Sắp ra mắt', 'Tính năng yêu thích sẽ sớm ra mắt')}
                  showBorder={false}
                />
              </View>
            </View>
          </>
        );
    } 
    
    if (role.includes('OWNER')) {
      return (
        <>
          <RevenueChart onStatsChange={(rev, bks, lbl) => setChartStats({ revenue: rev, bookings: bks, label: lbl })} />
          
          <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>TÀI KHOẢN</Text>
              <View style={styles.menuCard}>
                <MenuOption
                  icon="person-outline"
                  title="Chỉnh sửa hồ sơ"
                  onPress={() => router.push('/profile/edit')}
                />
                <MenuOption
                  icon="lock-closed-outline"
                  title="Đổi mật khẩu"
                  onPress={() => router.push('/profile/change-password')}
                  showBorder={false}
                />
              </View>
            </View>

          {/* Section Booking Chờ Duyệt của Owner */}
          {pendingBookings.length > 0 && (
             <View style={styles.menuSection}>
                 <Text style={styles.sectionTitle}>CẦN XÁC NHẬN ({pendingBookings.length})</Text>
                 <View style={styles.pendingContainer}>
                    {pendingBookings.map(item => (
                        <View key={item.id} style={styles.pendingItem}>
                            <View style={{flex: 1}}>
                                <Text style={styles.pendingCourt}>{item.court} - {item.venue}</Text>
                                <Text style={styles.pendingUser}>
                                  {item.userName || "Khách"} {item.userId ? `(#${item.userId.substring(0, 8)})` : ''}
                                </Text>
                                <Text style={styles.pendingId}>ID: {item.id}</Text>
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
             </View>
          )}

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>HOẠT ĐỘNG CỦA TÔI</Text>
            <View style={styles.menuCard}>
              <MenuOption
                icon="time-outline"
                title="Lịch sử đặt sân của tôi"
                onPress={() => router.push('/booking/my_bookings')}
              />
            </View>
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>QUẢN LÝ SÂN BÃI</Text>
            <View style={styles.menuCard}>
              <MenuOption
                icon="calendar-outline"
                title="Quản lý đặt sân"
                onPress={() => router.push('/owner/bookings')}
              />
              <MenuOption
                icon="stats-chart-outline"
                title="Lịch sử & Doanh thu"
                onPress={() => router.push('/owner/history')}
              />
              <MenuOption
                icon="business-outline"
                title="Chi tiết địa điểm"
                onPress={() => console.log('Navigate to Venue Detail')}
              />
              <MenuOption
                icon="add-circle-outline"
                title="Tạo địa điểm mới"
                onPress={() => router.push('/owner/CreateVenueScreen')}
              />
              <MenuOption
                icon="create-outline"
                title="Sửa thông tin địa điểm"
                onPress={() => router.push('/owner/my-venues')}
                showBorder={false}
              />
            </View>
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>HỆ THỐNG SÂN</Text>
            <View style={styles.menuCard}>
              <MenuOption
                icon="grid-outline"
                title="Danh sách sân"
                onPress={() => console.log('Navigate to Court List')}
              />
              <MenuOption
                icon="add-outline"
                title="Thêm sân mới"
                onPress={() => router.push('/owner/add-court')}
                showBorder={false}
              />
            </View>
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>KHUYẾN MÃI & VOUCHER</Text>
            <View style={styles.menuCard}>
              <MenuOption
                icon="ticket-outline"
                title="Voucher của tôi"
                onPress={() => router.push('/owner/listvoucher')}
              />
              <MenuOption
                icon="pricetag-outline"
                title="Tạo/Sửa Voucher"
                onPress={() => router.push('/owner/create')}
                showBorder={false}
              />
            </View>
          </View>
        </>
      );
    }

    if (role.includes('ADMIN')) {
      return (
        <>
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>HOẠT ĐỘNG CỦA TÔI</Text>
            <View style={styles.menuCard}>
              <MenuOption
                icon="time-outline"
                title="Lịch sử đặt sân của tôi"
                onPress={() => router.push('/booking/my_bookings')}
              />
            </View>
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>QUẢN TRỊ HỆ THỐNG</Text>
            <View style={styles.menuCard}>
              <MenuOption
                icon="checkmark-circle-outline"
                title="Phê duyệt Venue mới"
                onPress={() => router.push('/admin/approve-venues')}
              />
              <MenuOption
                icon="people-outline"
                title="Quản lý users"
                onPress={() => router.push('/admin/manage-users')}
              />
              <MenuOption
                icon="bar-chart-outline"
                title="Tổng quan doanh thu"
                onPress={() => console.log('Navigate to Revenue Overview')}
                showBorder={false}
              />
            </View>
          </View>
        </>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không thể tải hồ sơ</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ProfileHeader
        fullName={user.fullName}
        email={user.email}
        avatar={user.avatar}
        role={user.role}
      />

      {/* User stats or Admin system status */}
      {(user.role || 'USER').toUpperCase().includes('ADMIN') ? (
        <StatsCard
          items={[
            { label: 'Tổng người dùng', value: adminStats?.users },
            { label: 'Tổng địa điểm', value: adminStats?.venues },
            { label: 'Địa điểm chờ duyệt', value: adminStats?.pendingVenues, bold: true },
          ]}
        />
      ) : (user.role || 'USER').toUpperCase().includes('OWNER') ? (
        <StatsCard
          items={[
            { label: chartStats ? `Doanh thu (${chartStats.label})` : 'Tổng doanh thu', value: chartStats ? stats.owner.formatCompact(chartStats.revenue) : stats.owner.formatCompact(stats.owner.revenue), bold: true },
            { label: chartStats ? `Lượt đặt (${chartStats.label})` : 'Tổng lượt đặt', value: chartStats ? chartStats.bookings : stats.owner.bookings },
            { label: 'Sân hoạt động', value: stats.owner.activeCourts },
          ]}
        />
      ) : (
        <StatsCard
          bookings={stats.bookings}
          hoursPlayed={stats.hoursPlayed}
          favoriteSport={typeof stats.favoriteSport === 'string' ? stats.favoriteSport : undefined}
        />
      )}

      {renderMenuByRole()}

      {/* GENERAL Section - Chung cho tất cả */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>CHUNG</Text>
        <View style={styles.menuCard}>
          <MenuOption
            icon="settings-outline"
            title="Cài đặt"
            onPress={() => Alert.alert('Sắp ra mắt', 'Tính năng cài đặt sẽ sớm ra mắt')}
          />
          <MenuOption
            icon="help-circle-outline"
            title="Trợ giúp & Hỗ trợ"
            onPress={() => Alert.alert('Sắp ra mắt', 'Tính năng trợ giúp & hỗ trợ sẽ sớm ra mắt')}
          />
          <MenuOption
            icon="shield-checkmark-outline"
            title="Chính sách bảo mật"
            onPress={() => Alert.alert('Sắp ra mắt')}
            showBorder={false}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.logoutButton, logoutLoading && styles.logoutButtonDisabled]}
        onPress={handleLogout}
        disabled={logoutLoading}
        activeOpacity={0.8}
      >
        {logoutLoading ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={22} color={Colors.white} style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    paddingBottom: 42,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#888',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    marginBottom: 10,
    paddingHorizontal: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  menuCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 28,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoutButtonDisabled: {
    backgroundColor: '#ccc',
    elevation: 1,
    shadowOpacity: 0.1,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#aaa',
    marginTop: 24,
    marginBottom: 40,
    opacity: 0.6,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statusIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 10,
    backgroundColor: '#34C759', // Colors.success
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#888',
  },
  // Pending Booking List Styles (Merged from feature/booking)
  pendingContainer: {
    backgroundColor: 'white',
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 8, // Added padding inside card
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pendingCourt: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  pendingUser: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  pendingId: {
    fontSize: 10,
    color: '#999',
    marginTop: 1,
    fontFamily: 'monospace',
  },
  pendingPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});