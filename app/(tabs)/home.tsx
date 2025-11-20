import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY = "#00A36C";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logoImage}
          />
          <Text style={styles.headerTitle}>
            Khám phá và đặt sân thể thao dễ dàng cùng{" "}
            <Text style={{ fontWeight: "bold" }}>TechBo</Text>
          </Text>
        </View>
      </View>

      {/* Thanh tìm kiếm giao giữa phần xanh & trắng */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Tìm kiếm sân, sự kiện, đội nhóm..."
            placeholderTextColor="#999"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Danh mục sân */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thể loại sân phổ biến</Text>
        <View style={styles.categoryGrid}>
          <CategoryCard icon="⚽" title="Bóng đá" />
          <CategoryCard icon="🏸" title="Cầu lông" />
          <CategoryCard icon="🎾" title="Tennis" />
          <CategoryCard icon="🏐" title="Bóng chuyền" />
          <CategoryCard icon="🏀" title="Bóng rổ" />
          <CategoryCard icon="🥅" title="Pickleball" />
        </View>
      </View>

      {/* Sân gần bạn */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sân gần bạn</Text>
        <VenueCard
          name="Sân bóng Thành Long"
          address="123 Nguyễn Văn Linh, Q.7"
          price="200.000đ/giờ"
          rating="4.8"
        />
        <VenueCard
          name="Sân tennis Phú Nhuận"
          address="456 Phan Xích Long, Phú Nhuận"
          price="150.000đ/giờ"
          rating="4.5"
        />
      </View>
    </ScrollView>
  );
}

function CategoryCard({ icon, title }: { icon: string; title: string }) {
  return (
    <TouchableOpacity style={styles.categoryCard}>
      <Text style={styles.categoryIcon}>{icon}</Text>
      <Text style={styles.categoryTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

function VenueCard({
  name,
  address,
  price,
  rating,
}: {
  name: string;
  address: string;
  price: string;
  rating: string;
}) {
  return (
    <TouchableOpacity style={styles.venueCard}>
      <View style={styles.venueImage}>
        <Text style={styles.venueImagePlaceholder}>🏟️</Text>
      </View>
      <View style={styles.venueInfo}>
        <Text style={styles.venueName}>{name}</Text>
        <Text style={styles.venueAddress}>{address}</Text>
        <View style={styles.venueFooter}>
          <Text style={styles.venuePrice}>{price}</Text>
          <Text style={styles.venueRating}>⭐ {rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  // ===== HEADER =====
  header: {
    backgroundColor: PRIMARY,
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
  },
  headerTitle: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
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
    width: 26,
    height: 26,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },

  // ===== CATEGORY =====
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
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  categoryCard: {
    width: "30%",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
  },

  // ===== VENUE =====
  venueCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  venueImage: {
    width: 80,
    height: 80,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  venueImagePlaceholder: {
    fontSize: 30,
  },
  venueInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  venueName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  venueAddress: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  venueFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  venuePrice: {
    fontSize: 13,
    fontWeight: "600",
    color: PRIMARY,
  },
  venueRating: {
    fontSize: 13,
    color: "#666",
  },
});
