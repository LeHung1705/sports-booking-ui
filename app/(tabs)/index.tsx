// app/(tabs)/index.tsx
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào! 👋</Text>
        <Text style={styles.subGreeting}>Tìm sân thể thao phù hợp với bạn</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thể loại sân phổ biến</Text>
        <View style={styles.categoryGrid}>
          <CategoryCard icon="⚽" title="Sân bóng đá" />
          <CategoryCard icon="🏀" title="Sân bóng rổ" />
          <CategoryCard icon="🎾" title="Sân tennis" />
          <CategoryCard icon="🏐" title="Sân cầu lông" />
        </View>
      </View>

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
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#007AFF",
    padding: 24,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subGreeting: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
  },
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
    fontSize: 32,
  },
  venueInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  venueName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  venueAddress: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  venueFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  venuePrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  venueRating: {
    fontSize: 14,
    color: "#666",
  },
});