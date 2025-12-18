import CustomHeader from "@/components/ui/CustomHeader";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { bookingApi } from "../../api/bookingApi";
import { venueApi } from "../../api/venueApi";
import { BookingListResponse } from "../../types/booking";
import { VenueListItem } from "../../types/venue";

const PRIMARY = "#00A36C";

type DateFilterType = "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM";

export default function OwnerHistoryScreen() {
  const [bookings, setBookings] = useState<BookingListResponse[]>([]);
  const [venues, setVenues] = useState<VenueListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilterType>("THIS_MONTH");
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  
  // Custom Date Range
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on filter
      let start = startDate;
      let end = endDate;
      const now = new Date();

      if (dateFilter === "TODAY") {
        start = new Date();
        start.setHours(0,0,0,0);
        end = new Date();
        end.setHours(23,59,59,999);
      } else if (dateFilter === "YESTERDAY") {
        start = new Date(now);
        start.setDate(now.getDate() - 1);
        start.setHours(0,0,0,0);
        end = new Date(now);
        end.setDate(now.getDate() - 1);
        end.setHours(23,59,59,999);
      } else if (dateFilter === "THIS_WEEK") {
        const day = now.getDay(); // 0 (Sun) to 6 (Sat)
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        
        start = new Date(now);
        start.setDate(diff);
        start.setHours(0,0,0,0);
        
        end = new Date(start);
        end.setDate(start.getDate() + 6); // Sunday
        end.setHours(23,59,59,999);
      } else if (dateFilter === "THIS_MONTH") {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23,59,59,999);
      }

      // Fetch Venues (for dropdown) - assume endpoint returns owner's venues or public ones
      // Ideally we should filter this list to only owner's venues if the API returns all public ones
      const venueData = await venueApi.listVenues(); 
      setVenues(venueData);

      // Fetch Bookings
      const bookingData = await bookingApi.getOwnerBookings({
        statuses: ["COMPLETED", "CONFIRMED"],
        venueId: selectedVenueId || undefined,
        from: start.toISOString(),
        to: end.toISOString()
      });
      setBookings(bookingData);

    } catch (error) {
      console.error("Failed to fetch history:", error);
      Alert.alert("Lỗi", "Không thể tải dữ liệu lịch sử.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [dateFilter, selectedVenueId, startDate, endDate]) // Refetch when filters change
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Calculations
  const summary = useMemo(() => {
    let totalRevenue = 0;
    let totalBookings = bookings.length;

    bookings.forEach(b => {
        if (b.totalPrice) {
            totalRevenue += b.totalPrice;
        }
    });

    return { totalRevenue, totalBookings };
  }, [bookings]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
        setShowPicker(null);
        return;
    }
    const currentDate = selectedDate || (showPicker === 'start' ? startDate : endDate);
    
    if (showPicker === 'start') {
        setStartDate(currentDate);
    } else {
        setEndDate(currentDate);
    }
    setShowPicker(null);
  };

  const renderFilterButton = (label: string, value: DateFilterType) => (
    <TouchableOpacity
      style={[styles.filterBtn, dateFilter === value && styles.filterBtnActive]}
      onPress={() => setDateFilter(value)}
    >
      <Text style={[styles.filterBtnText, dateFilter === value && styles.filterBtnTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: BookingListResponse }) => {
     const date = new Date(item.startTime);
     const dateStr = date.toLocaleDateString("vi-VN");
     const timeStr = date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
           <View>
              <Text style={styles.venueName}>{item.venue}</Text>
              <Text style={styles.courtName}>{item.court}</Text>
              {item.userName && (
                <Text style={styles.userIdText}>
                  👤 {item.userName} {item.userId ? `(#${item.userId.substring(0, 8)})` : ''}
                </Text>
              )}
              <Text style={styles.bookingIdText}>{item.id}</Text>
           </View>
           <Text style={styles.priceHighlight}>
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.totalPrice)}
           </Text>
        </View>
        <View style={styles.cardFooter}>
           <Text style={styles.dateText}>{dateStr} • {timeStr}</Text>
           <View style={[styles.statusBadge, { backgroundColor: '#E6F6EC' }]}>
               <Text style={{ color: '#00A36C', fontSize: 10, fontWeight: 'bold' }}>{item.status}</Text>
           </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Lịch sử & Doanh thu" showBackButton={true} />
      
      <View style={styles.filterSection}>
        {/* Date Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {renderFilterButton("Hôm qua", "YESTERDAY")}
          {renderFilterButton("Tuần này", "THIS_WEEK")}
          {renderFilterButton("Tháng này", "THIS_MONTH")}
          {renderFilterButton("Tùy chọn", "CUSTOM")}
        </ScrollView>

        {dateFilter === "CUSTOM" && (
            <View style={styles.customDateRow}>
                <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowPicker('start')}>
                    <Text style={styles.dateText}>{startDate.toLocaleDateString("vi-VN")}</Text>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                </TouchableOpacity>
                <Text>-</Text>
                <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowPicker('end')}>
                     <Text style={styles.dateText}>{endDate.toLocaleDateString("vi-VN")}</Text>
                     <Ionicons name="calendar-outline" size={16} color="#666" />
                </TouchableOpacity>
            </View>
        )}

        {/* Venue Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterScroll, { marginTop: 8 }]}>
             <TouchableOpacity 
                style={[styles.venueChip, selectedVenueId === null && styles.venueChipActive]}
                onPress={() => setSelectedVenueId(null)}
             >
                <Text style={[styles.venueChipText, selectedVenueId === null && styles.venueChipTextActive]}>Tất cả sân</Text>
             </TouchableOpacity>
             {venues.map(v => (
                 <TouchableOpacity 
                    key={v.id}
                    style={[styles.venueChip, selectedVenueId === v.id && styles.venueChipActive]}
                    onPress={() => setSelectedVenueId(v.id)}
                 >
                    <Text style={[styles.venueChipText, selectedVenueId === v.id && styles.venueChipTextActive]}>{v.name}</Text>
                 </TouchableOpacity>
             ))}
        </ScrollView>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Doanh thu</Text>
              <Text style={styles.summaryValue}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(summary.totalRevenue)}
              </Text>
          </View>
          <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Đơn đặt</Text>
              <Text style={styles.summaryValue}>{summary.totalBookings}</Text>
          </View>
      </View>

      {loading && !refreshing ? (
         <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
            data={bookings}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyText}>Không có dữ liệu trong khoảng thời gian này.</Text>}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {showPicker && (
        <DateTimePicker
            value={showPicker === 'start' ? startDate : endDate}
            mode="date"
            display="default"
            onChange={onDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  filterSection: {
      backgroundColor: '#fff',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
  },
  filterScroll: {
      flexDirection: 'row',
  },
  filterBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: '#f0f0f0',
      marginRight: 8,
  },
  filterBtnActive: {
      backgroundColor: PRIMARY,
  },
  filterBtnText: {
      fontSize: 13,
      color: '#666',
      fontWeight: '500',
  },
  filterBtnTextActive: {
      color: '#fff',
  },
  customDateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 8,
  },
  datePickerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#f9f9f9',
      padding: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#eee',
  },
  venueChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#ddd',
      marginRight: 8,
  },
  venueChipActive: {
      borderColor: PRIMARY,
      backgroundColor: '#E6F6EC',
  },
  venueChipText: {
      fontSize: 12,
      color: '#666',
  },
  venueChipTextActive: {
      color: PRIMARY,
      fontWeight: '600',
  },
  summaryContainer: {
      flexDirection: 'row',
      padding: 16,
      gap: 12,
  },
  summaryCard: {
      flex: 1,
      backgroundColor: '#fff',
      padding: 16,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      alignItems: 'center',
  },
  summaryLabel: {
      fontSize: 12,
      color: '#888',
      marginBottom: 4,
      textTransform: 'uppercase',
  },
  summaryValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
  },
  listContent: {
      paddingHorizontal: 16,
      paddingBottom: 20,
  },
  card: {
      backgroundColor: '#fff',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: PRIMARY,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
  },
  cardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
  },
  venueName: {
      fontSize: 14,
      color: '#666',
  },
  courtName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
  },
  userIdText: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  bookingIdText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    fontFamily: 'monospace', // helps reading IDs
  },
  priceHighlight: {
      fontSize: 16,
      fontWeight: 'bold',
      color: PRIMARY,
  },
  cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  dateText: {
      fontSize: 13,
      color: '#888',
  },
  statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
  },
  emptyText: {
      textAlign: 'center',
      marginTop: 40,
      color: '#999',
  }
});
