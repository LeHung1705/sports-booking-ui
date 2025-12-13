// app/(tabs)/profile.tsx
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
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../api/authApi';
import { userApi } from '../../api/userApi';
import { bookingApi } from '../../api/bookingApi';
import { User } from '../../types/User';
import { BookingListResponse } from "../../types/booking";
import { Colors } from '../../constants/Colors';

import ProfileHeader from '../../components/profile/ProfileHeader';
import StatsCard from '../../components/profile/StatsCard';
import MenuOption from '../../components/profile/MenuOption';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Owner specific state
  const [pendingBookings, setPendingBookings] = useState<BookingListResponse[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

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
    if (user?.role && user.role.toUpperCase().includes('OWNER')) {
      fetchPendingBookings();
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
    Alert.alert('Confirm Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
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
              <Text style={styles.sectionTitle}>ACCOUNT</Text>
              <View style={styles.menuCard}>
                <MenuOption
                  icon="person-outline"
                  title="Edit Profile"
                  onPress={() => router.push('/profile/edit')}
                />
                <MenuOption
                  icon="card-outline"
                  title="Payment Methods"
                  onPress={() => Alert.alert('Coming Soon', 'Payment methods feature will be available soon')}
                />
                <MenuOption
                  icon="lock-closed-outline"
                  title="Change Password"
                  onPress={() => router.push('/profile/change-password')}
                  showBorder={false}
                />
              </View>
            </View>

            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>ACTIVITY</Text>
              <View style={styles.menuCard}>
                <MenuOption
                  icon="time-outline"
                  title="Booking History"
                  onPress={() => Alert.alert('Coming Soon', 'Booking history feature will be available soon')}
                />
                <MenuOption
                  icon="heart-outline"
                  title="My Favorites"
                  onPress={() => Alert.alert('Coming Soon', 'Favorites feature will be available soon')}
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
          {/* Section Booking Chờ Duyệt của Owner */}
          {pendingBookings.length > 0 && (
             <View style={styles.menuSection}>
                 <Text style={styles.sectionTitle}>CẦN XÁC NHẬN ({pendingBookings.length})</Text>
                 <View style={styles.pendingContainer}>
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
             </View>
          )}

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>VENUE MANAGEMENT</Text>
            <View style={styles.menuCard}>
              <MenuOption
                icon="business-outline"
                title="My Venue Details"
                onPress={() => console.log('Navigate to Venue Detail')}
              />
              <MenuOption
                icon="add-circle-outline"
                title="Create New Venue"
                onPress={() => router.push('/owner/CreateVenueScreen')}
              />
              <MenuOption
                icon="create-outline"
                title="Edit Venue Info"
                onPress={() => console.log('Navigate to Edit Venue')}
                showBorder={false}
              />
            </View>
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>COURT SYSTEM</Text>
            <View style={styles.menuCard}>
              <MenuOption
                icon="grid-outline"
                title="Court List"
                onPress={() => console.log('Navigate to Court List')}
              />
              <MenuOption
                icon="add-outline"
                title="Add New Court"
                onPress={() => router.push('/owner/add-court')}
                showBorder={false}
              />
            </View>
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>PROMOTION & VOUCHERS</Text>
            <View style={styles.menuCard}>
              <MenuOption
                icon="ticket-outline"
                title="My Vouchers"
                onPress={() => router.push('/owner/listvoucher')}
              />
              <MenuOption
                icon="pricetag-outline"
                title="Create/Edit Voucher"
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
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>SYSTEM MANAGEMENT</Text>
          <View style={styles.menuCard}>
            <MenuOption
              icon="business"
              title="All Venues"
              onPress={() => Alert.alert('Coming Soon', 'Navigate to All Venues Screen')}
            />
            <MenuOption
              icon="people"
              title="User Manager"
              onPress={() => console.log('Navigate to User Manager')}
            />
            <MenuOption
              icon="bar-chart-outline"
              title="Revenue Overview"
              onPress={() => console.log('Navigate to Revenue Overview')}
              showBorder={false}
            />
          </View>
        </View>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
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
        <View style={styles.statusCard}>
          <View style={styles.statusIconRow}>
            <Ionicons name="server-outline" size={22} color={Colors.primary} />
            <View style={styles.statusDot} />
          </View>
          <Text style={styles.statusTitle}>System Operational</Text>
          <Text style={styles.statusSubtitle}>All services are running normally</Text>
        </View>
      ) : (user.role || 'USER').toUpperCase().includes('OWNER') ? (
        <StatsCard
          items={[
            { label: 'Total Revenue', value: stats.owner.formatCompact(stats.owner.revenue), bold: true },
            { label: 'Total Bookings', value: stats.owner.bookings },
            { label: 'Active Courts', value: stats.owner.activeCourts },
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
        <Text style={styles.sectionTitle}>GENERAL</Text>
        <View style={styles.menuCard}>
          <MenuOption
            icon="settings-outline"
            title="Settings"
            onPress={() => Alert.alert('Coming Soon', 'Settings feature will be available soon')}
          />
          <MenuOption
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => Alert.alert('Coming Soon', 'Help & Support feature will be available soon')}
          />
          <MenuOption
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            onPress={() => Alert.alert('Coming Soon')}
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
            <Text style={styles.logoutText}>Log Out</Text>
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