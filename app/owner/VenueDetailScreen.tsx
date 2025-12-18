import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { venueApi } from "../../api/venueApi";
import { Colors } from "../../constants/Colors";
import { VenueDetail as ApiVenueDetail } from "../../types/venue";

interface Court {
  id: string;
  name: string;
  sport: string;
  pricePerHour: number;
  imageUrl?: string;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

type VenueDetail = ApiVenueDetail & {
  courts?: Court[];
  reviews?: Review[];
};

export default function VenueDetailScreen() {
  const router = useRouter();
  const { venueId: paramVenueId } = useLocalSearchParams<{ venueId: string }>();
  
  // State quản lý danh sách sân để chọn
  const [myVenues, setMyVenues] = useState<{id: string, name: string}[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // State hiển thị chi tiết
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // 1. Khởi tạo: Load danh sách sân & Xác định sân hiển thị đầu tiên
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        // Lấy danh sách sân của Owner
        // @ts-ignore
        const list = await venueApi.listMyVenues();
        setMyVenues(list);

        // Xác định ID nào sẽ được chọn ban đầu
        if (paramVenueId) {
            setSelectedId(paramVenueId);
        } else if (list.length > 0) {
            setSelectedId(list[0].id); // Mặc định chọn cái đầu tiên
        } else {
            setLoading(false); // Không có sân nào
        }
      } catch (error) {
        console.error("Init failed", error);
        setLoading(false);
      }
    };
    initData();
  }, [paramVenueId]);

  // 2. Khi selectedId thay đổi -> Gọi API lấy chi tiết sân đó
  useEffect(() => {
    const loadDetail = async () => {
      if (!selectedId) return;
      
      try {
        setLoading(true);
        console.log("Loading detail for:", selectedId);
        const data = await venueApi.getVenueDetail(selectedId);
        const mapped: VenueDetail = {
          ...data,
          courts: (data as any).courts || [],
          reviews: (data as any).reviews || [],
        };
        setVenue(mapped);
      } catch (error) {
        Alert.alert("Lỗi", "Không tải được thông tin sân.");
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [selectedId]);

  if (loading && !venue) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // UI khi chưa có sân
  if (!venue && !loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#ccc" />
        <Text style={{marginTop: 10, color: '#666'}}>Bạn chưa có sân nào.</Text>
        <TouchableOpacity 
            style={[styles.fab, { position: 'relative', marginTop: 20, right: 0, bottom: 0 }]}
            onPress={() => router.push('/owner/create-venue' as any)}
        >
            <Text style={{color: 'white', fontWeight: 'bold'}}>Tạo sân mới</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Helper Render Sao ---
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesome
          key={i}
          name={i <= rating ? "star" : "star-o"}
          size={14}
          color="#FFC107"
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View style={styles.ratingRow}>{stars}</View>;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* HEADER IMAGE */}
        <View style={styles.headerContainer}>
          <Image
            source={{ uri: venue?.imageUrl || "https://via.placeholder.com/400x300" }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <View style={styles.headerOverlay} />
          
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => router.push('/owner/edit-venue')} // Quick Edit
            >
              <Ionicons name="pencil" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* INFO CONTAINER */}
        <View style={styles.infoContainer}>
          
          {/* 🔥 NEW: VENUE SELECTOR (Thanh chọn ngang) */}
          {myVenues.length > 1 && (
              <View style={styles.selectorWrapper}>
                  <Text style={styles.selectorLabel}>Chọn sân xem trước:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                      {myVenues.map(v => {
                          const isActive = v.id === selectedId;
                          return (
                              <TouchableOpacity 
                                  key={v.id} 
                                  style={[styles.chip, isActive && styles.chipActive]}
                                  onPress={() => setSelectedId(v.id)}
                              >
                                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                                      {v.name}
                                  </Text>
                              </TouchableOpacity>
                          )
                      })}
                  </ScrollView>
              </View>
          )}

          <Text style={styles.venueName}>{venue?.name}</Text>
          
          <View style={styles.ratingInfoRow}>
            <FontAwesome name="star" size={16} color="#00C853" />
            <Text style={styles.ratingText}>{venue?.avgRating ? venue.avgRating.toFixed(1) : "0.0"}</Text>
            <Text style={styles.reviewCountText}>({venue?.reviewCount || 0} reviews)</Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={18} color="#00C853" />
            <Text style={styles.addressText} numberOfLines={2}>
              {venue?.address}, {venue?.district}, {venue?.city}
            </Text>
          </View>

          <Text style={styles.descriptionText} numberOfLines={showFullDesc ? undefined : 3}>
            {venue?.description || "Chưa có mô tả cho sân này."}
          </Text>
          {venue?.description && venue.description.length > 100 && (
            <TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)}>
              <Text style={styles.readMoreText}>{showFullDesc ? "Thu gọn" : "Read more"}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider} />

        {/* COURTS SECTION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Available Courts</Text>
          {venue?.courts && venue.courts.length > 0 ? (
            venue.courts.map((court) => (
              <View key={court.id} style={styles.courtCard}>
                <Image
                  source={{ uri: court.imageUrl || "https://via.placeholder.com/100" }}
                  style={styles.courtImage}
                />
                <View style={styles.courtInfo}>
                  <Text style={styles.courtName}>{court.name}</Text>
                  <View style={styles.tagRow}>
                    <View style={styles.sportTag}>
                        <Text style={styles.sportTagText}>{court.sport || "General"}</Text>
                    </View>
                    <Text style={styles.courtType}>Standard</Text>
                  </View>
                  <Text style={styles.priceText}>
                    {court.pricePerHour?.toLocaleString("vi-VN")} đ/h
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Chưa có sân con nào.</Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* REVIEWS SECTION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>User Reviews</Text>
          {venue?.reviews && venue.reviews.length > 0 ? (
            venue.reviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{review.userName ? review.userName.charAt(0) : "U"}</Text>
                </View>
                <View style={styles.reviewContent}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.userName || "Người dùng"}</Text>
                    <Text style={styles.reviewDate}>
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                    </Text>
                  </View>
                  {renderStars(review.rating || 5)}
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Chưa có đánh giá nào.</Text>
          )}
        </View>

      </ScrollView>

      {/* FAB BUTTON */}
      <TouchableOpacity 
        style={styles.fab}
        activeOpacity={0.9}
        onPress={() => router.push('/owner/edit-venue')} // Có thể update logic để truyền ID nếu muốn edit đúng sân đang chọn
      >
        <Ionicons name="pencil" size={24} color="white" />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  // Header
  headerContainer: { height: 250, width: "100%", position: "relative" },
  headerImage: { width: "100%", height: "100%" },
  headerOverlay: { position: "absolute", top: 0, left: 0, right: 0, height: 80, backgroundColor: "rgba(0,0,0,0.3)" },
  topBar: { position: "absolute", top: Platform.OS === 'ios' ? 44 : 20, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" },

  // Info
  infoContainer: { padding: 20, backgroundColor: "white", borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24 },
  
  // Selector Styles
  selectorWrapper: { marginBottom: 16 },
  selectorLabel: { fontSize: 12, color: '#64748B', marginBottom: 8, fontWeight: '600' },
  chipsScroll: { flexDirection: 'row' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F1F5F9', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  chipTextActive: { color: 'white', fontWeight: '700' },

  venueName: { fontSize: 24, fontWeight: "800", color: "#1E293B", marginBottom: 8 },
  ratingInfoRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  ratingText: { fontSize: 16, fontWeight: "bold", color: "#1E293B", marginHorizontal: 6 },
  reviewCountText: { fontSize: 14, color: "#64748B" },
  locationRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  addressText: { fontSize: 15, color: "#475569", marginLeft: 8, flex: 1, lineHeight: 22 },
  descriptionText: { fontSize: 14, color: "#64748B", lineHeight: 22 },
  readMoreText: { color: "#00C853", fontWeight: "600", marginTop: 4 },
  
  divider: { height: 8, backgroundColor: "#F1F5F9" },
  sectionContainer: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B", marginBottom: 16 },
  emptyText: { color: "#94A3B8", fontStyle: "italic" },

  // Courts
  courtCard: { flexDirection: "row", backgroundColor: "white", borderRadius: 12, marginBottom: 16, padding: 12, borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  courtImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: "#E2E8F0" },
  courtInfo: { flex: 1, marginLeft: 12, justifyContent: "space-between" },
  courtName: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sportTag: { backgroundColor: "#E8F5E9", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  sportTagText: { fontSize: 11, color: "#00C853", fontWeight: "700" },
  courtType: { fontSize: 12, color: "#94A3B8" },
  priceText: { fontSize: 16, fontWeight: "800", color: "#00C853", alignSelf: "flex-end" },

  // Reviews
  reviewItem: { flexDirection: "row", marginBottom: 20 },
  avatarContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFD54F", justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: "bold", color: "#5D4037" },
  reviewContent: { flex: 1 },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  reviewerName: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  reviewDate: { fontSize: 12, color: "#94A3B8" },
  ratingRow: { flexDirection: "row", marginBottom: 6 },
  reviewComment: { fontSize: 14, color: "#475569", lineHeight: 20 },

  // FAB
  fab: { position: "absolute", bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: "#00C853", justifyContent: "center", alignItems: "center", shadowColor: "#00C853", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
});