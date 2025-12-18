import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert
} from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import apiClient from "../../api/apiClient";
import { Colors } from "../../constants/Colors";
import CustomHeader from "@/components/ui/CustomHeader";

const parseDate = (value: any): Date | null => {
  if (!value) return null;
  const tryDate = (input: any) => {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  // ISO string, date string, or timestamp number
  const direct = tryDate(value);
  if (direct) return direct;

   // Handle OffsetDateTime serialized as object {year, monthValue, dayOfMonth, hour, minute, second}
   if (typeof value === "object") {
     const obj = value as any;
     const year = obj.year ?? obj?.date?.year;
     const month = obj.monthValue ?? obj.month ?? obj?.date?.monthValue ?? obj?.date?.month;
     const day = obj.dayOfMonth ?? obj.day ?? obj?.date?.dayOfMonth ?? obj?.date?.day;
     const hour = obj.hour ?? obj?.time?.hour ?? 0;
     const minute = obj.minute ?? obj?.time?.minute ?? 0;
     const second = obj.second ?? obj?.time?.second ?? 0;

     if (year && month && day) {
       const d = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
       if (!Number.isNaN(d.getTime())) return d;
     }
   }

  const asNumber = Number(value);
  if (!Number.isNaN(asNumber)) {
    const numDate = tryDate(asNumber);
    if (numDate) return numDate;
  }

  return null;
};

// 1. Định nghĩa Interface khớp 100% với VoucherResponse của Java
interface VoucherResponse {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrderAmount: number;
  validFrom: string;
  validTo: string;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
}

export default function MyVoucherScreen() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all");
  const [search, setSearch] = useState("");

  // 2. Hàm gọi API đã được đơn giản hóa tối đa
  const fetchVouchers = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      
      // Backend trả về List<VoucherResponse> nên res.data chính là mảng []
      const res = await apiClient.get<VoucherResponse[]>("/owner/vouchers");
      
      console.log("📦 Vouchers loaded:", res.data.length);
      setVouchers(res.data || []);
      setError(null);

    } catch (err: any) {
      console.error("Lỗi tải voucher:", err);
      setError("Không thể tải danh sách voucher.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useFocusEffect(
    useCallback(() => {
      fetchVouchers();
    }, [fetchVouchers])
  );

  // 3. Logic lọc (Filter)
  const filteredData = useMemo(() => {
    const now = new Date();
    return vouchers.filter((v) => {
      // Search
      const matchName = v.code.toLowerCase().includes(search.toLowerCase());
      if (!matchName) return false;

      // Filter Status
      const expiryDate = parseDate(v.validTo);
      const isExpired = expiryDate ? expiryDate < now : true; // nếu parse lỗi coi như hết hạn
      if (filter === "active") return v.active && !isExpired;
      if (filter === "expired") return !v.active || isExpired;
      return true;
    });
  }, [vouchers, filter, search]);

  const renderItem = ({ item }: { item: VoucherResponse }) => {
    const now = new Date();
    const validTo = parseDate(item.validTo);
    const safeValidTo = validTo ?? new Date();
    const isExpired = validTo ? validTo < now : true;
    const isActive = item.active && !isExpired;
    
    // Format giá trị giảm
    const valueDisplay = item.type === "PERCENT" 
      ? `${item.value}%` 
      : `${item.value.toLocaleString("vi-VN")} đ`;

    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconBox, !isActive && { backgroundColor: "#F3F4F6" }]}>
            <MaterialCommunityIcons 
              name="ticket-percent-outline" 
              size={24} 
              color={isActive ? Colors.primary : "#9CA3AF"} 
            />
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.rowBetween}>
            <Text style={styles.codeText}>{item.code}</Text>
            <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.badgeText, isActive ? styles.textActive : styles.textInactive]}>
                    {isActive ? "Active" : "Expired"}
                </Text>
            </View>
          </View>
          
          <Text style={styles.valueText}>Giảm {valueDisplay}</Text>
          <Text style={styles.dateText}>HSD: {format(safeValidTo, "dd/MM/yyyy")}</Text>
          
          {item.usageLimit !== null && (
             <Text style={styles.usageText}>
                Đã dùng: {item.usedCount} / {item.usageLimit}
             </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Quản lý Voucher" showBackButton />
      
      {/* Nút thêm mới */}
      <View style={styles.addButtonContainer}>
         <TouchableOpacity onPress={() => router.push("/owner/create")}> 
              <Ionicons name="add-circle" size={40} color={Colors.primary} />
         </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        {/* Search */}
        <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput 
                style={styles.searchInput} 
                placeholder="Tìm mã voucher..." 
                value={search}
                onChangeText={setSearch}
            />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
            {['all', 'active', 'expired'].map((t) => (
                <TouchableOpacity 
                    key={t} 
                    style={[styles.tab, filter === t && styles.tabActive]}
                    onPress={() => setFilter(t as any)}
                >
                    <Text style={[styles.tabText, filter === t && styles.tabTextActive]}>
                        {t === 'all' ? 'Tất cả' : t === 'active' ? 'Đang chạy' : 'Hết hạn'}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVouchers(); }} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Chưa có voucher nào.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  addButtonContainer: { position: 'absolute', top: 50, right: 16, zIndex: 10 },
  filterSection: { padding: 16, backgroundColor: 'white' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 12, height: 40, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  tabs: { flexDirection: 'row', gap: 10 },
  tab: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F3F4F6' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
  tabTextActive: { color: 'white' },
  list: { padding: 16 },
  card: { flexDirection: 'row', backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardLeft: { marginRight: 12, justifyContent: 'center' },
  iconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  codeText: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  valueText: { fontSize: 14, color: Colors.primary, fontWeight: '700', marginBottom: 2 },
  dateText: { fontSize: 12, color: '#6B7280' },
  usageText: { fontSize: 12, color: '#6B7280', marginTop: 2, fontStyle: 'italic' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeActive: { backgroundColor: '#ECFDF5' },
  badgeInactive: { backgroundColor: '#FEF2F2' },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  textActive: { color: '#059669' },
  textInactive: { color: '#DC2626' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#9CA3AF' }
});