import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import axios from 'axios';

// --- CONFIG ---
const BASE_URL = 'http://192.168.1.X:8080'; // Thay IP của bạn
// Hàm giả lập token
const getAuthToken = async () => 'YOUR_BEARER_TOKEN';

interface Venue {
  id: string;
  name: string;
  address: string;
  // Giả sử API trả về field ảnh là 'imageUrl' hoặc 'image'
  imageUrl?: string; 
}

export default function CreateVoucherScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [value, setValue] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  
  // Date State (Mock logic, thực tế nên dùng DatePicker)
  const [validFrom, setValidFrom] = useState(new Date());
  const [validTo, setValidTo] = useState(new Date(new Date().setDate(new Date().getDate() + 30))); // Mặc định +30 ngày

  // Venue State
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);

  // 1. Fetch Venues khi vào màn hình
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const token = await getAuthToken();
        // Gọi API listVenues từ VenueController
        const res = await axios.get(`${BASE_URL}/api/v1/venues`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVenues(res.data); // Giả sử res.data là mảng VenueListResponse
      } catch (err) {
        console.log('Error fetching venues:', err);
      }
    };
    fetchVenues();
  }, []);

  // Logic chọn/bỏ chọn sân
  const toggleVenue = (id: string) => {
    if (selectedVenues.includes(id)) {
      setSelectedVenues(selectedVenues.filter(item => item !== id));
    } else {
      setSelectedVenues([...selectedVenues, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedVenues.length === venues.length) setSelectedVenues([]);
    else setSelectedVenues(venues.map(v => v.id));
  };

  // 2. Submit Form (Tạo Voucher)
  const handleCreate = async () => {
    if (!code || !value) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã và giá trị giảm giá');
      return;
    }

    setLoading(true);
    try {
      const token = await getAuthToken();
      
      // Payload map đúng với VoucherRequest.java
      const payload = {
        code: code,
        type: discountType,
        value: parseFloat(value),
        minOrderAmount: 0, // Mặc định 0 hoặc thêm input nếu cần
        validFrom: validFrom.toISOString(), // Chuyển sang format ISO cho OffsetDateTime
        validTo: validTo.toISOString(),
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        active: true,
        // LƯU Ý: Backend Java cần bổ sung field này trong DTO nếu muốn lưu
        venueIds: selectedVenues 
      };

      await axios.post(`${BASE_URL}/v1/owner/vouchers`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Thành công', 'Đã tạo voucher mới!');
      router.back();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Thất bại', error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Create Voucher", headerShadowVisible: false }} />
      
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* VOUCHER CODE */}
          <Text style={styles.label}>VOUCHER CODE</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="ticket-percent-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput 
              value={code}
              onChangeText={setCode}
              placeholder="e.g., SUMMER2024" 
              style={styles.input} 
              autoCapitalize="characters"
            />
          </View>

          {/* DISCOUNT */}
          <Text style={styles.label}>DISCOUNT</Text>
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <TextInput 
                value={value}
                onChangeText={setValue}
                placeholder="Value" 
                style={styles.input} 
                keyboardType="numeric"
              />
            </View>
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[styles.toggleButton, discountType === 'PERCENT' && styles.toggleActive]}
                onPress={() => setDiscountType('PERCENT')}
              >
                <Text style={[styles.toggleText, discountType === 'PERCENT' && styles.textActive]}>%</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleButton, discountType === 'FIXED' && styles.toggleActive]}
                onPress={() => setDiscountType('FIXED')}
              >
                <Text style={[styles.toggleText, discountType === 'FIXED' && styles.textActive]}>$</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* DURATION (Mock UI - Thực tế cần gắn DatePicker) */}
          <Text style={styles.label}>DURATION</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.dateInput, { marginRight: 10 }]}>
              <View>
                <Text style={styles.dateLabel}>Start</Text>
                <Text style={styles.dateValue}>{validFrom.toLocaleDateString()}</Text>
              </View>
              <Feather name="calendar" size={20} color="#333" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.dateInput}>
              <View>
                <Text style={styles.dateLabel}>End</Text>
                <Text style={styles.dateValue}>{validTo.toLocaleDateString()}</Text>
              </View>
              <Feather name="calendar" size={20} color="#333" />
            </TouchableOpacity>
          </View>

          {/* APPLY TO VENUES */}
          <View style={[styles.row, { marginTop: 20, marginBottom: 10, justifyContent: 'space-between' }]}>
            <Text style={styles.labelNoMargin}>APPLY TO VENUES</Text>
            <TouchableOpacity onPress={handleSelectAll}>
              <Text style={{ color: '#00C853', fontWeight: '600' }}>
                {selectedVenues.length === venues.length && venues.length > 0 ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>

          {venues.length === 0 && <Text style={{color: '#999', fontStyle:'italic'}}>Đang tải danh sách sân...</Text>}
          
          {venues.map((venue) => {
            const isSelected = selectedVenues.includes(venue.id);
            return (
              <TouchableOpacity 
                key={venue.id} 
                style={[styles.venueCard, isSelected && styles.venueCardSelected]}
                onPress={() => toggleVenue(venue.id)}
              >
                <Image 
                  source={{ uri: venue.imageUrl || 'https://via.placeholder.com/100' }} 
                  style={styles.venueImage} 
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.venueName}>{venue.name}</Text>
                  <Text style={styles.venueAddress}>{venue.address}</Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
              </TouchableOpacity>
            )
          })}

          {/* USAGE LIMITS */}
          <View style={[styles.row, { marginTop: 20, justifyContent: 'space-between' }]}>
            <Text style={styles.labelNoMargin}>USAGE LIMITS</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>Optional</Text></View>
          </View>
          <View style={[styles.inputContainer, { marginTop: 10 }]}>
            <Feather name="users" size={20} color="#888" style={styles.inputIcon} />
            <TextInput 
              value={usageLimit}
              onChangeText={setUsageLimit}
              placeholder="Total max usage (e.g. 100)" 
              style={styles.input} 
              keyboardType="numeric"
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* BUTTON FOOTER */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.createButton, loading && { opacity: 0.7 }]} 
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.createButtonText}>Create Voucher</Text>
                <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

// STYLES (Giữ nguyên style đẹp từ trước)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 10, marginTop: 20 },
  labelNoMargin: { fontSize: 13, fontWeight: '700', color: '#555' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 15, height: 50 },
  input: { flex: 1, fontSize: 16, color: '#000', height: '100%' },
  inputIcon: { marginRight: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, height: 50, borderWidth: 1, borderColor: '#eee', overflow: 'hidden' },
  toggleButton: { width: 50, justifyContent: 'center', alignItems: 'center' },
  toggleActive: { backgroundColor: '#fff' },
  toggleText: { fontSize: 16, color: '#ccc', fontWeight: 'bold' },
  textActive: { color: '#00C853' },
  dateInput: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, height: 60 },
  dateLabel: { fontSize: 12, color: '#00C853', fontWeight: '600' },
  dateValue: { fontSize: 14, fontWeight: '500' },
  venueCard: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 16, borderWidth: 1, borderColor: '#f0f0f0', marginBottom: 10, backgroundColor: '#fff' },
  venueCardSelected: { borderColor: '#00C853', backgroundColor: '#F0FDF4' },
  venueImage: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#eee' },
  venueName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  venueAddress: { fontSize: 12, color: '#888', marginTop: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#00C853', borderColor: '#00C853' },
  badge: { backgroundColor: '#eee', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, color: '#666' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  createButton: { backgroundColor: '#00C853', borderRadius: 12, height: 55, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});