import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "@/constants/Colors";
import { TimeTableData, TimeTableSlot } from "@/types/booking";
import { transformToTimeTable } from "@/utils/bookingUtils";
import { venueApi } from "@/api/venueApi";
import { VenueDetailCourtItem } from "@/types/venue";

// --- HELPER: Generate next 14 days ---
const getNextDays = (days: number) => {
  const dates = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const DATES = getNextDays(14);
const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const START_HOUR = 6;
const END_HOUR = 22;
const SLOT_WIDTH = 80;
const LEFT_COLUMN_WIDTH = 80;

export default function ScheduleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { venueId, venueName } = params;

  const [selectedDate, setSelectedDate] = useState<Date>(DATES[0]);
  const [tableData, setTableData] = useState<TimeTableData[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (!venueId) return;
        
        // Fetch availability (Real API)
        const dateStr = selectedDate.toISOString().split("T")[0];
        const availabilityData = await venueApi.getVenueAvailability(venueId as string, dateStr);

        // Transform to Table UI
        const table = transformToTimeTable(availabilityData, selectedDate);
        setTableData(table);
        setSelectedSlotIds([]); 

      } catch (e) {
        console.error("Load schedule failed", e);
        // Alert.alert("Lỗi", "Không thể tải lịch sân"); // Optional: suppress if simple navigation error
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [venueId, selectedDate]);

  const handleToggleSlot = (slot: TimeTableSlot) => {
    if (slot.status === 'booked') return;

    setSelectedSlotIds((prev) => {
      if (prev.includes(slot.slotId)) {
        return prev.filter((id) => id !== slot.slotId);
      } else {
        return [...prev, slot.slotId];
      }
    });
  };

  // Calculate total price
  const totalPrice = selectedSlotIds.reduce((sum, id) => {
    // Find slot across all rows
    for (const row of tableData) {
      const found = row.slots.find(s => s.slotId === id);
      if (found) return sum + found.price;
    }
    return sum;
  }, 0);

  const handleContinue = () => {
    if (selectedSlotIds.length === 0) {
      Alert.alert("Chưa chọn giờ", "Vui lòng chọn ít nhất một khung giờ.");
      return;
    }

    // Collect full slot objects
    const selectedSlotsData: any[] = [];
    tableData.forEach(row => {
        row.slots.forEach(slot => {
            if (selectedSlotIds.includes(slot.slotId)) {
                selectedSlotsData.push({
                    ...slot,
                    courtName: row.courtName,
                    courtId: row.courtId
                });
            }
        });
    });

    router.push({
      pathname: "/booking/checkout",
      params: {
        venueId,
        date: selectedDate.toISOString(),
        slots: JSON.stringify(selectedSlotsData),
        totalPrice,
      },
    });
  };

  const renderDateItem = ({ item }: { item: Date }) => {
    const isSelected =
      item.getDate() === selectedDate.getDate() &&
      item.getMonth() === selectedDate.getMonth();

    return (
      <TouchableOpacity
        style={[styles.dateItem, isSelected && styles.dateItemSelected]}
        onPress={() => setSelectedDate(item)}
      >
        <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>
          {WEEKDAYS[item.getDay()]}
        </Text>
        <Text style={[styles.dateNum, isSelected && styles.dateTextSelected]}>
          {item.getDate()}
        </Text>
      </TouchableOpacity>
    );
  };

  // Header Row: Hours
  const renderHeaderRow = () => {
    const hours = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
      hours.push(h);
    }
    return (
      <View style={styles.headerRow}>
        {/* Placeholder for left column */}
        <View style={{ width: LEFT_COLUMN_WIDTH, backgroundColor: '#f9f9f9', borderRightWidth: 1, borderColor: '#eee' }} />
        
        {hours.map(h => (
          <View key={h} style={styles.headerCell}>
            <Text style={styles.headerTimeText}>{h.toString().padStart(2,'0')}:00</Text>
          </View>
        ))}
      </View>
    );
  };

  // Data Row: Court + Slots
  const renderRowItem = ({ item }: { item: TimeTableData }) => {
    return (
      <View style={styles.rowContainer}>
        {/* Fixed Left Column: Court Name */}
        <View style={styles.leftColumn}>
          <Text style={styles.courtName} numberOfLines={2}>
            {item.courtName}
          </Text>
        </View>

        {/* Scrollable Slots */}
        <View style={styles.slotsRow}>
          {item.slots.map((slot) => {
             const isSelected = selectedSlotIds.includes(slot.slotId);
             const isBooked = slot.status === 'booked';
             const priceDisplay = (slot.price / 1000).toFixed(0) + 'k';
             
             return (
               <TouchableOpacity
                 key={slot.slotId}
                 style={[
                   styles.slotCell,
                   isBooked && styles.slotBooked,
                   isSelected && styles.slotSelected
                 ]}
                 disabled={isBooked}
                 onPress={() => handleToggleSlot(slot)}
               >
                 {!isBooked && (
                    <Text style={[
                        styles.slotPriceText, 
                        isSelected && styles.slotPriceTextSelected
                    ]}>
                        {priceDisplay}
                    </Text>
                 )}
               </TouchableOpacity>
             );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: venueName ? `Lịch sân ${venueName}` : "Chọn lịch đặt",
          headerBackTitle: "Quay lại",
          headerTintColor: Colors.primary,
        }}
      />
      <StatusBar barStyle="dark-content" />

      {/* 1. Date Selector */}
      <View style={styles.calendarContainer}>
        <FlatList
          data={DATES}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={renderDateItem}
          keyExtractor={(item) => item.toISOString()}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>

      <View style={styles.divider} />
      
      <View style={styles.noteContainer}>
          <View style={styles.noteItem}>
              <View style={[styles.noteBox, styles.slotBooked]} />
              <Text style={styles.noteText}>Đã đặt</Text>
          </View>
          <View style={styles.noteItem}>
              <View style={[styles.noteBox, { borderColor: '#ddd', borderWidth: 1 }]} />
              <Text style={styles.noteText}>Trống</Text>
          </View>
          <View style={styles.noteItem}>
              <View style={[styles.noteBox, styles.slotSelected]} />
              <Text style={styles.noteText}>Đang chọn</Text>
          </View>
      </View>

      {/* 2. Matrix Table */}
      <View style={styles.tableContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ flex: 1 }}>
          <View>
            {renderHeaderRow()}
            
            <FlatList
              data={tableData}
              renderItem={renderRowItem}
              keyExtractor={item => item.courtId}
              scrollEnabled={false} // Use parent ScrollView if needed, or allow vertical scroll
            />
          </View>
        </ScrollView>
      </View>

      {/* 3. Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Tạm tính:</Text>
          <Text style={styles.priceValue}>
            {totalPrice.toLocaleString("vi-VN")} đ
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.btnContinue,
            selectedSlotIds.length === 0 && styles.btnDisabled,
          ]}
          disabled={selectedSlotIds.length === 0}
          onPress={handleContinue}
        >
          <Text style={styles.btnText}>Tiếp tục</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  // Calendar
  calendarContainer: {
    paddingVertical: 12,
    backgroundColor: "#fff",
    height: 90,
  },
  dateItem: {
    width: 50,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  dateItemSelected: {
    backgroundColor: Colors.primary,
  },
  dateDay: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  dateNum: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
  },
  dateTextSelected: {
    color: "#fff",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  noteContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingVertical: 8,
      gap: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee'
  },
  noteItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6
  },
  noteBox: {
      width: 16,
      height: 16,
      borderRadius: 4,
      backgroundColor: '#fff'
  },
  noteText: {
      fontSize: 12,
      color: Colors.textSecondary
  },

  // Table
  tableContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    height: 40,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerCell: {
    width: SLOT_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  headerTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  
  // Rows
  rowContainer: {
    flexDirection: 'row',
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  leftColumn: {
    width: LEFT_COLUMN_WIDTH,
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    position: 'absolute', // Sticky implementation simpler with separate view
    left: 0, 
    top: 0,
    bottom: 0,
    zIndex: 10
  },
  courtName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  slotsRow: {
    flexDirection: 'row',
    marginLeft: LEFT_COLUMN_WIDTH, // Offset for sticky column
  },
  slotCell: {
    width: SLOT_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  slotBooked: {
    backgroundColor: '#E5E7EB',
  },
  slotSelected: {
    backgroundColor: Colors.primary,
  },
  slotPriceText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500'
  },
  slotPriceTextSelected: {
    color: '#fff',
    fontWeight: '700'
  },
  
  // Bottom Bar
  bottomBar: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
  },
  btnContinue: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    gap: 8,
  },
  btnDisabled: {
    backgroundColor: "#D1D5DB",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});