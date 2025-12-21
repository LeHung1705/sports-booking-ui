import CustomHeader from "@/components/ui/CustomHeader";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from "react-native";

import { venueApi } from "@/api/venueApi";
import { bookingApi } from "@/api/bookingApi"; // Added import
import { Colors } from "@/constants/Colors";
import { TimeTableData, TimeTableSlot } from "@/types/booking";
import { transformToTimeTable } from "@/utils/bookingUtils";

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
const END_HOUR = 23;

// Generate 30-minute intervals: 06:00, 06:30, ... 22:30
const TIME_SLOTS: string[] = [];
for (let h = START_HOUR; h < END_HOUR; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`);
}

const SLOT_WIDTH = 80;
const LEFT_COLUMN_WIDTH = 80;

export default function ScheduleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { venueId, venueName } = params;
  const headerTitle = typeof venueName === 'string' ? `Lịch sân ${venueName}` : "Chọn lịch đặt";

  const [selectedDate, setSelectedDate] = useState<Date>(DATES[0]);
  const [tableData, setTableData] = useState<TimeTableData[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false); // New state for creation loading

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (!venueId) return;
        
        // Fetch availability (Real API)
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const availabilityData = await venueApi.getVenueAvailability(venueId as string, dateStr);

        // DEBUG: Log API response thoroughly
        console.log("🔥 API RAW RESPONSE:", JSON.stringify(availabilityData, null, 2));

        if (Array.isArray(availabilityData) && availabilityData.length > 0) {
          console.log('=== CHECK SPECIFIC SLOTS (07:00 - 09:00) ===');
          availabilityData[0].slots?.forEach((slot: any) => {
             // Check if time is between 07:00 and 09:00
             if (slot.time >= "07:00" && slot.time <= "09:00") {
                console.log(`⏰ CHECK SLOT: ${slot.time} - Status: ${slot.status} - Price: ${slot.price}`);
             }
          });
        }
        else console.log("No availability data received from API.");

        // Transform to Table UI
        const table = transformToTimeTable(availabilityData, selectedDate);
        console.log('=== TRANSFORMED TABLE ===');
        if (table.length > 0 && table[0].slots.length > 0) {
          console.log('First transformed slot:', table[0].slots[0]);
        }
        setTableData(table);
        setSelectedSlotIds([]); 

      } catch (e) {
        console.error("Load schedule failed", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [venueId, selectedDate]);

  const handleToggleSlot = (slot: TimeTableSlot) => {
    // Normalize status check - handle both lowercase and uppercase
    const status = slot.status?.toLowerCase();
    if (status === 'booked') return;

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
    for (const row of tableData) {
      const found = row.slots.find(s => s.slotId === id);
      if (found) return sum + found.price;
    }
    return sum;
  }, 0);

  const handleContinue = async () => {
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

    // Validation 1: Check if all slots are on the same court
    const firstCourtId = selectedSlotsData[0].courtId;
    const isSameCourt = selectedSlotsData.every(s => s.courtId === firstCourtId);
    if (!isSameCourt) {
        Alert.alert("Lỗi chọn sân", "Vui lòng chỉ chọn các khung giờ trên cùng một sân.");
        return;
    }

    // Sort slots by time
    selectedSlotsData.sort((a, b) => a.time.localeCompare(b.time));

    // Validation 2: Check for gaps (optional but recommended)
    // We can assume user wants to book the range from Start of First to End of Last.
    // Ideally, we should check continuity.
    
    // Prepare API Payload
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const startTimeStr = `${dateStr}T${selectedSlotsData[0].time}:00`;
    
    // Calculate End Time: Last slot time + 30 mins
    const lastSlotTime = selectedSlotsData[selectedSlotsData.length - 1].time;
    const [h, m] = lastSlotTime.split(':').map(Number);
    const endDate = new Date(selectedDate);
    endDate.setHours(h, m + 30, 0, 0); // Add 30 mins
    
    // Format endDate back to YYYY-MM-DDTHH:mm:00
    // Using explicit formatting to avoid timezone issues with toISOString() in some envs
    const endY = endDate.getFullYear();
    const endM = String(endDate.getMonth() + 1).padStart(2, '0');
    const endD = String(endDate.getDate()).padStart(2, '0');
    const endH = String(endDate.getHours()).padStart(2, '0');
    const endMin = String(endDate.getMinutes()).padStart(2, '0');
    
    const endTimeStr = `${endY}-${endM}-${endD}T${endH}:${endMin}:00`;

    setCreating(true);
    try {
        const res = await bookingApi.createBooking({
            court_id: firstCourtId,
            start_time: startTimeStr,
            end_time: endTimeStr,
            payment_option: "DEPOSIT" // Default, can be changed in checkout if logic supports
        });

        router.push({
            pathname: "/booking/checkout",
            params: {
                bookingId: res.id
            },
        });
    } catch (e: any) {
        Alert.alert("Lỗi đặt sân", e.response?.data?.message || "Không thể tạo đơn hàng. Vui lòng thử lại.");
    } finally {
        setCreating(false);
    }
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

  // Header Row: Hours (30 mins)
  const renderHeaderRow = () => {
    return (
      <View style={styles.headerRow}>
        {/* Placeholder for left column */}
        <View style={{ width: LEFT_COLUMN_WIDTH, backgroundColor: '#f9f9f9', borderRightWidth: 1, borderColor: '#eee' }} />
        
        {TIME_SLOTS.map(time => (
          <View key={time} style={styles.headerCell}>
            <Text style={styles.headerTimeText}>{time}</Text>
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
          {TIME_SLOTS.map((time) => {
             // Find slot matching this time
             const slot = item.slots.find(s => s.time === time);
             
             // Check if slot is in the past
             const [hours, minutes] = time.split(':').map(Number);
             const slotDateTime = new Date(selectedDate);
             slotDateTime.setHours(hours, minutes, 0, 0);
             const isPast = slotDateTime < new Date();

             if (!slot) {
                 return (
                     <View key={time} style={[styles.slotCell, isPast ? styles.slotPast : styles.slotBooked]}>
                         <Text style={styles.slotBookedText}>-</Text>
                     </View>
                 );
             }

             const isSelected = selectedSlotIds.includes(slot.slotId);
             // Case-insensitive status check
             const status = slot.status?.toLowerCase();
             const isBooked = status === 'booked';
             const isUnavailable = isBooked || isPast;
             const priceDisplay = (slot.price / 1000).toFixed(0) + 'k';
             
             return (
               <TouchableOpacity
                 key={slot.slotId}
                 style={[
                   styles.slotCell,
                   isBooked && styles.slotBooked,
                   isPast && styles.slotPast,
                   isSelected && styles.slotSelected
                 ]}
                 disabled={isUnavailable}
                 onPress={() => handleToggleSlot(slot)}
               >
                 {!isUnavailable ? (
                    <Text style={[
                        styles.slotPriceText, 
                        isSelected && styles.slotPriceTextSelected
                    ]}>
                        {priceDisplay}
                    </Text>
                 ) : (
                    <Text style={styles.slotBookedText}>{isBooked ? "Đã đặt" : "Đã qua"}</Text>
                 )}
               </TouchableOpacity>
             );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader title={headerTitle} showBackButton={true} />
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
              <View style={[styles.noteBox, styles.slotPast]} />
              <Text style={styles.noteText}>Đã qua</Text>
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
              scrollEnabled={false}
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
            (selectedSlotIds.length === 0 || creating) && styles.btnDisabled,
          ]}
          disabled={selectedSlotIds.length === 0 || creating}
          onPress={handleContinue}
        >
          {creating ? (
             <ActivityIndicator color="#fff" size="small" />
          ) : (
             <>
                 <Text style={styles.btnText}>Tiếp tục</Text>
                 <Ionicons name="arrow-forward" size={20} color="#fff" />
             </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
    position: 'absolute',
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
    marginLeft: LEFT_COLUMN_WIDTH,
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
  slotPast: {
    backgroundColor: '#D1D5DB',
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
  slotBookedText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500'
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