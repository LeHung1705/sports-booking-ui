import { courtApi } from "@/api/courtApi";
import type { CourtDetail } from "@/types/court";
import { Colors } from "@/constants/Colors";
import CustomHeader from "@/components/ui/CustomHeader";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CourtDetailScreen() {
  const router = useRouter();
  const { id, venueId } = useLocalSearchParams<{ id: string; venueId?: string }>();

  const [court, setCourt] = useState<CourtDetail | null>(null);
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
        const courtRes = await courtApi.getCourtDetail(venueId, id);
        setCourt(courtRes);
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