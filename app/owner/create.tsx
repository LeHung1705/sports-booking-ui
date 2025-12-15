import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image, Alert, ActivityIndicator, Platform, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '../../api/apiClient'; // ✅ Dùng chung apiClient của dự án
import CustomHeader from '@/components/ui/CustomHeader';

interface Venue {
  id: string;
  name: string;
  address: string;
  imageUrl?: string; 
}

export default function CreateVoucherScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingVenues, setFetchingVenues] = useState(true);
  
  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [value, setValue] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  
  // Date State
  const [validFrom, setValidFrom] = useState(new Date());
  const [validTo, setValidTo] = useState(new Date(new Date().setDate(new Date().getDate() + 30)));
  const [showPicker, setShowPicker] = useState<'from'|'to'|null>(null);

  // Venue State
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);

  // 1. Fetch Venues (Lấy danh sách sân của Owner)
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        // ✅ Gọi đúng API /my-venues mà bạn đã thêm vào Backend
        const res = await apiClient.get('/venues/my-venues');
        console.log("Venues fetched:", res.data.length);
        setVenues(res.data); 
      } catch (err: any) {
        console.log('Error fetching venues:', err);
        Alert.alert("Lỗi tải sân", "Không thể lấy danh sách sân của bạn.");
      } finally {
        setFetchingVenues(false);
      }
    };
    fetchVenues();
  }, []);

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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const type = showPicker;
    if (Platform.OS === 'android') setShowPicker(null);
    
    if (selectedDate && type) {
      if (type === 'from') setValidFrom(selectedDate);
      else setValidTo(selectedDate);
    }
  };

  // 2. Submit Form (Tạo Voucher)
  const handleCreate = async () => {
    if (!code || !value) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập Mã voucher và Giá trị giảm.');
      return;
    }
    
    // Validate: Bắt buộc chọn Venue (nếu muốn test logic này)
    if (selectedVenues.length === 0) {
        Alert.alert("Chưa chọn sân", "Vui lòng chọn ít nhất 1 sân để áp dụng voucher.");
        return;
    }

    setLoading(true);
    try {
      // Payload map đúng với VoucherRequest.java (đã thêm field venueIds)
      const payload = {
        code: code.toUpperCase(),
        type: discountType,
        value: parseFloat(value),
        minOrderAmount: 0, 
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        active: true,
        venueIds: selectedVenues // ✅ Gửi danh sách ID sân lên
      };

      console.log("Sending payload:", payload);

      // Gọi API tạo voucher
      await apiClient.post('/owner/vouchers', payload);

      Alert.alert('Thành công', 'Đã tạo voucher mới!', [
          { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error("Create voucher error:", error);
      const msg = error.response?.data?.message || 'Có lỗi xảy ra';
      Alert.alert('Thất bại', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        <CustomHeader title="Create Voucher" showBackButton />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* VOUCHER CODE */}
          <Text style={styles.label}>VOUCHER DETAILS</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="ticket-percent-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput 
              value={code}
              onChangeText={setCode}
              placeholder="Code (e.g. SUMMER20)" 
              style={styles.input} 
              autoCapitalize="characters"
            />
          </View>

          {/* DISCOUNT */}
          <View style={[styles.row, {marginTop: 10}]}>
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

          {/* DATES */}
          <Text style={styles.label}>VALIDITY PERIOD</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.dateInput, { marginRight: 10 }]} onPress={() => setShowPicker('from')}>
              <View>
                <Text style={styles.dateLabel}>Start Date</Text>
                <Text style={styles.dateValue}>{validFrom.toLocaleDateString()}</Text>
              </View>
              <Feather name="calendar" size={20} color="#333" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker('to')}>
              <View>
                <Text style={styles.dateLabel}>End Date</Text>
                <Text style={styles.dateValue}>{validTo.toLocaleDateString()}</Text>
              </View>
              <Feather name="calendar" size={20} color="#333" />
            </TouchableOpacity>
          </View>

          {showPicker && (
            Platform.OS === 'ios' ? (
              <Modal
                transparent
                animationType="fade"
                visible={!!showPicker}
                onRequestClose={() => setShowPicker(null)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalCard}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>
                        {showPicker === 'from' ? 'Start Date' : 'End Date'}
                      </Text>
                      <TouchableOpacity onPress={() => setShowPicker(null)}>
                        <Ionicons name="close" size={20} color="#111827" />
                      </TouchableOpacity>
                    </View>

                    <DateTimePicker
                      value={showPicker === 'from' ? validFrom : validTo}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      style={{ alignSelf: 'stretch' }}
                    />

                    <TouchableOpacity style={styles.modalDoneButton} onPress={() => setShowPicker(null)}>
                      <Text style={styles.modalDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker
                value={showPicker === 'from' ? validFrom : validTo}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )
          )}

          {/* APPLY TO VENUES (Phần quan trọng để Test) */}
          <View style={[styles.row, { marginTop: 25, marginBottom: 10, justifyContent: 'space-between' }]}>
            <Text style={styles.labelNoMargin}>APPLY TO VENUES</Text>
            <TouchableOpacity onPress={handleSelectAll}>
              <Text style={{ color: '#00C853', fontWeight: '600' }}>
                {selectedVenues.length === venues.length && venues.length > 0 ? 'Unselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>

          {fetchingVenues && <ActivityIndicator size="small" color="#00C853" />}
          
          {!fetchingVenues && venues.length === 0 && (
              <Text style={{color: '#999', fontStyle:'italic', textAlign:'center', padding: 10}}>
                  Bạn chưa có Venue nào. Hãy tạo Venue trước.
              </Text>
          )}
          
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
                  <Text style={styles.venueAddress} numberOfLines={1}>{venue.address}</Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
              </TouchableOpacity>
            )
          })}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* FOOTER */}
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

// STYLES (Dùng lại style cũ, rất ổn rồi)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20 },
  label: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 8, marginTop: 20, letterSpacing: 0.5 },
  labelNoMargin: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 0.5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 15, height: 50 },
  input: { flex: 1, fontSize: 16, color: '#000', height: '100%' },
  inputIcon: { marginRight: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, height: 50, borderWidth: 1, borderColor: '#eee', overflow: 'hidden' },
  toggleButton: { width: 50, justifyContent: 'center', alignItems: 'center' },
  toggleActive: { backgroundColor: '#E8F5E9' }, // Xanh nhạt khi active
  toggleText: { fontSize: 16, color: '#ccc', fontWeight: 'bold' },
  textActive: { color: '#00C853' },
  dateInput: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, height: 60 },
  dateLabel: { fontSize: 11, color: '#00C853', fontWeight: '600', marginBottom: 2 },
  dateValue: { fontSize: 14, fontWeight: '500', color: '#333' },
  venueCard: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#f0f0f0', marginBottom: 8, backgroundColor: '#fff' },
  venueCardSelected: { borderColor: '#00C853', backgroundColor: '#F0FDF4' },
  venueImage: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#eee' },
  venueName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  venueAddress: { fontSize: 12, color: '#888', marginTop: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#00C853', borderColor: '#00C853' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  createButton: { backgroundColor: '#00C853', borderRadius: 12, height: 50, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#5d806aff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalDoneButton: {
    marginTop: 12,
    backgroundColor: '#00C853',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalDoneText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});