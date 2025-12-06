import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

import { venueApi } from "@/api/venueApi";
import { CategoryCard } from "@/components/home/CategoryCard";
import { VenueCard } from "@/components/home/VenueCard";
import type { VenueListItem } from "@/types/venue";

const categories = [
  { key: "FOOTBALL", label: "Bóng đá", icon: require("@/assets/icons/football.png") },
  { key: "VOLLEYBALL", label: "Bóng chuyền", icon: require("@/assets/icons/volleyball.png") },
  { key: "BASKETBALL", label: "Bóng rổ", icon: require("@/assets/icons/basketball.png") },
  { key: "BADMINTON", label: "Cầu lông", icon: require("@/assets/icons/badminton.png") },
  { key: "TENNIS", label: "Tennis", icon: require("@/assets/icons/tennis.png") },
  { key: "PICKLEBALL", label: "Pickleball", icon: require("@/assets/icons/pickleball.png") },
];

const HEADER_PRIMARY = Colors.primary;

export default function HomeScreen() {
  const router = useRouter();
  const [venues, setVenues] = useState<VenueListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNearbyVenues = async () => {
      setLoading(true);
      setLocationError(null);

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("Location permission not granted");
          setLocationError("Không truy cập được vị trí, hiển thị tất cả sân.");
          const all = await venueApi.listVenues();
          setVenues(all);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;

        const nearby = await venueApi.listNearbyVenues(lat, lng, 10);
        setVenues(nearby);
      } catch (error) {
        console.error("Failed to load nearby venues", error);
        setLocationError("Có lỗi khi tải danh sách sân. Thử lại sau nhé.");
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyVenues();
  }, []);

  const handleOpenSearch = () => {
    router.push("/search");
  };

  const handlePressVenue = (venue: VenueListItem) => {
    router.push({
      pathname: "/venue/[id]",
      params: { id: venue.id },
    });
  };

  const handlePressCategory = (key: string) => {
    if (key === "PICKLEBALL") {
      router.push({
        pathname: "/",
        params: { q: "Pickleball" },
      });
    } else {
      router.push({
        pathname: "/search",
        params: { sport: key },
      });
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logoImage}
          />
          <Text style={styles.headerTitle}>
            Khám phá và đặt sân thể thao dễ dàng cùng{" "}
            <Text style={styles.headerTitleBold}>TechBo</Text>
          </Text>
        </View>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchWrapper}>
        <Pressable
          onPress={handleOpenSearch}
          style={({ pressed }) => [
            styles.searchBar,
            pressed && styles.searchBarPressed,
          ]}
        >
          <Ionicons
            name="search-outline"
            size={22}
            color="#999"
            style={styles.searchIcon}
          />
          <Text style={styles.searchPlaceholder}>
            Tìm sân theo tên, khu vực...
          </Text>
        </Pressable>
      </View>

      {/* CATEGORY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Môn thể thao phổ biến</Text>
        <Text style={styles.sectionSubtitle}>
          Chọn môn thể thao bạn muốn chơi hôm nay
        </Text>

        <View style={styles.categoryGrid}>
          {categories.map((c) => (
            <CategoryCard
              key={c.key}
              title={c.label}
              icon={c.icon}
              onPress={() => handlePressCategory(c.key)}
            />
          ))}
        </View>
      </View>

      {/* VENUES NEARBY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sân gần bạn</Text>
        <Text style={styles.sectionSubtitle}>
          Gợi ý những sân phù hợp để bạn đặt nhanh
        </Text>

        {loading ? (
          <ActivityIndicator
            color={Colors.primary}
            style={{ marginTop: 16 }}
          />
        ) : (
          <>
            {locationError ? (
              <Text style={styles.infoText}>{locationError}</Text>
            ) : null}

            {venues.map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                onPress={() => handlePressVenue(venue)}
              />
            ))}

            {!venues.length && !loading && (
              <Text style={styles.emptyText}>
                Hiện chưa có dữ liệu sân, thử lại sau nhé.
              </Text>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: HEADER_PRIMARY,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoImage: {
    width: 50,
    height: 50,
    marginRight: 10,
    resizeMode: "contain",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
  },
  headerTitleBold: {
    fontWeight: "bold",
    color: "#fff",
  },
  searchWrapper: {
    marginTop: -30,
    paddingHorizontal: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  searchBarPressed: {
    backgroundColor: "#f1f5f9",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: "#999",
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
  },
  sectionSubtitle: {
    marginTop: 4,
    marginBottom: 16,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  infoText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyText: {
    marginTop: 40,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
