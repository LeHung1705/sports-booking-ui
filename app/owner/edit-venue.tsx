import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "../../constants/Colors";
import { venueApi } from "../../api/venueApi";
import type { VenueDetail, VenueUpdateRequest } from "../../types/venue";
import CustomHeader from "@/components/ui/CustomHeader";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

export default function EditVenueScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [venueDetail, setVenueDetail] = useState<VenueDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  
  // Bank Info State
  const [bankBin, setBankBin] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");

  const [geocoding, setGeocoding] = useState(false);
  const placeholderImage = "https://via.placeholder.com/800x400.png?text=Venue+Image";

  // 1. Load chi tiết khi có ID
  useEffect(() => {
    const loadDetail = async (venueId: string) => {
      try {
        setLoadingDetail(true);
        const detail = await venueApi.getVenueDetail(venueId);
        setVenueDetail(detail);
        
        // Fill data vào form
        setName(detail.name || "");
        setPhone(detail.phone || "");
        setAddress(detail.address || "");
        setCity(detail.city || "");
        setDistrict(detail.district || "");
        setDescription(detail.description || "");
        setImageUrl(detail.imageUrl || "");
        setLatitude(detail.lat ?? null);
        setLongitude(detail.lng ?? null);

        // Fill bank info
        setBankBin(detail.bankBin || "");
        setBankName(detail.bankName || "");
        setBankAccountNumber(detail.bankAccountNumber || "");
        setBankAccountName(detail.bankAccountName || "");

      } catch (error) {
        console.error("Failed to load venue detail", error);
        Alert.alert("Lỗi", "Không tải được thông tin sân.");
      } finally {
        setLoadingDetail(false);
      }
    };

    if (id) {
      loadDetail(id);
    } else {
        Alert.alert("Lỗi", "Không tìm thấy thông tin sân cần chỉnh sửa.");
        router.back();
    }
  }, [id]);

  // 2. Hàm Save
  const handleSave = async () => {
    if (!id) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin sân.");
      return;
    }

    // Chuẩn bị payload gửi lên
    const payload: VenueUpdateRequest = {
      name: name?.trim(),
      phone: phone?.trim(),
      address: address?.trim(),
      city: city?.trim(),
      district: district?.trim(),
      description: description?.trim(),
      imageUrl: imageUrl?.trim(),
      lat: latitude ?? undefined,
      lng: longitude ?? undefined,
      bankBin: bankBin.trim(),
      bankName: bankName.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      bankAccountName: bankAccountName.trim(),
    };

    setSaving(true);
    try {
      await venueApi.updateVenue(id, payload);
      
      Alert.alert("Thành công", "Thông tin sân đã được cập nhật!", [
        { text: "OK", onPress: () => router.back() }
      ]);
      
    } catch (err: any) {
      console.error("Update venue failed", err);
      const msg = err?.response?.data?.message || "Không thể lưu thay đổi. Vui lòng thử lại.";
      Alert.alert("Lỗi Update", msg);
    } finally {
      setSaving(false);
    }
  };

  const currentCourts = useMemo(() => venueDetail?.courts || [], [venueDetail]);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Quyền truy cập ảnh", "Hãy cho phép truy cập thư viện ảnh để chọn banner.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      setImageUrl(result.assets[0].uri);
    }
  };

  const handleClearImage = () => {
    setImageUrl("");
  };

  const handleAddressChange = (val: string) => {
    setAddress(val);
    setLatitude(null);
    setLongitude(null);
  };

  const handleDistrictChange = (val: string) => {
    setDistrict(val);
    setLatitude(null);
    setLongitude(null);
  };

  const handleCityChange = (val: string) => {
    setCity(val);
    setLatitude(null);
    setLongitude(null);
  };

  const handleGeocodeAddress = async () => {
    const query = [address, district, city].filter(Boolean).join(", ");
    if (!query.trim()) {
      Alert.alert("Thiếu địa chỉ", "Hãy nhập địa chỉ, quận/huyện và thành phố trước khi lấy GPS.");
      return;
    }

    try {
      setGeocoding(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Cần quyền truy cập vị trí", "Hãy cho phép ứng dụng sử dụng dịch vụ vị trí để geocode địa chỉ.");
        return;
      }

      const results = await Location.geocodeAsync(query);
      if (!results.length) {
        Alert.alert("Không tìm thấy", "Không tìm được tọa độ cho địa chỉ này. Vui lòng kiểm tra lại.");
        return;
      }

      const { latitude: latValue, longitude: lngValue } = results[0];
      setLatitude(latValue);
      setLongitude(lngValue);
      Alert.alert("Đã lấy tọa độ", `Lat: ${latValue.toFixed(6)}
Lng: ${lngValue.toFixed(6)}`);
    } catch (error) {
      console.error("Geocode address failed", error);
      Alert.alert("Lỗi", "Không thể lấy tọa độ. Hãy thử lại sau.");
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <View style={styles.screen}>
      <CustomHeader title="Chỉnh sửa thông tin sân" showBackButton />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
            {loadingDetail ? (
                <View style={styles.centerRow}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.muted}>Đang tải chi tiết sân...</Text>
                </View>
            ) : (
                <>
                <LabeledInput label="Tên sân" value={name} onChangeText={setName} placeholder="Nhập tên sân" />
                <LabeledInput label="Số điện thoại" value={phone} onChangeText={setPhone} placeholder="Số liên hệ" keyboardType="phone-pad" />
                <LabeledInput label="Địa chỉ" value={address} onChangeText={handleAddressChange} placeholder="Số nhà, đường" />
                <View style={styles.inlineRow}>
                    <View style={styles.inlineHalf}>
                    <LabeledInput label="Quận/Huyện" value={district} onChangeText={handleDistrictChange} placeholder="VD: Quận 1" />
                    </View>
                    <View style={styles.inlineHalf}>
                    <LabeledInput label="Thành phố" value={city} onChangeText={handleCityChange} placeholder="VD: TP. HCM" />
                    </View>
                </View>
                <View style={styles.gpsRow}>
                    <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Tọa độ GPS</Text>
                    <Text style={styles.coordText}>
                        {latitude != null ? latitude.toFixed(6) : "--"} , {longitude != null ? longitude.toFixed(6) : "--"}
                    </Text>
                    <Text style={styles.helperText}>Nhập địa chỉ và bấm "Lấy GPS" để geocode.</Text>
                    </View>
                    <TouchableOpacity
                    style={[styles.geoBtn, geocoding && styles.geoBtnDisabled]}
                    onPress={handleGeocodeAddress}
                    disabled={geocoding}
                    activeOpacity={0.9}
                    >
                    {geocoding ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.geoBtnText}>Lấy GPS</Text>}
                    </TouchableOpacity>
                </View>
                <Text style={styles.label}>Ảnh đại diện</Text>
                <View style={styles.imageRow}>
                    <Image
                    source={{ uri: imageUrl || placeholderImage }}
                    style={styles.imagePreview}
                    />
                    <View style={{ flex: 1 }}>
                    <TouchableOpacity style={styles.pickBtn} onPress={handlePickImage}>
                        <Text style={styles.pickBtnText}>Chọn ảnh từ thư viện</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.clearBtn} onPress={handleClearImage}>
                        <Text style={styles.clearBtnText}>Xóa ảnh</Text>
                    </TouchableOpacity>
                    <Text style={styles.helperText}>Có thể dán URL hoặc chọn ảnh.</Text>
                    <View style={[styles.inputRowSoft, { marginTop: 8 }]}>
                        <TextInput
                        style={styles.input}
                        placeholder="https://..."
                        placeholderTextColor={Colors.textSecondary}
                        value={imageUrl}
                        onChangeText={setImageUrl}
                        autoCapitalize="none"
                        />
                    </View>
                    </View>
                </View>
                <LabeledInput
                    label="Mô tả ngắn"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Điểm mạnh, tiện ích, lưu ý cho khách"
                    multiline
                />
                </>
            )}
            </View>

            {/* Bank Info Section */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Thông tin ngân hàng</Text>
                <LabeledInput label="Mã BIN (e.g. 970422)" value={bankBin} onChangeText={setBankBin} keyboardType="number-pad" />
                <LabeledInput label="Tên ngân hàng" value={bankName} onChangeText={setBankName} />
                <LabeledInput label="Số tài khoản" value={bankAccountNumber} onChangeText={setBankAccountNumber} keyboardType="number-pad" />
                <LabeledInput label="Tên chủ tài khoản" value={bankAccountName} onChangeText={setBankAccountName} autoCapitalize="characters" />
            </View>

            <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Sân con & giá tham khảo</Text>
            {currentCourts.length === 0 ? (
                <Text style={styles.muted}>Chưa có sân con nào được khai báo.</Text>
            ) : (
                currentCourts.map((court) => (
                <View key={court.id} style={styles.courtRow}>
                    <View style={{ flex: 1 }}>
                    <Text style={styles.courtName}>{court.name}</Text>
                    <Text style={styles.courtMeta}>{court.sport || "SPORT"}</Text>
                    </View>
                    <View>
                    <Text style={styles.priceTag}>{court.pricePerHour?.toLocaleString("vi-VN") || "-"} đ/h</Text>
                    </View>
                </View>
                ))
            )}
            </View>

        </ScrollView>

        {/* Footer with Fixed Save Button */}
        <View style={styles.footerContainer}>
             <TouchableOpacity
                style={[styles.saveButton, (saving || loadingDetail) && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving || loadingDetail}
                activeOpacity={0.88}
                >
                {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveButtonText}>Lưu thay đổi</Text>}
            </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </View>
  );
}

interface LabeledInputProps {
  label: string;
  value: string;
  onChangeText: (val: string) => void;
  placeholder?: string;
  helperText?: string;
  keyboardType?: "default" | "number-pad" | "decimal-pad" | "numeric" | "email-address" | "phone-pad";
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}

function LabeledInput({ label, value, onChangeText, placeholder, helperText, keyboardType = "default", multiline, autoCapitalize }:
 LabeledInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRowSoft, multiline && styles.inputRowSoftTall]}>
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
        />
      </View>
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 10,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  imagePreview: {
    width: 110,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
  },
  pickBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pickBtnText: {
    color: "white",
    fontWeight: "700",
    textAlign: "center",
  },
  clearBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
    alignSelf: "flex-start",
  },
  clearBtnText: {
    color: "#475569",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 12,
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  muted: {
    color: Colors.textSecondary,
    marginTop: 6,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  inputRowSoft: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputRowSoftTall: {
    alignItems: "flex-start",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  inlineRow: {
    flexDirection: "row",
    gap: 12,
  },
  inlineHalf: {
    flex: 1,
  },
  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  coordText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  geoBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    minWidth: 110,
    alignItems: "center",
  },
  geoBtnDisabled: {
    opacity: 0.7,
  },
  geoBtnText: {
    color: Colors.white,
    fontWeight: "800",
  },
  courtRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  courtName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  courtMeta: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  priceTag: {
    fontWeight: "800",
    color: Colors.primary,
  },
  footerContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    // Removed marginTop since it's in footer
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
});
