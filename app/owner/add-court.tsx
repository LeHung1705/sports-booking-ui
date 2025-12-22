import CustomHeader from '@/components/ui/CustomHeader';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';
import apiClient from '../../api/apiClient';
import { courtApi, CourtCreateRequest } from '../../api/courtApi';
import { Colors } from '../../constants/Colors';

const sportOptions = [
  { key: 'tennis', label: 'Tennis', icon: 'tennisball-outline' },
  { key: 'basketball', label: 'Basketball', icon: 'basketball-outline' },
  { key: 'badminton', label: 'Badminton', icon: 'flash-outline' },
  { key: 'football', label: 'Bóng đá', icon: 'football-outline' },
  { key: 'volleyball', label: 'Bóng chuyền', icon: 'disc-outline' },
  { key: 'pickleball', label: 'Pickleball', icon: 'tennisball-outline' },
];

export default function AddCourtScreen() {
  const router = useRouter();
  
  // 1. Nhận venueId từ màn hình trước (nếu có)
  const params = useLocalSearchParams<{ venueId?: string }>();
  
  // State logic
  const [targetVenueId, setTargetVenueId] = useState<string | null>(params.venueId || null);
  const [venueList, setVenueList] = useState<any[]>([]);
  const [venueModalVisible, setVenueModalVisible] = useState(false);
  const [selectedVenueName, setSelectedVenueName] = useState<string>('');
  const [loadingVenues, setLoadingVenues] = useState(false);

  // Form State
  const [courtName, setCourtName] = useState('');
  const [selectedSport, setSelectedSport] = useState('football'); 
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. GỌI API LẤY DANH SÁCH VENUE (Code mới thêm)
  useEffect(() => {
    fetchMyVenues();
  }, []);

  const fetchMyVenues = async () => {
    setLoadingVenues(true);
    try {
      // Gọi API mà bạn vừa thêm vào Backend
      const res = await apiClient.get('/venues/my-venues');
      
      if (res.data) {
        setVenueList(res.data);
        
        // Logic hiển thị tên:
        // Nếu đã có ID truyền sang, tìm tên của nó để hiện lên ô input
        if (params.venueId) {
          const current = res.data.find((v: any) => v.id === params.venueId);
          if (current) setSelectedVenueName(current.name);
        }
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách Venue:", error);
      // Không chặn Alert lỗi ở đây để trải nghiệm mượt hơn
    } finally {
      setLoadingVenues(false);
    }
  };

  const handleSelectVenue = (venue: any) => {
    setTargetVenueId(venue.id);
    setSelectedVenueName(venue.name);
    setVenueModalVisible(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      setImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const handleSave = async () => {
    // Validate: Bắt buộc phải có Venue ID
    if (!targetVenueId) {
      Alert.alert("Chưa chọn Venue", "Vui lòng chọn Venue để thêm sân vào.");
      return;
    }

    if (!courtName.trim() || !price.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên sân và giá tiền.");
      return;
    }

    const priceNumber = Number(price.replace(/,/g, ''));
    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      Alert.alert('Giá không hợp lệ', 'Hãy nhập số > 0.');
      return;
    }

    const sportEnumMap: Record<string, string> = {
      tennis: 'TENNIS', basketball: 'BASKETBALL', badminton: 'BADMINTON',
      football: 'FOOTBALL', volleyball: 'VOLLEYBALL', pickleball: 'PICKLEBALL',
    };

    setIsSubmitting(true);
    try {
      let finalImageUrl = "";

      // 1. Upload Image First (if exists)
      if (images.length > 0) {
        console.log("📤 Uploading court image...");
        const localUri = images[0];
        const filename = localUri.split('/').pop() || "court_upload.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        const formData = new FormData();
        formData.append('file', { uri: localUri, name: filename, type } as any);

        const uploadRes = await apiClient.post('/upload/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (uploadRes.status === 200) {
          finalImageUrl = uploadRes.data;
          console.log("✅ Court image uploaded successfully:", finalImageUrl);
        } else {
          throw new Error("Failed to upload court image");
        }
      }

      const payload: CourtCreateRequest = {
        name: courtName.trim(),
        sport: sportEnumMap[selectedSport] ?? 'TENNIS',
        pricePerHour: priceNumber,
        isActive,
        imageUrl: finalImageUrl,
      };

      // Gọi API tạo sân
      await courtApi.createCourt(targetVenueId, payload);
      Alert.alert('Thành công', 'Đã thêm sân vào Venue!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error('Create court error:', err);
      const message = err?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
      Alert.alert('Lỗi', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Add Court" showBackButton />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            
            {/* --- Ô CHỌN VENUE (LOGIC MỚI) --- */}
        <Text style={styles.label}>Select Venue</Text>
        <TouchableOpacity 
            style={[styles.input, styles.dropdownInput]} 
            onPress={() => !params.venueId && setVenueModalVisible(true)} // Nếu có params thì không cho bấm
            disabled={!!params.venueId} 
        >
            <Text style={{ color: selectedVenueName ? '#111827' : '#9CA3AF', fontSize: 15 }}>
                {selectedVenueName || (loadingVenues ? "Đang tải danh sách..." : "Chọn Venue...")}
            </Text>
            {/* Nếu có params (bị khóa) thì hiện ổ khóa, không thì hiện mũi tên */}
            {!!params.venueId ? (
                <Ionicons name="lock-closed" size={18} color="#9CA3AF" />
            ) : (
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
            )}
        </TouchableOpacity>
        {/* ------------------------------- */}

        <Text style={[styles.label, { marginTop: 18 }]}>Court Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Sân 5 người - A"
          placeholderTextColor="#A0A6B4"
          value={courtName}
          onChangeText={setCourtName}
        />

        <Text style={[styles.label, { marginTop: 18 }]}>Sport Type</Text>
        <View style={styles.chipRow}>
          {sportOptions.map(option => {
            const active = selectedSport === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.85}
                onPress={() => setSelectedSport(option.key)}
              >
                <Ionicons name={option.icon as any} size={18} color={active ? Colors.white : '#0F9D58'} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { marginTop: 18 }]}>Court Photos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
          <TouchableOpacity style={styles.uploadBox} activeOpacity={0.85} onPress={pickImage}>
            <Ionicons name="cloud-upload-outline" size={22} color={Colors.primary} />
            <Text style={styles.uploadText}>Upload</Text>
          </TouchableOpacity>
          {images.map((uri, idx) => (
            <View key={uri + idx} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.deleteBadge} onPress={() => setImages(prev => prev.filter((_, i) => i !== idx))}>
                <Ionicons name="close" size={14} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <Text style={[styles.label, { marginTop: 18 }]}>Base Hourly Price</Text>
        <View style={styles.priceRow}>
          <View style={styles.priceInputWrapper}>
            <Text style={{ fontSize: 16, color: "#A0A6B4", marginRight: 6 }}>VND</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0"
              placeholderTextColor="#A0A6B4"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>
          <Text style={styles.priceSuffix}>/hr</Text>
        </View>

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Active Status</Text>
            <Text style={styles.switchHint}>Enable bookings for this court</Text>
          </View>
          <Switch value={isActive} onValueChange={setIsActive} thumbColor={Colors.white} trackColor={{ false: '#CBD5E1', true: Colors.primary }} />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.85} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.saveBtn, isSubmitting && {backgroundColor: '#88D8B0'}]} 
            activeOpacity={0.9} 
            onPress={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.saveText}>Save Court</Text>}
          </TouchableOpacity>
        </View>
      </View>

        {/* --- MODAL CHỌN VENUE --- */}
        <Modal visible={venueModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 15}}>
              <Text style={styles.modalTitle}>Chọn Venue của bạn</Text>
              <TouchableOpacity onPress={() => setVenueModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
                
            {venueList.length === 0 ? (
              <View style={{alignItems:'center', padding: 20}}>
                <Text style={{color: '#666', marginBottom: 10}}>Bạn chưa có Venue nào.</Text>
                <TouchableOpacity onPress={() => {setVenueModalVisible(false); router.push('/owner/CreateVenueScreen')}}>
                  <Text style={{color: Colors.primary, fontWeight:'bold'}}>+ Tạo Venue mới</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList 
                data={venueList}
                keyExtractor={(item) => item.id}
                renderItem={({item}) => (
                  <TouchableOpacity 
                    style={styles.venueItem}
                    onPress={() => handleSelectVenue(item)}
                  >
                    <View style={{width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2F1', alignItems:'center', justifyContent:'center'}}>
                      <Ionicons name="business" size={20} color={Colors.primary} />
                    </View>
                    <View style={{marginLeft: 12, flex: 1}}>
                      <Text style={styles.venueName}>{item.name}</Text>
                      <Text style={styles.venueAddress} numberOfLines={1}>{item.address}</Text>
                    </View>
                    {targetVenueId === item.id && (
                      <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
        </Modal>
        {/* ------------------------- */}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16 },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6 },
  label: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  input: { height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F6F8FB', paddingHorizontal: 14, fontSize: 15, color: '#111827' },
  dropdownInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  // Chip & Photo Styles
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 10, rowGap: 10, marginTop: 4 },
  chip: { flexBasis: '31%', maxWidth: '32%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 18, backgroundColor: '#EEF2F7', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { marginLeft: 6, fontSize: 14, color: '#1F2937', fontWeight: '600' },
  chipTextActive: { color: Colors.white },
  photoRow: { alignItems: 'center', gap: 12, paddingVertical: 6 },
  uploadBox: { width: 96, height: 96, borderRadius: 14, borderWidth: 1, borderColor: Colors.primary, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  uploadText: { marginTop: 6, fontSize: 12, fontWeight: '700', color: Colors.primary },
  imageWrapper: { position: 'relative', width: 96, height: 96, borderRadius: 14, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%', borderRadius: 14 },
  deleteBadge: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  
  // Price & Switch
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  priceInputWrapper: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F6F8FB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  priceInput: { flex: 1, fontSize: 15, color: '#111827' },
  priceSuffix: { marginLeft: 10, fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 },
  switchLabel: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  switchHint: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  
  // Actions
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 18 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#4B5563' },
  saveBtn: { flex: 1, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.24, shadowRadius: 12, elevation: 6 },
  saveText: { fontSize: 15, fontWeight: '800', color: Colors.white },

  // --- Modal Styles ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '50%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  venueItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  venueName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  venueAddress: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  closeModalBtn: { marginTop: 20, backgroundColor: '#F3F4F6', padding: 12, borderRadius: 10, alignItems: 'center' },
  closeModalText: { fontWeight: 'bold', color: '#4B5563' }
});