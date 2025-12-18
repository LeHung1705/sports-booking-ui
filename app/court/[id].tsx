import { courtApi } from "@/api/courtApi";
import type { CourtDetail, CourtReview } from "@/types/court";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import CustomHeader from '@/components/ui/CustomHeader';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ReviewCard from "@/components/common/ReviewCard";

export default function CourtDetailScreen() {
  const router = useRouter();
  const { id, venueId } = useLocalSearchParams<{ id: string; venueId?: string }>();

  const [court, setCourt] = useState<CourtDetail | null>(null);
  const [reviews, setReviews] = useState<CourtReview[]>([]);
  const [loading, setLoading] = useState(true);

  const getSportLabel = (sportKey: string): string => {
    const sportMap: { [key: string]: string } = {
      FOOTBALL: "Bóng đá",
      VOLLEYBALL: "Bóng chuyền",
      BASKETBALL: "Bóng rổ",
      BADMINTON: "Cầu lông",
      TENNIS: "Tennis",
      PICKLEBALL: "Pickleball",
      TABLE_TENNIS: "Bóng bàn",
      SWIMMING: "Bơi lội",
      GYM: "Phòng gym",
      YOGA: "Yoga",
      MARTIAL_ARTS: "Võ thuật",
      OTHER: "Khác",
    };

    return sportMap[sportKey] || sportKey;
  };

  useEffect(() => {
    if (!id || !venueId) return;

    const load = async () => {
      try {
        const [courtRes, reviewsRes] = await Promise.all([
          courtApi.getCourtDetail(venueId, id),
          courtApi.getCourtReviews(id).catch(() => []),
        ]);

        setCourt(courtRes);
        setReviews(reviewsRes);
      } catch (e) {
        console.error("Load court detail failed", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, venueId]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.push("/");
  };

  const handleBookNow = () => {
    router.push({
        pathname: "/booking/schedule",
        params: { 
            venueId: venueId,
            courtId: court?.id,
            venueName: court?.name 
        }
    });
  };

  const avgRating = useMemo(() => {
    if (!reviews.length) return null;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  }, [reviews]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải thông tin sân...</Text>
      </View>
    );
  }

  if (!court) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không tìm thấy thông tin sân</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
          <Text style={styles.retryButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title={court.name} showBackButton={true} />

      <View style={styles.body}>
        {court.imageUrl ? (
          <Image source={{ uri: court.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.imagePlaceholderText}>Chưa có ảnh sân</Text>
          </View>
        )}

        <View style={styles.cardContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.mainCard}>
              <View style={styles.courtHeaderRow}>
                <Text style={styles.courtName}>{court.name}</Text>

                <View style={styles.courtRatingInline}>
                  <Ionicons
                    name="star"
                    size={18}
                    color={avgRating ? "#FFB800" : Colors.textSecondary}
                  />
                  {avgRating ? (
                    <>
                      <Text style={styles.ratingValue}>{avgRating.toFixed(1)}</Text>
                      <Text style={styles.ratingCount}>({reviews.length})</Text>
                    </>
                  ) : (
                    <Text style={styles.ratingEmpty}></Text>
                  )}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Môn thể thao</Text>
                    <Text style={styles.infoValue}>{getSportLabel(court.sport)}</Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Giá thuê</Text>
                    <Text style={styles.priceValue}>
                      {court.pricePerHour.toLocaleString()} đ/giờ
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Đánh giá</Text>
                {reviews.length > 0 && (
                  <Text style={styles.reviewCount}>{reviews.length} đánh giá</Text>
                )}
              </View>

              {!reviews.length ? (
                <View style={styles.emptyReviews}>
                  <Text style={styles.emptyReviewsText}>
                    Chưa có đánh giá cho sân này.
                  </Text>
                </View>
              ) : (
                <View style={styles.reviewsList}>
                  {reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.footerPriceLabel}>Chỉ từ</Text>
            <Text style={styles.footerPriceValue}>
              {court.pricePerHour.toLocaleString()} đ/giờ
            </Text>
          </View>
          <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
            <Text style={styles.bookButtonText}>Đặt sân ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const CARD_RADIUS = 28;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    marginTop: 16,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
    textAlign: "center",
    flex: 1,
  },
  headerRight: {
    width: 36,
  },
  body: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: 280,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card,
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  cardContainer: {
    flex: 1,
    marginTop: -CARD_RADIUS,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    backgroundColor: Colors.background,
    overflow: "hidden",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  mainCard: {
    backgroundColor: Colors.white,
    margin: 16,
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  courtHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  courtName: {
    flexShrink: 1,
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    marginRight: 8,
    lineHeight: 26,
  },
  courtRatingInline: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  ratingEmpty: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  reviewCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  emptyReviews: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyReviewsText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  reviewsList: {
    gap: 12,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceContainer: {
    flex: 1,
  },
  footerPriceLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  footerPriceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    minWidth: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  bookButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
