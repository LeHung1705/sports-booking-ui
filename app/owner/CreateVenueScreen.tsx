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

// ⬇️ CHANGED: dùng apiClient chung thay vì axios + tự gắn token
import apiClient from '../../api/apiClient';

const CreateVenueScreen = () => {
  const navigation = useNavigation<any>();
  const router = useRouter(); // Dùng router của expo-router để push params dễ hơn
  // State Form
  const [name, setName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
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

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow access to location to get coordinates.');
        setIsLoadingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());
    } catch (error) {
      Alert.alert('Error', 'Could not fetch location.');
    } finally {
      setIsLoadingLocation(false);
    }
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

    setIsSubmitting(true);

    try {
      // Chuẩn bị dữ liệu gửi lên BE
      const payload = {
        name,
        address,
        district: "Thủ Đức", // tạm hard-code
        city: "Hồ Chí Minh",
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Venue</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

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
              placeholder="Street, City, Zip" 
              placeholderTextColor="#9CA3AF"
              value={address} onChangeText={setAddress}
            />
            <Ionicons name="location-sharp" size={20} color="#9CA3AF" style={styles.inputIcon} />
          </View>
        </View>

        {/* Location Coordinates */}
        <View style={styles.inputGroup}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
            <Text style={styles.label}>Location Coordinates</Text>
            <TouchableOpacity onPress={getCurrentLocation} disabled={isLoadingLocation} style={{flexDirection: 'row', alignItems: 'center'}}>
               <Ionicons name="locate" size={16} color={isLoadingLocation ? '#9CA3AF' : '#10B981'} />
               <Text style={{color: isLoadingLocation ? '#9CA3AF' : '#10B981', fontSize: 13, fontWeight: '600', marginLeft: 4}}>
                 {isLoadingLocation ? 'Locating...' : 'Get GPS'}
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
    backgroundColor: '#16A34A',
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
