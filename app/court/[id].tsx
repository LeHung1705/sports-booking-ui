// app/court/[id].tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { courtApi } from "@/api/courtApi";
import type { Court } from "../../types/Court";
import { Colors } from "@/constants/Colors";
// import { CourtGallery } from "@/components/court/CourtGallery";
// import { FacilityList } from "@/components/court/FacilityList";
// import { ReviewList } from "@/components/court/ReviewList";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function CourtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [court, setCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   if (!id) return;
  //   const fetchDetail = async () => {
  //     setLoading(true);
  //     try {
  //       const data = await courtApi.getCourtById(id);
  //       setCourt(data);
  //     } catch (error) {
  //       console.error("Failed to load court detail", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchDetail();
  // }, [id]);

  // const handleBook = () => {
  //   if (!court) return;
  //   router.push({
  //     pathname: "/booking/time-slot",
  //     params: { courtId: court.id },
  //   });
  // };

  // if (loading || !court) {
  //   return (
  //     <View style={styles.loadingWrap}>
  //       <ActivityIndicator color={Colors.primary} />
  //     </View>
  //   );
  // }

  // const priceText =
  //   court.maxPricePerHour && court.maxPricePerHour !== court.minPricePerHour
  //     ? `${court.minPricePerHour.toLocaleString()} - ${court.maxPricePerHour.toLocaleString()} đ/h`
  //     : `${court.minPricePerHour.toLocaleString()} đ/h`;

  // return (
  //   <View style={styles.root}>
  //     <ScrollView style={styles.container}>
  //       <CourtGallery images={court.images} />

  //       <View style={styles.content}>
  //         <View style={styles.headerRow}>
  //           <TouchableOpacity onPress={() => router.back()}>
  //             <Ionicons
  //               name="chevron-back"
  //               size={24}
  //               color={Colors.text}
  //             />
  //           </TouchableOpacity>
  //         </View>

  //         <Text style={styles.name}>{court.name}</Text>

  //         <View style={styles.row}>
  //           <View style={styles.ratingRow}>
  //             <Ionicons name="star" size={16} color="#ffcc00" />
  //             <Text style={styles.ratingText}>
  //               {court.ratingAvg.toFixed(1)} ({court.ratingCount} đánh giá)
  //             </Text>
  //           </View>
  //           {court.distanceKm != null && (
  //             <View style={styles.distanceRow}>
  //               <MaterialIcons
  //                 name="directions-walk"
  //                 size={14}
  //                 color={Colors.textSecondary}
  //                 style={{ marginRight: 4 }}
  //               />
  //               <Text style={styles.distance}>
  //                 {court.distanceKm.toFixed(1)} km
  //               </Text>
  //             </View>
  //           )}
  //         </View>

  //         <View style={styles.addressRow}>
  //           <Ionicons
  //             name="location-outline"
  //             size={16}
  //             color={Colors.textSecondary}
  //             style={{ marginRight: 4 }}
  //           />
  //           <Text style={styles.address}>{court.address}</Text>
  //         </View>

  //         <Text style={styles.price}>{priceText}</Text>

  //         <FacilityList facilities={court.facilities} />

  //         <ReviewList reviews={court.reviews} />

  //         <View style={{ height: 90 }} />
  //       </View>
  //     </ScrollView>

  //     <View style={styles.bottomBar}>
  //       <TouchableOpacity
  //         style={styles.bookBtn}
  //         onPress={handleBook}
  //         activeOpacity={0.85}
  //       >
  //         <Text style={styles.bookText}>Đặt sân ngay</Text>
  //       </TouchableOpacity>
  //     </View>
  //   </View>
  // );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  headerRow: {
    marginBottom: 8,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "600",
    marginLeft: 4,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  distance: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  address: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bookBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  bookText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
