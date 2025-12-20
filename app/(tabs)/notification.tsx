import React, { useState, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, RefreshControl, 
  ActivityIndicator, TouchableOpacity 
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

// Định nghĩa kiểu dữ liệu khớp với Backend
interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'BOOKING_CREATED' | 'BOOKING_CONFIRMED' | 'REMINDER' | 'SYSTEM';
  createdAt: string;
  read: boolean;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Hàm gọi API
  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      // ⚠️ LƯU Ý: Thay IP 192.168.x.x bằng IP máy tính của bạn
      const res = await axios.get('http://192.168.0.202:8080/api/v1/notifications/my-notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (error) {
      console.log("Lỗi tải thông báo:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 2. Tự động load khi vào màn hình
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  // 3. Hàm chọn icon dựa theo Type (Backend trả về)
  const getIcon = (type: string) => {
    switch (type) {
      case 'BOOKING_CREATED': return { name: 'calendar', color: '#2196F3' }; // Xanh dương
      case 'BOOKING_CONFIRMED': return { name: 'checkmark-circle', color: '#4CAF50' }; // Xanh lá
      case 'REMINDER': return { name: 'alarm', color: '#FF9800' }; // Cam
      default: return { name: 'notifications', color: '#757575' }; // Xám
    }
  };

  // 4. Render từng dòng
  const renderItem = ({ item }: { item: NotificationItem }) => {
    const icon = getIcon(item.type);
    const time = new Date(item.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'});

    return (
      <View style={[styles.card, !item.read && styles.unread]}>
        <View style={styles.iconBox}>
          <Ionicons name={icon.name as any} size={24} color={icon.color} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Thông báo</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{marginTop: 20}} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} />}
          ListEmptyComponent={
            <View style={{alignItems:'center', marginTop: 50}}>
              <Ionicons name="notifications-off-outline" size={50} color="#ccc"/>
              <Text style={{color:'#999', marginTop:10}}>Chưa có thông báo nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 50, paddingHorizontal: 15 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, color:'#333' },
  card: { 
    flexDirection: 'row', padding: 15, marginBottom: 10, 
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1, borderColor: '#eee',
    elevation: 2, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:2
  },
  unread: { backgroundColor: '#F0F8FF', borderColor: '#2196F3' }, // Tin chưa đọc sẽ hơi xanh
  iconBox: { marginRight: 15, justifyContent:'center' },
  content: { flex: 1 },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 4, color: '#333' },
  body: { fontSize: 14, color: '#555', marginBottom: 6 },
  time: { fontSize: 12, color: '#999', textAlign: 'right' }
});