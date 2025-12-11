import { venueApi } from "@/api/venueApi";
import CourtCard from "@/components/common/CourtCard";
import CustomHeader from "@/components/ui/CustomHeader";
import { Colors } from "@/constants/Colors";
import type { VenueDetail, VenueDetailCourtItem } from "@/types/venue";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function VenueDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const data = await venueApi.getVenueDetail(id);
        setVenue(data);
      } catch (e) {
        console.error("Load venue detail failed", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handlePressCourt = (court: VenueDetailCourtItem) => {
    router.push({
      pathname: "/booking/schedule",
      params: {
        venueId: id,
        courtId: court.id,
        venueName: venue?.name
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải thông tin sân...</Text>
      </View>
    );
  }

  if (!venue) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không tìm thấy thông tin sân</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title={venue.name} showBackButton={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {venue.imageUrl ? (
          <Image source={{ uri: venue.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image" size={32} color={Colors.textSecondary} />
            <Text style={styles.imagePlaceholderText}>Chưa có ảnh</Text>
          </View>
        )}

        <View style={styles.summaryCard}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{venue.name}</Text>

            <View style={styles.ratingInline}>
              <Ionicons
                name="star"
                size={16}
                color={venue.avgRating != null ? "#ffcc00" : Colors.textSecondary}
              />
              {venue.avgRating != null ? (
                <Text style={styles.ratingInlineText}>
                  {venue.avgRating.toFixed(1)}
                  {venue.reviewCount ? ` (${venue.reviewCount})` : ""}
                </Text>
              ) : (
                <Text style={styles.noRatingText}></Text>
              )}
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={18} color={Colors.primary} />
            <Text style={styles.infoValue}>
              {venue.address}
              {venue.district ? `, ${venue.district}` : ""}
              {venue.city ? `, ${venue.city}` : ""}
            </Text>
          </View>

          {venue.phone && (
            <View style={styles.infoItem}>
              <Ionicons name="call-outline" size={18} color={Colors.primary} />
              <Text style={styles.infoValue}>{venue.phone}</Text>
            </View>
          )}

          {venue.description && (
            <View style={styles.description}>
              <Text style={styles.descriptionTitle}>Giới thiệu</Text>
              <Text style={styles.descriptionText}>{venue.description}</Text>
            </View>
          )}

          {venue.courts.length > 0 && (
            <TouchableOpacity
                style={styles.bookButton}
                onPress={() => {
                    // Default to first court or handle logic to choose court
                    handlePressCourt(venue.courts[0]);
                }}
            >
                <Text style={styles.bookButtonText}>Đặt ngay</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <View style={styles.courtHeaderRow}>
              <Text style={styles.sectionTitle}>Các sân tại địa điểm</Text>
              <Text style={styles.courtCount}>{venue.courts.length} sân</Text>
            </View>

            {venue.courts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  Hiện chưa có sân nào đang hoạt động.
                </Text>
              </View>
            ) : (
              <FlatList
                data={venue.courts}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => (
                  <CourtCard court={item} onPress={() => handlePressCourt(item)} />
                )}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  loadingText: { color: Colors.textSecondary, fontSize: 13 },
  errorText: { color: Colors.textSecondary, fontSize: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  backButton: { padding: 4, marginRight: 8 },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  image: { width: "100%", height: 220 },
  imagePlaceholder: {
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: { color: Colors.textSecondary, fontSize: 12 },
  summaryCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: -20,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    flexShrink: 1,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginRight: 8,
  },
  ratingInline: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  ratingInlineText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    marginLeft: 4,
  },
  noRatingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  description: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  courtHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  courtCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  bookButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bookButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
