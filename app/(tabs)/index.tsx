// app/(tabs)/index.tsx
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
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";

import { courtApi } from "../../api/courtApi";
import type { Court } from "../../types/Court";
import { CourtCard } from "../../components/common/CourtCard";
import { CategoryCard } from "../../components/home/CategoryCard";

const HEADER_PRIMARY = Colors.primary; 

const categories = [
  { key: "FOOTBALL", label: "Bóng đá" },
  { key: "VOLLEYBALL", label: "Bóng chuyền" },
  { key: "BASKETBALL", label: "Bóng rổ" },
  { key: "BADMINTON", label: "Cầu lông" },
  { key: "TENNIS",  label: "Tennis" },
  { key: "PICKLEBALL", label: "Pickleball" },
];

const iconMap: Record<string, any> = {
  FOOTBALL: require("@/assets/icon/football.svg"),
  VOLLEYBALL: require("@/assets/icon/volleyball.svg"),
  BASKETBALL: require("@/assets/icon/basketball.svg"),
  BADMINTON: require("@/assets/icon/badminton.svg"),
  TENNIS: require("@/assets/icon/tennis.svg"),
  PICKLEBALL: require("@/assets/icon/pickleball.svg"),
};

export default function HomeScreen() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCourts = async () => {
      setLoading(true);
      try {
        const data = await courtApi.getCourts();
        setCourts(data);
      } catch (error) {
        console.error("Failed to load courts", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourts();
  }, []);

  const handleSearchSubmit = () => {
    router.push({
      pathname: "/",
      params: { keyword },
    });
  };

  const handlePressCourt = (court: Court) => {
    router.push({
      pathname: "/court/[id]",
      params: { id: court.id },
    });
  };

  const handlePressCategory = (sportType: string) => {
    router.push({
      pathname: "/",
      params: { sportType },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logoImage}
          />
          <Text style={styles.headerTitle}>
            Khám phá và đặt sân thể thao dễ dàng cùng{" "}
            <Text style={styles.headerTitleBold}>TechBo</Text>
          </Text>
        </View>
      </View>

      {/* SEARCH BAR – chồng lên giữa phần xanh & trắng */}
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

      
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thể loại sân phổ biến</Text>
        <View style={styles.categoryGrid}>
          {categories.map((c) => (
            <CategoryCard
              key={c.key}
              icon={iconMap[c.key]}
              title={c.label}
              onPress={() => handlePressCategory(c.key)}
            />
          ))}
        </View>
      </View>

      {/* SECTION: Sân gần bạn */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sân gần bạn</Text>

        {loading ? (
          <ActivityIndicator
            color={Colors.primary}
            style={{ marginTop: 12 }}
          />
        ) : (
          <>
            {courts.map((court) => (
              <CourtCard
                key={court.id}
                court={court}
                onPress={() => handlePressCourt(court)}
              />
            ))}

            {!courts.length && (
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

  // ===== HEADER =====
  header: {
    backgroundColor: HEADER_PRIMARY,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60, // tạo khoảng cho thanh search chồng lên
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

  // ===== SEARCH BAR =====
  searchWrapper: {
    marginTop: -30, // đẩy lên chồng giữa header và body
    paddingHorizontal: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
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
    color: "#000",
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

  // ===== SECTION COMMON =====
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 16,
  },

  // ===== CATEGORY GRID =====
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },

  // ===== COURT LIST =====
  emptyText: {
    marginTop: 12,
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
});
