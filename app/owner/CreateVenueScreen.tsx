// app/screens/CreateVenueScreen.tsx (đường dẫn chỉ ví dụ)
// ❗ Nếu file bạn nằm thư mục khác, nhớ chỉnh lại đường dẫn import apiClient cho đúng

import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image,
  Platform, SafeAreaView, Alert, ActivityIndicator, Modal 
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location'; 
import DateTimePicker from '@react-native-community/datetimepicker'; 
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import CustomHeader from '@/components/ui/CustomHeader';

// Lấy API key từ env (Expo: thêm EXPO_PUBLIC_GOOGLE_MAPS_API_KEY vào app config)
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// ⬇️ CHANGED: dùng apiClient chung thay vì axios + tự gắn token
import apiClient from '../../api/apiClient';

const CreateVenueScreen = () => {
  const navigation = useNavigation<any>();
  const router = useRouter(); // Dùng router của expo-router để push params dễ hơn
  // State Form
  const [name, setName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  // State Location
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // State Sport
  const [selectedSports, setSelectedSports] = useState<string[]>(['Football']);
  const availableSports: string[] = ['Football', 'Badminton', 'Tennis', 'Basketball', 'Swimming'];

  // ⬇️ CHANGED: bỏ ảnh placeholder test, bắt đầu bằng mảng rỗng
  const [images, setImages] = useState<string[]>([]);

  // State Time
  const [openTime, setOpenTime] = useState<Date>(new Date(new Date().setHours(8, 0, 0, 0))); 
  const [closeTime, setCloseTime] = useState<Date>(new Date(new Date().setHours(22, 0, 0, 0))); 
  const [activePicker, setActivePicker] = useState<'open' | 'close' | null>(null);
  
  // Loading khi gửi form
  const [isSubmitting, setIsSubmitting] = useState(false); 

  // --- HANDLERS ---

  // Geocode: ưu tiên OpenStreetMap (miễn phí), fallback Google (nếu có key), cuối cùng là Expo Location
  // Geocode: ưu tiên OpenStreetMap (miễn phí), fallback Google (nếu có key), cuối cùng là Expo Location
  // --- HÀM geocodeAddress ĐÃ ĐƯỢC NÂNG CẤP LOGIC ---
  // --- HÀM TÌM KIẾM ĐỊA CHỈ (Dùng OpenStreetMap - Miễn phí 100%) ---
  const geocodeAddress = async () => {
    // 1. Chuẩn hóa dữ liệu
    const nameText = name.trim();
    const addressText = address.trim();
    const districtText = district.trim();
    const cityText = city.trim();

    // Validate: Bắt buộc phải có (Tên HOẶC Địa chỉ) VÀ (Quận HOẶC Thành phố)
    if ((!addressText && !nameText) || (!districtText && !cityText)) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập "Tên sân/Địa chỉ" và "Quận/Thành phố".');
      return;
    }

    setIsLoadingLocation(true);

    // Hàm gọi API OpenStreetMap (Nominatim)
    const searchOSM = async (query: string) => {
      try {
        console.log("🌍 Đang tìm trên OpenStreetMap:", query);
        // limit=1: Lấy 1 kết quả chuẩn nhất
        // addressdetails=1: Lấy chi tiết
        const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
        
        const res = await fetch(osmUrl, {
          headers: { 
            // QUAN TRỌNG: Phải có User-Agent để không bị chặn
            'User-Agent': 'SportsBookingApp-StudentProject/1.0' 
          },
        });
        const data = await res.json();
        
        if (Array.isArray(data) && data.length > 0) {
          return data[0]; // Trả về kết quả đầu tiên
        }
      } catch (e) {
        console.warn("Lỗi tìm kiếm OSM:", e);
      }
      return null;
    };

    try {
      // Xin quyền vị trí (Vẫn cần để app hoạt động đúng chuẩn)
      await Location.requestForegroundPermissionsAsync();

      let result = null;
      let methodUsed = '';

      // --- BƯỚC 1: Tìm theo TÊN SÂN + QUẬN + TP (Chính xác nhất cho địa điểm công cộng) ---
      if (nameText) {
        const queryName = [nameText, districtText, cityText].filter(Boolean).join(', ');
        result = await searchOSM(queryName);
        if (result) methodUsed = 'Tên địa điểm';
      }

      // --- BƯỚC 2: Tìm theo ĐỊA CHỈ + QUẬN + TP (Nếu bước 1 không ra) ---
      if (!result && addressText) {
        const queryAddress = [addressText, districtText, cityText].filter(Boolean).join(', ');
        result = await searchOSM(queryAddress);
        if (result) methodUsed = 'Địa chỉ';
      }

      // --- BƯỚC 3: Tìm theo ĐƯỜNG + QUẬN + TP (Nếu số nhà bị sai) ---
      if (!result && addressText) {
         // Cố gắng loại bỏ số nhà, chỉ lấy tên đường
         // Ví dụ: "249 Đặng Văn Bi" -> lấy "Đặng Văn Bi"
         const streetOnly = addressText.replace(/^[0-9\/]+\s+/g, ''); 
         if (streetOnly !== addressText) {
             const queryStreet = [streetOnly, districtText, cityText].filter(Boolean).join(', ');
             result = await searchOSM(queryStreet);
             if (result) methodUsed = 'Tên đường (Tương đối)';
         }
      }

      // --- XỬ LÝ KẾT QUẢ ---
      if (result) {
        const lat = result.lat;
        const lng = result.lon; // OSM dùng 'lon' thay vì 'lng'
        
        setLatitude(lat);
        setLongitude(lng);

        console.log(`✅ Tìm thấy [${methodUsed}]:`, lat, lng);
        Alert.alert(
          `Thành công (${methodUsed})`, 
          `Địa điểm: ${result.display_name}\n\nLat: ${parseFloat(lat).toFixed(6)}\nLng: ${parseFloat(lng).toFixed(6)}`
        );
      } else {
        // --- BƯỚC CUỐI: Dùng Native Geocoder của điện thoại (Fallback) ---
        console.log("📱 Chuyển sang Native Geocoder...");
        const fallbackQuery = [addressText, districtText, cityText].filter(Boolean).join(', ');
        const nativeResults = await Location.geocodeAsync(fallbackQuery);
        
        if (nativeResults.length > 0) {
           const lat = nativeResults[0].latitude.toString();
           const lng = nativeResults[0].longitude.toString();
           setLatitude(lat);
           setLongitude(lng);
           Alert.alert("Kết quả (Thiết bị)", `Tìm thấy tọa độ tương đối.\nLat: ${lat}\nLng: ${lng}`);
        } else {
           Alert.alert("Thất bại", "Không tìm thấy địa điểm này. Hãy thử nhập tên phổ biến hơn (Ví dụ: Làng Thiếu Niên Thủ Đức).");
        }
      }

    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tìm kiếm.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Reset tọa độ khi người dùng đổi địa chỉ
  const handleAddressChange = (val: string) => {
    setAddress(val);
    setLatitude('');
    setLongitude('');
  };

  const handleCityChange = (val: string) => {
    setCity(val);
    setLatitude('');
    setLongitude('');
  };

  const handleDistrictChange = (val: string) => {
    setDistrict(val);
    setLatitude('');
    setLongitude('');
  };

  const onChangeTime = (event: any, selectedDate?: Date) => {
    if (event?.type === 'dismissed') {
      if (Platform.OS === 'android') setActivePicker(null);
      return;
    }
    if (selectedDate) {
      if (activePicker === 'open') setOpenTime(selectedDate);
      if (activePicker === 'close') setCloseTime(selectedDate);
    }
    if (Platform.OS === 'android') setActivePicker(null);
  };
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const toggleSport = (sport: string) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter(s => s !== sport));
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  // ⬇️ CHANGED: handleCreateVenue dùng apiClient, không tự lấy token nữa
  const handleCreateVenue = async () => {
    // 1. Validate
    if (!name || !address || !latitude || !longitude) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên, địa chỉ và lấy tọa độ GPS.");
      return;
    }

    // City/District optional? Bạn muốn lưu dữ liệu nhập, nên vẫn cho phép trống nhưng khuyến cáo
    if (!city || !district) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập City và District để lưu chính xác.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Chuẩn bị dữ liệu gửi lên BE
      const payload = {
        name,
        address,
        district,
        city,
        phone,
        description,
        imageUrl: images.length > 0 ? images[0] : "", 
        lat: parseFloat(latitude),
        lng: parseFloat(longitude),
        bankBin: "",
        bankName: "",
        bankAccountNumber: "",
        bankAccountName: "",
      };

      console.log("📤 CreateVenue payload:", payload);

      // apiClient có baseURL = http://192.168.0.23:8080/api/v1
      // và đã tự add Authorization: Bearer <accessToken>
      const response = await apiClient.post('/venues', payload);

      console.log("✅ CreateVenue response:", response.status, response.data);

      // 👇👇👇 THAY THẾ ĐOẠN IF CŨ BẰNG ĐOẠN NÀY 👇👇👇
      if (response.status === 201 || response.status === 200) {
        // 1. Lấy ID của Venue vừa tạo từ Backend trả về
        const newVenueId = response.data.id; 
        console.log("🚀 Created Venue ID:", newVenueId);

        // 2. Hiện thông báo hỏi người dùng
        Alert.alert(
          "Thành công", 
          "Đã tạo Venue mới! Bạn có muốn thêm sân (Court) cho Venue này ngay không?", 
          [
            { 
              text: "Để sau", 
              onPress: () => navigation.goBack(), // Quay về danh sách
              style: "cancel"
            },
            { 
              text: "Thêm Court ngay", 
              onPress: () => {
                // 3. Chuyển sang trang Add Court và GỬI KÈM venueId
                // Lưu ý: Đảm bảo file add-court.tsx nằm đúng đường dẫn này
                router.push({
                  pathname: '/owner/add-court',
                  params: { venueId: newVenueId }
                });
              } 
            }
          ]
        );
      } 
      // 👆👆👆 HẾT PHẦN BỔ SUNG 👆👆👆
      else {
        Alert.alert("Lỗi", `Server trả về status ${response.status}`);
      }

    } catch (error: any) {
      console.log("❌ API Error:", error?.response?.data || error.message);
      const message =
        error?.response?.data?.message ||
        "Có lỗi xảy ra khi kết nối server";
      Alert.alert("Thất bại", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader
        title="Create Venue"
        showBackButton
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Basic Info */}
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle" size={20} color="#10B981" />
          <Text style={styles.sectionTitle}>Basic Information</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Venue Name</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g., TechBo Downtown Arena" 
            placeholderTextColor="#9CA3AF"
            value={name} onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <View style={styles.inputContainer}>
            <TextInput 
              style={[styles.input, { flex: 1, marginBottom: 0 }]} 
              placeholder="Số nhà, đường, phường, quận, thành phố" 
              placeholderTextColor="#9CA3AF"
              value={address} onChangeText={handleAddressChange}
            />
            <Ionicons name="location-sharp" size={20} color="#9CA3AF" style={styles.inputIcon} />
          </View>
        </View>

        <View style={{flexDirection: 'row', gap: 12, marginBottom: 18}}>
          <View style={{flex: 1}}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Ho Chi Minh"
              placeholderTextColor="#9CA3AF"
              value={city}
              onChangeText={handleCityChange}
            />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.label}>District</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Thu Duc"
              placeholderTextColor="#9CA3AF"
              value={district}
              onChangeText={handleDistrictChange}
            />
          </View>
        </View>

        {/* Location Coordinates */}
        <View style={styles.inputGroup}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
            <Text style={styles.label}>Location Coordinates</Text>
            <TouchableOpacity onPress={geocodeAddress} disabled={isLoadingLocation} style={{flexDirection: 'row', alignItems: 'center'}}>
               <Ionicons name="locate" size={16} color={isLoadingLocation ? '#9CA3AF' : '#10B981'} />
               <Text style={{color: isLoadingLocation ? '#9CA3AF' : '#10B981', fontSize: 13, fontWeight: '600', marginLeft: 4}}>
                 {isLoadingLocation ? 'Geocoding...' : 'Lấy GPS từ địa chỉ'}
               </Text>
            </TouchableOpacity>
          </View>
          
          <View style={{flexDirection: 'row', gap: 12}}>
            <TextInput 
              style={[styles.input, {flex: 1, textAlign: 'center'}]} 
              placeholder="Latitude" 
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={latitude} onChangeText={setLatitude}
            />
            <TextInput 
              style={[styles.input, {flex: 1, textAlign: 'center'}]} 
              placeholder="Longitude" 
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={longitude} onChangeText={setLongitude}
            />
          </View>
          <Text style={styles.helperText}>Ô Address phải chứa: số nhà + tên đường, phường, quận, thành phố (ngăn cách dấu phẩy). City/District bên dưới chỉ để lưu DB.</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contact Phone</Text>
          <TextInput 
            style={styles.input} 
            placeholder="+1 555-0123" 
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={phone} onChangeText={setPhone}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput 
            style={styles.input} 
            placeholder="admin@venue.com" 
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            value={email} onChangeText={setEmail}
          />
        </View>

        <View style={styles.divider} />

        {/* Venue Details */}
        <View style={styles.sectionHeader}>
          <MaterialIcons name="description" size={20} color="#10B981" />
          <Text style={styles.sectionTitle}>Venue Details</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Describe the facilities, amenities..." 
            placeholderTextColor="#9CA3AF"
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
            value={description} onChangeText={setDescription}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Available Sport Types</Text>
          <View style={styles.chipContainer}>
            {availableSports.map((sport) => {
              const isSelected = selectedSports.includes(sport);
              return (
                <TouchableOpacity 
                  key={sport} 
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleSport(sport)}
                >
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color="#10B981"
                      style={{marginRight: 4}}
                    />
                  )}
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {sport}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.addChip}>
              <Ionicons name="add" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Photos */}
        <View style={styles.sectionHeader}>
          <Ionicons name="images" size={20} color="#10B981" />
          <Text style={styles.sectionTitle}>Venue Photos</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoContainer}>
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            <View style={styles.uploadIconCircle}>
              <Ionicons name="cloud-upload-outline" size={24} color="#10B981" />
            </View>
            <Text style={styles.uploadText}>Upload</Text>
          </TouchableOpacity>

          {images.map((img, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri: img }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.deleteImageBtn}
                onPress={() => {
                  const newImages = [...images];
                  newImages.splice(index, 1);
                  setImages(newImages);
                }}
              >
                <Ionicons name="close" size={12} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        <Text style={styles.helperText}>Supported formats: JPG, PNG. Max 5 images.</Text>

        <View style={styles.divider} />

        {/* Operating Hours */}
        <View style={styles.sectionHeader}>
          <Ionicons name="time" size={20} color="#10B981" />
          <Text style={styles.sectionTitle}>Operating Hours</Text>
        </View>
        
        <View style={styles.timeContainer}>
          <View style={styles.timeInputWrapper}>
            <Text style={styles.label}>Opening Time</Text>
            <TouchableOpacity 
              style={styles.dropdownInput} 
              onPress={() => setActivePicker('open')}
              activeOpacity={0.7}
            >
              <Text style={styles.inputText}>{formatTime(openTime)}</Text>
              <Ionicons name="chevron-down" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.timeInputWrapper}>
            <Text style={styles.label}>Closing Time</Text>
            <TouchableOpacity 
              style={styles.dropdownInput} 
              onPress={() => setActivePicker('close')}
              activeOpacity={0.7}
            >
              <Text style={styles.inputText}>{formatTime(closeTime)}</Text>
              <Ionicons name="chevron-down" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {activePicker && (
          Platform.OS === 'ios' ? (
            <Modal
              transparent
              animationType="fade"
              visible={!!activePicker}
              onRequestClose={() => setActivePicker(null)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {activePicker === 'open' ? 'Opening time' : 'Closing time'}
                    </Text>
                    <TouchableOpacity onPress={() => setActivePicker(null)}>
                      <Ionicons name="close" size={20} color="#111827" />
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    testID={`${activePicker}TimePicker`}
                    value={activePicker === 'open' ? openTime : closeTime}
                    mode="time"
                    is24Hour
                    display="spinner"
                    onChange={onChangeTime}
                    style={{ alignSelf: 'stretch' }}
                  />
                  <TouchableOpacity style={styles.modalDoneButton} onPress={() => setActivePicker(null)}>
                    <Text style={styles.modalDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              testID={`${activePicker}TimePicker`}
              value={activePicker === 'open' ? openTime : closeTime}
              mode="time"
              is24Hour
              display="default"
              onChange={onChangeTime}
            />
          )
        )}

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && {backgroundColor: '#6EE7B7'}]} 
          onPress={handleCreateVenue}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Create Venue</Text>
          )}
        </TouchableOpacity>

        <View style={{height: 40}} /> 
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  cancelText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#808854ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  divider: {
    height: 4, 
    backgroundColor: '#F3F4F6',
    marginVertical: 20,
    marginHorizontal: -16, 
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: '#ECFDF5', 
    borderWidth: 1,
    borderColor: '#10B981',
  },
  chipText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#10B981',
  },
  addChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed'
  },
  photoContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  uploadBox: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
    borderStyle: 'dashed',
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  uploadIconCircle: {
    backgroundColor: '#DCFCE7',
    padding: 8,
    borderRadius: 20,
    marginBottom: 6
  },
  uploadText: {
    fontSize: 13,
    color: '#16A34A',
    fontWeight: '600',
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deleteImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 16
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12, 
  },
  timeInputWrapper: {
    flex: 1, 
  },
  dropdownInput: {
    backgroundColor: '#F9FAFB', 
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
    fontSize: 15,
    color: '#0B1224',
    fontWeight: '600',
  },
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
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalDoneText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  submitButton: {
    backgroundColor: '#10B981', 
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5
  },
  submitButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold'
  }
});

export default CreateVenueScreen;
