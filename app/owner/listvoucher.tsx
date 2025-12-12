import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { format } from 'date-fns';

// Cấu hình URL API (Thay bằng IP máy bạn nếu chạy localhost)
const API_URL = 'http://192.168.1.X:8080/v1/owner/vouchers'; 
// Hàm lấy token (giả lập, bạn thay bằng logic lấy token thật từ Context/Storage)
const getAuthToken = async () => 'YOUR_BEARER_TOKEN';

interface Voucher {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  validFrom: string;
  validTo: string;
  active: boolean;
}

export default function VoucherListScreen() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVouchers = async () => {
    try {
      const token = await getAuthToken();
      // Gọi API GET listMine() trong OwnerVoucherController
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVouchers(response.data);
    } catch (error) {
      console.error('Lỗi lấy danh sách voucher:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load lại data mỗi khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      fetchVouchers();
    }, [])
  );

  const renderItem = ({ item }: { item: Voucher }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="ticket-percent" size={24} color="#00C853" />
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.codeText}>{item.code}</Text>
        <Text style={styles.valueText}>
          Giảm: {item.type === 'PERCENT' ? `${item.value}%` : `$${item.value}`}
        </Text>
        <Text style={styles.dateText}>
          Hết hạn: {format(new Date(item.validTo), 'dd/MM/yyyy')}
        </Text>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.statusBadge, { backgroundColor: item.active ? '#E8F5E9' : '#FFEBEE' }]}>
          <Text style={{ color: item.active ? '#2E7D32' : '#C62828', fontSize: 10, fontWeight: 'bold' }}>
            {item.active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Quản lý Voucher', 
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/owner/create')}>
              <Ionicons name="add-circle" size={30} color="#00C853" />
            </TouchableOpacity>
          )
        }} 
      />

      {loading ? (
        <ActivityIndicator size="large" color="#00C853" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={vouchers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVouchers(); }} />}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>Chưa có voucher nào.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, alignItems: 'center', elevation: 2 },
  cardLeft: { marginRight: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1 },
  codeText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  valueText: { fontSize: 14, color: '#00C853', fontWeight: '600', marginTop: 2 },
  dateText: { fontSize: 12, color: '#888', marginTop: 2 },
  cardRight: { justifyContent: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
});