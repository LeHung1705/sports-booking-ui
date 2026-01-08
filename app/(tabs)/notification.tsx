import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator, Pressable, TouchableOpacity
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import CustomHeader from '@/components/ui/CustomHeader';

// 👇 1. IMPORT INTERFACE TỪ CONTEXT (Xóa interface khai báo lại ở đây)
import { useNotification, NotificationItem } from '@/context/NotificationContext';

// 👇 2. ĐƯA CÁC HÀM HELPER RA NGOÀI COMPONENT (Để tránh lỗi dependency useEffect)
const getNotificationTime = (item: NotificationItem): string | undefined => {
  return item.created_at || item.createdAt;
};

const isRead = (item: NotificationItem) => {
  return item.read || item.is_read || false;
};

const formatTimeExact = (item: NotificationItem) => {
  const isoString = getNotificationTime(item);
  if (!isoString) return '--:-- --/--/----';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'Lỗi ngày';

  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${timeStr} ${dateStr}`;
};

const getIcon = (type: string | undefined) => {
  switch (type) {
    case 'BOOKING_CREATED': return { name: 'calendar', color: '#2196F3' };
    case 'BOOKING_CONFIRMED': return { name: 'checkmark-circle', color: '#4CAF50' };
    case 'REMINDER': return { name: 'alarm', color: '#FF9800' };
    case 'BOOKING_CANCELLED': return { name: 'close-circle', color: '#EF4444' };
    case 'VENUE_CREATED': return { name: 'business', color: '#9C27B0' };
    case 'VENUE_APPROVED': return { name: 'shield-checkmark', color: '#4CAF50' };
    case 'VENUE_REJECTED': return { name: 'alert-circle', color: '#EF4444' };
    default: return { name: 'notifications', color: '#757575' };
  }
};

export default function NotificationsScreen() {
  // Lấy data và hàm từ Context
  const { notifications, fetchNotifications, markAsRead } = useNotification();
  
  const [displayList, setDisplayList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true); // Loading lần đầu
  const [refreshing, setRefreshing] = useState(false); // Loading khi kéo xuống
  const [filterType, setFilterType] = useState<'UNREAD' | 'ALL'>('UNREAD');

  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // 🆕 Thêm biến check Admin
  const [roleStr, setRoleStr] = useState<string | null>(null);
  const router = useRouter();

  // Tính số lượng chưa đọc để hiển thị badge trong màn hình (nếu cần)
  const unreadCount = notifications.filter(item => !isRead(item)).length;

  // 👇 3. LOGIC LỌC (Đã fix lỗi dependency)
  useEffect(() => {
    if (filterType === 'UNREAD') {
      // Vì hàm isRead đã đưa ra ngoài component nên dùng ở đây thoải mái
      setDisplayList(notifications.filter(item => !isRead(item)));
    } else {
      setDisplayList(notifications);
    }
  }, [notifications, filterType]); 

  // Load data khi vào màn hình
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        // Chỉ hiện loading xoay xoay nếu danh sách đang rỗng
        if (notifications.length === 0) setLoading(true);
        try {
          await fetchNotifications();
        } finally {
          if (isActive) setLoading(false);
        }
      };
      load();
      return () => { isActive = false; };
    }, [fetchNotifications, notifications.length])
  );

  // Hàm Refresh khi kéo xuống
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchNotifications();
    } finally {
      setRefreshing(false);
    }
  }, [fetchNotifications]);

  // Load Role (Giữ nguyên logic của bạn)
  useEffect(() => {
    const loadRole = async () => {
      const directRole = (await AsyncStorage.getItem('userRole')) || (await AsyncStorage.getItem('role'));
      let parsedRole: string | null = directRole;
      if (!parsedRole) {
        const rawUser = await AsyncStorage.getItem('user');
        if (rawUser) {
          try {
            const obj = JSON.parse(rawUser);
            parsedRole = obj?.role || obj?.userRole || null;
          } catch (_) { parsedRole = null; }
        }
      }
      setRoleStr(parsedRole);
      setIsOwner(!!parsedRole && /owner/i.test(parsedRole));
      setIsAdmin(!!parsedRole && /admin/i.test(parsedRole)); // 🆕 Check Admin
    };
    loadRole();
  }, []);

  const handlePressNotification = async (item: NotificationItem) => {
    if (!isRead(item)) {
       await markAsRead(item.id);
    }

    // Lấy ID cần highlight (Backend trả về snake_case hoặc camelCase tùy cấu hình, check interface)
    // Theo entity Notification.java, backend trả về JSON field: bookingId, venueId (do Jackson default)
    // Nhưng nếu dùng native query mà ko qua DTO thì có thể là snake_case.
    // Kiểm tra lại api/notificationApi.ts: interface NotificationItem có id, ...
    // Để an toàn, check cả 2 case
    // NOTE: item từ API trả về đã được map.
    // Tạm thời assume API trả về đúng như interface (camelCase nếu dùng JPA/Jackson chuẩn)

    // @ts-ignore
    const targetBookingId = item.bookingId || item.booking_id;
    // @ts-ignore
    const targetVenueId = item.venueId || item.venue_id;

    // Logic điều hướng
    if (item.type === 'VENUE_CREATED' && isAdmin) {
        router.push({ pathname: '/admin/approve-venues', params: { highlightId: targetVenueId } });
    } else if ((item.type === 'VENUE_APPROVED' || item.type === 'VENUE_REJECTED') && isOwner) {
        // router.push('/owner/my-venues');
        // Hoặc dẫn thẳng vào chi tiết nếu Approved?
        // User yêu cầu: "New venue created -> leads to the approve_venue.tsx" (Done above)
        // User yêu cầu: "Reject... won't appear".
        // Với Approved: dẫn vào list hoặc detail. Dẫn vào list để thấy nó "Active".
        router.push({ pathname: '/owner/my-venues', params: { highlightId: targetVenueId } });
    } else if (isOwner || (roleStr && /owner/i.test(roleStr))) {
        // "New course booking" -> owner/bookings
        if (targetBookingId) {
             router.push({ pathname: '/owner/bookings', params: { highlightId: targetBookingId } });
        } else {
             router.push('/owner/bookings');
        }
    } else {
       // "Booking successful" -> my_booking
       if (targetBookingId) {
            router.push({ pathname: '/booking/my_bookings', params: { highlightId: targetBookingId } });
       } else {
            router.push('/booking/my_bookings');
       }
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const icon = getIcon(item.type);
    const displayTime = formatTimeExact(item);
    const readStatus = isRead(item);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          !readStatus && styles.unread,
          pressed && styles.cardPressed,
        ]}
        onPress={() => handlePressNotification(item)}
      >
        <View style={styles.iconBox}>
          <Ionicons name={icon.name as any} size={24} color={icon.color} />
        </View>
        <View style={styles.content}>
          <View style={styles.rowBetween}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            {!readStatus && <View style={styles.badge}><Text style={styles.badgeText}>Mới</Text></View>}
          </View>
          <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
          <View style={styles.footerRow}>
            <Ionicons name="time-outline" size={14} color="#9CA3AF" />
            <Text style={styles.time}>{displayTime}</Text>
            <View style={styles.dot} />
            <Text style={styles.linkText}>Xem chi tiết</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Thông báo" showBackButton={false} />
      
      {/* --- BỘ LỌC --- */}
      <View style={styles.filterContainer}>
         <TouchableOpacity 
           style={[styles.filterChip, filterType === 'UNREAD' && styles.filterChipActive]}
           onPress={() => setFilterType('UNREAD')}
         >
            <Text style={[styles.filterText, filterType === 'UNREAD' && styles.filterTextActive]}>Chưa đọc</Text>
            {unreadCount > 0 && (
               <View style={styles.countBadge}>
                <Text style={styles.countText}>{unreadCount}</Text>
               </View>
            )}
         </TouchableOpacity>

         <TouchableOpacity 
           style={[styles.filterChip, filterType === 'ALL' && styles.filterChipActive]}
           onPress={() => setFilterType('ALL')}
         >
            <Text style={[styles.filterText, filterType === 'ALL' && styles.filterTextActive]}>Tất cả</Text>
         </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={displayList}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={{alignItems:'center', marginTop: 50}}>
              <Ionicons name={filterType === 'UNREAD' ? "checkmark-done-circle-outline" : "file-tray-outline"} size={50} color="#ccc"/>
              <Text style={{color:'#999', marginTop:10}}>
                 {filterType === 'UNREAD' ? 'Bạn đã đọc hết thông báo!' : 'Chưa có thông báo nào'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FB' },
  card: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eef1f5',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardPressed: { opacity: 0.9 },
  unread: { backgroundColor: '#F2FBF7', borderColor: Colors.primary },
  iconBox: {
    marginRight: 14,
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
  },
  content: { flex: 1, gap: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontWeight: '700', fontSize: 16, color: '#111827', flex: 1, marginRight: 8 },
  body: { fontSize: 14, color: '#4B5563', marginBottom: 2 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time: { fontSize: 12, color: '#9CA3AF' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },
  linkText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // STYLE FILTER
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
    gap: 12
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563'
  },
  filterTextActive: {
    color: '#FFF'
  },
  countBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4
  },
  countText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold'
  }
});