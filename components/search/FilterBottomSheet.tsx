import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import type { Sport } from "@/types/venue";

const { height: screenHeight } = Dimensions.get("window");

const SPORTS: { key: Sport; label: string }[] = [
  { key: "FOOTBALL", label: "Bóng đá" },
  { key: "BADMINTON", label: "Cầu lông" },
  { key: "TENNIS", label: "Tennis" },
  { key: "BASKETBALL", label: "Bóng rổ" },
  { key: "VOLLEYBALL", label: "Bóng chuyền" },
];

const CITIES = [
  "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
  "Bình Dương", "Đồng Nai", "Khánh Hòa", "Hải Dương", "Thừa Thiên Huế",
];

const RADIUS_OPTIONS = [
  { value: 2, label: "2 km" },
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 15, label: "15 km" },
  { value: 20, label: "20 km" },
];

export interface VenueFilterValues {
  sport?: Sport;
  city?: string;
  radius?: number;
}

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: VenueFilterValues) => void;
  initialFilters?: VenueFilterValues;
}

export default function FilterBottomSheet({
  visible,
  onClose,
  onApplyFilters,
  initialFilters = {},
}: FilterBottomSheetProps) {
  const [sport, setSport] = useState<Sport | undefined>(initialFilters.sport);
  const [city, setCity] = useState<string>(initialFilters.city || "");
  const [radius, setRadius] = useState<number | undefined>(initialFilters.radius);

  useEffect(() => {
    if (visible) {
      setSport(initialFilters.sport);
      setCity(initialFilters.city || "");
      setRadius(initialFilters.radius);
    }
  }, [visible, initialFilters]);

  const handleReset = () => {
    setSport(undefined);
    setCity("");
    setRadius(undefined);
  };

  const handleApply = () => {
    onApplyFilters({
      sport,
      city: city || undefined,
      radius,
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (sport) count++;
    if (city.trim()) count++;
    if (radius != null) count++;
    return count;
  }, [sport, city, radius]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>

          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Bộ lọc tìm kiếm</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Đặt lại</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

            {/* SPORT */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Môn thể thao</Text>
              <View style={styles.optionsGrid}>
                {SPORTS.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.optionButton,
                      sport === item.key && styles.optionButtonActive,
                    ]}
                    onPress={() => setSport(sport === item.key ? undefined : item.key)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        sport === item.key && styles.optionTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* CITY */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thành phố</Text>
              <View style={styles.optionsGrid}>
                {CITIES.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.optionButton,
                      city === item && styles.optionButtonActive,
                    ]}
                    onPress={() => setCity(city === item ? "" : item)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        city === item && styles.optionTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* RADIUS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bán kính tìm kiếm</Text>
              <View style={styles.optionsGrid}>
                {RADIUS_OPTIONS.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.optionButton,
                      radius === item.value && styles.optionButtonActive,
                    ]}
                    onPress={() => setRadius(radius === item.value ? undefined : item.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        radius === item.value && styles.optionTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>
                {activeFiltersCount > 0
                  ? `Áp dụng bộ lọc (${activeFiltersCount})`
                  : "Áp dụng bộ lọc"}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: screenHeight * 0.85,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  closeButton: { padding: 4 },
  title: { fontSize: 16, fontWeight: "600", color: Colors.text },
  resetText: { color: Colors.primary, fontSize: 14, fontWeight: "500" },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: Colors.text, marginBottom: 12 },
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    minWidth: 80,
    alignItems: "center",
  },
  optionButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { fontSize: 13, color: Colors.text, fontWeight: "500" },
  optionTextActive: { color: Colors.white },
  footer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  applyButtonText: { color: Colors.white, fontSize: 15, fontWeight: "600" },
});
