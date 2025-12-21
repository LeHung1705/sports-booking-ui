import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { venueApi } from "../../api/venueApi";
import { Colors } from "../../constants/Colors";
import { VenueDetail as ApiVenueDetail } from "../../types/venue";
import CustomHeader from "../../components/ui/CustomHeader";

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
  const { venueId } = useLocalSearchParams<{ venueId: string }>();

  // State hiển thị chi tiết
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    const loadDetail = async () => {
      if (!venueId) return;
      
      try {
        setLoading(true);
        console.log("Loading detail for:", venueId);
        const data = await venueApi.getVenueDetail(venueId);
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
  }, [venueId]);

  if (loading && !venue) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // UI khi chưa có sân hoặc lỗi
  if (!venue && !loading) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Chi tiết địa điểm" showBackButton />
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={60} color="#ccc" />
          <Text style={{marginTop: 10, color: '#666'}}>Không tìm thấy thông tin sân.</Text>
        </View>
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
      <CustomHeader 
        title={venue?.name || "Chi tiết địa điểm"} 
        showBackButton 
        rightIcon={
            <TouchableOpacity onPress={() => router.push({ pathname: '/owner/edit-venue', params: { id: venueId } })}>
                <Ionicons name="create-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
        }
      />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* HEADER IMAGE */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: venue?.imageUrl || "https://via.placeholder.com/400x300" }}
            style={styles.headerImage}
            resizeMode="cover"
          />
        </View>

        {/* INFO CONTAINER */}
        <View style={styles.infoContainer}>
          <Text style={styles.venueName}>{venue?.name}</Text>
          
          <View style={styles.ratingInfoRow}>
            <FontAwesome name="star" size={16} color={Colors.primary} />
            <Text style={styles.ratingText}>{venue?.avgRating ? venue.avgRating.toFixed(1) : "0.0"}</Text>
            <Text style={styles.reviewCountText}>({venue?.reviewCount || 0} reviews)</Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={18} color={Colors.primary} />
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Courts</Text>
            <TouchableOpacity 
              style={styles.addCourtBtn}
              onPress={() => router.push({ pathname: '/owner/add-court', params: { venueId: venueId } })}
            >
              <Ionicons name="add-circle" size={20} color={Colors.primary} />
              <Text style={styles.addCourtText}>Thêm sân</Text>
            </TouchableOpacity>
          </View>
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
        onPress={() => router.push({ pathname: '/owner/edit-venue', params: { id: venueId } })}
      >
        <Ionicons name="pencil" size={24} color="white" />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  imageContainer: { height: 250, width: "100%" },
  headerImage: { width: "100%", height: "100%" },

  // Info
  infoContainer: { padding: 20, backgroundColor: "white", borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24 },
  
  venueName: { fontSize: 24, fontWeight: "800", color: "#1E293B", marginBottom: 8 },
  ratingInfoRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  ratingText: { fontSize: 16, fontWeight: "bold", color: "#1E293B", marginHorizontal: 6 },
  reviewCountText: { fontSize: 14, color: "#64748B" },
  locationRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  addressText: { fontSize: 15, color: "#475569", marginLeft: 8, flex: 1, lineHeight: 22 },
  descriptionText: { fontSize: 14, color: "#64748B", lineHeight: 22 },
  readMoreText: { color: Colors.primary, fontWeight: "600", marginTop: 4 },
  
  divider: { height: 8, backgroundColor: "#F1F5F9" },
  sectionContainer: { padding: 20 },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 16 
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  addCourtBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addCourtText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 4,
  },
  emptyText: { color: "#94A3B8", fontStyle: "italic" },

  // Courts
  courtCard: { flexDirection: "row", backgroundColor: "white", borderRadius: 12, marginBottom: 16, padding: 12, borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  courtImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: "#E2E8F0" },
  courtInfo: { flex: 1, marginLeft: 12, justifyContent: "space-between" },
  courtName: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sportTag: { backgroundColor: "#E8F5E9", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  sportTagText: { fontSize: 11, color: Colors.primary, fontWeight: "700" },
  courtType: { fontSize: 12, color: "#94A3B8" },
  priceText: { fontSize: 16, fontWeight: "800", color: Colors.primary, alignSelf: "flex-end" },

  // Reviews
  reviewItem: { flexDirection: "row", marginBottom: 20 },
  avatarContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: "bold", color: Colors.primary },
  reviewContent: { flex: 1 },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  reviewerName: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  reviewDate: { fontSize: 12, color: "#94A3B8" },
  ratingRow: { flexDirection: "row", marginBottom: 6 },
  reviewComment: { fontSize: 14, color: "#475569", lineHeight: 20 },

  // FAB
  fab: { position: "absolute", bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center", shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
});
