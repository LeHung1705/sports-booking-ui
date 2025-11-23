import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

import { venueApi } from "@/api/venueApi";
import type { VenueListItem } from "@/types/venue";
import { CategoryCard } from "@/components/home/CategoryCard";
import { VenueCard } from "@/components/home/VenueCard";

const categories = [
  {
    key: "FOOTBALL",
    label: "Bóng đá",
    icon: require("@/assets/icons/football.svg"),
  },
  {
    key: "VOLLEYBALL",
    label: "Bóng chuyền",
    icon: require("@/assets/icons/volleyball.svg"),
  },
  {
    key: "BASKETBALL",
    label: "Bóng rổ",
    icon: require("@/assets/icons/basketball.svg"),
  },
  {
    key: "BADMINTON",
    label: "Cầu lông",
    icon: require("@/assets/icons/badminton.svg"),
  },
  {
    key: "TENNIS",
    label: "Tennis",
    icon: require("@/assets/icons/tennis.svg"),
  },
  {
    key: "PICKLEBALL",
    label: "Pickleball",
    icon: require("@/assets/icons/pickleball.svg"),
  },
];

const HEADER_PRIMARY = Colors.primary;

export default function HomeScreen() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [venues, setVenues] = useState<VenueListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true);
      try {
        const data = await venueApi.listVenues();
        setVenues(data);
      } catch (error) {
        console.error("Failed to load venues", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, []);

  const handleSearchSubmit = () => {
    router.push({
      pathname: "/",
      params: { q: keyword },
    });
  };

  const handlePressVenue = (venue: VenueListItem) => {
    router.push({
      pathname: "/",
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
        pathname: "/",
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
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Tìm kiếm sân, sự kiện, đội nhóm..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={keyword}
            onChangeText={setKeyword}
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
          />
          <TouchableOpacity
            onPress={handleSearchSubmit}
            activeOpacity={0.8}
            style={styles.searchButton}
          >
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* CATEGORY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thể loại sân phổ biến</Text>
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

      {/* VENUES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sân gần bạn</Text>

        {loading ? (
          <ActivityIndicator
            color={Colors.primary}
            style={{ marginTop: 12 }}
          />
        ) : (
          <>
            {venues.map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                onPress={() => handlePressVenue(venue)}
              />
            ))}

            {!venues.length && (
              <Text style={styles.emptyText}>
                Hiện chưa có dữ liệu sân, thử lại sau.
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  searchButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
