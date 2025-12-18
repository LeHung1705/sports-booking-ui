import React, { useCallback, useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ScrollView
} from "react-native";
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { venueApi } from "../../api/venueApi";
import { Colors } from "../../constants/Colors";
import CustomHeader from "@/components/ui/CustomHeader"; // Đảm bảo bạn có component này hoặc dùng View thay thế

// Interface cho Court
interface CourtItem {
  id: string;
  name: string;
  sport: string;
  imageUrl?: string;
  pricePerHour: number;
  isActive?: boolean;
}

// Interface cho Venue (để hiển thị thanh chọn)
interface VenueOption {
  id: string;
  name: string;
}

export default function CourtListScreen() {
  const router = useRouter();
  
  // Nhận venueId nếu được truyền từ trang khác (optional)
  const { venueId: initialVenueId } = useLocalSearchParams<{ venueId: string }>();

  // State
  const [myVenues, setMyVenues] = useState<VenueOption[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [courts, setCourts] = useState<CourtItem[]>([]);
  
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Load danh sách Venue của Owner (để tạo thanh chọn ngang)
  const fetchMyVenues = useCallback(async () => {
    try {
      setLoadingVenues(true);
      const data = await venueApi.listMyVenues();
      
      const mappedVenues = data.map(v => ({ id: v.id, name: v.name }));
      setMyVenues(mappedVenues);

      // Logic chọn Venue mặc định:
      // - Nếu có initialVenueId truyền vào -> Chọn nó
      // - Nếu không -> Chọn cái đầu tiên trong danh sách
      if (mappedVenues.length > 0) {
        if (initialVenueId && mappedVenues.find(v => v.id === initialVenueId)) {
          setSelectedVenueId(initialVenueId);
        } else if (!selectedVenueId) {
          setSelectedVenueId(mappedVenues[0].id);
        }
      }
    } catch (error) {
      console.error("Lỗi tải danh sách venue:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách sân của bạn.");
    } finally {
      setLoadingVenues(false);
    }
  }, [initialVenueId]);

  // 2. Load danh sách Court của Venue đang chọn
  const fetchCourts = useCallback(async () => {
    if (!selectedVenueId) return;

    try {
      if (!refreshing) setLoadingCourts(true);
      
      // Gọi API lấy chi tiết Venue (bao gồm cả courts)
      const detail = await venueApi.getVenueDetail(selectedVenueId);
      
      // Map dữ liệu từ backend về UI
      const mappedCourts = (detail.courts || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        sport: c.sport || "General",
        imageUrl: c.imageUrl,
        pricePerHour: c.pricePerHour,
        isActive: c.isActive
      }));

      setCourts(mappedCourts);
    } catch (error) {
      console.error("Lỗi tải courts:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách sân con.");
    } finally {
      setLoadingCourts(false);
      setRefreshing(false);
    }
  }, [selectedVenueId, refreshing]);

  // Effect: Load venues lần đầu
  useEffect(() => {
    fetchMyVenues();
  }, []);

  // Effect: Khi selectedVenueId thay đổi -> Load courts
  useFocusEffect(
    useCallback(() => {
      if (selectedVenueId) {
        fetchCourts();
      }
    }, [selectedVenueId])
  );

  // Xử lý refresh kéo xuống
  const onRefresh = () => {
    setRefreshing(true);
    fetchCourts();
  };

  // Render từng Card Court (Giống ảnh mẫu)
  const renderItem = ({ item }: { item: CourtItem }) => {
    const isActive = item.isActive !== false; // Mặc định true
    const statusText = isActive ? "ACTIVE" : "UNDER MAINTENANCE";
    const statusColor = isActive ? "#00C853" : "#FF6D00"; // Xanh lá / Cam

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => {
            // Logic khi bấm vào sân (VD: Sửa sân)
            // router.push({ pathname: '/owner/edit-court', params: { courtId: item.id } });
            Alert.alert("Thông tin sân", `Bạn đang chọn: ${item.name}`);
        }}
      >
        <View style={styles.cardContent}>
          {/* Trạng thái */}
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          
          {/* Tên sân */}
          <Text style={styles.courtName} numberOfLines={1}>{item.name}</Text>
          
          {/* Môn thể thao */}
          <Text style={styles.sportText}>{item.sport}</Text>
          
          {/* Giá tiền (Optional) */}
          <Text style={styles.priceText}>{item.pricePerHour?.toLocaleString()} đ/h</Text>
        </View>

        {/* Ảnh Sân */}
        <Image
          source={{ uri: item.imageUrl || "https://via.placeholder.com/150" }}
          style={styles.courtImage}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Header & Venue Selector */}
      <Stack.Screen options={{ headerShown: false }} />
      <CustomHeader title="Court Management" showBackButton />

      <View style={styles.filterContainer}>
        {loadingVenues ? (
            <ActivityIndicator size="small" color={Colors.primary} />
        ) : myVenues.length === 0 ? (
            <Text style={styles.noDataText}>Bạn chưa có Venue nào.</Text>
        ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                {myVenues.map((venue) => {
                    const isSelected = venue.id === selectedVenueId;
                    return (
                        <TouchableOpacity
                            key={venue.id}
                            style={[styles.chip, isSelected && styles.chipActive]}
                            onPress={() => setSelectedVenueId(venue.id)}
                        >
                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                                {venue.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        )}
      </View>

      {/* 2. Court List */}
      <View style={styles.listContainer}>
        {loadingCourts && !refreshing ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
            <FlatList
                data={courts}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="tennisball-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyText}>Venue này chưa có sân con nào.</Text>
                    </View>
                }
            />
        )}
      </View>

      {/* 3. FAB (Add Button) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => {
            if (!selectedVenueId) {
                Alert.alert("Lỗi", "Vui lòng chọn Venue trước khi thêm sân.");
                return;
            }
            router.push({
                pathname: "/owner/add-court",
                params: { venueId: selectedVenueId }
            });
        }}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Nền xám rất nhạt
  },
  // Filter Chips Styles
  filterContainer: {
    backgroundColor: "white",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: {
    backgroundColor: Colors.primary, // Hoặc màu xanh #00C853
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  chipTextActive: {
    color: "white",
  },
  noDataText: {
    marginLeft: 16,
    color: "#64748B",
    fontStyle: 'italic',
  },

  // List Styles
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Chừa chỗ cho FAB
  },
  
  // Card Styles (Giống mẫu)
  card: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  courtName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 4,
  },
  sportText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
    marginBottom: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  courtImage: {
    width: 90,
    height: 68,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: "#94A3B8",
    fontWeight: "500",
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#00C853", // Màu xanh lá giống ảnh mẫu
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00C853",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});