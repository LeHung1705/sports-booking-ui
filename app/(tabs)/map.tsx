import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/constants/Colors";
import { venueApi } from "@/api/venueApi";
import type { VenueListItem } from "@/types/venue";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function MapScreen() {
  const router = useRouter();

  const [venues, setVenues] = useState<VenueListItem[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<VenueListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userRegion, setUserRegion] = useState<Region | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (mounted) {
            setLocationError("Không thể truy cập vị trí. Vui lòng cấp quyền trong cài đặt.");
          }
        } else {
          const loc = await Location.getCurrentPositionAsync({});
          if (mounted) {
            setUserRegion({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
        }

        const data = await venueApi.listVenues();
        if (mounted) {
          setVenues(data);
        }
      } catch (e) {
        console.error("Load map data failed", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const initialRegion: Region | undefined = useMemo(() => {
    if (userRegion) return userRegion;

    const v = venues.find((x) => x.lat != null && x.lng != null);
    if (v && v.lat != null && v.lng != null) {
      return {
        latitude: v.lat,
        longitude: v.lng,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }

    return {
      latitude: 10.776889,
      longitude: 106.700981,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [userRegion, venues]);

  const handleMarkerPress = useCallback((venue: VenueListItem) => {
    setSelectedVenue(venue);
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.push("/");
  };

  const handleOpenDirections = useCallback((venue: VenueListItem) => {
    if (venue.lat == null || venue.lng == null) return;

    const lat = venue.lat;
    const lng = venue.lng;
    const label = encodeURIComponent(venue.name);

    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?ll=${lat},${lng}&q=${label}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

    Linking.openURL(url).catch((err) => console.error("Open map failed", err));
  }, []);

  const handleViewDetail = useCallback(
    (venue: VenueListItem) => {
      router.push({
        pathname: "/venue/[id]",
        params: { id: venue.id },
      });
    },
    [router]
  );

  const formatPriceRange = useCallback((venue: VenueListItem) => {
    if (venue.minPrice == null) {
      return "Giá đang cập nhật";
    }

    if (venue.maxPrice && venue.maxPrice !== venue.minPrice) {
      return `${venue.minPrice.toLocaleString()} - ${venue.maxPrice.toLocaleString()} đ/giờ`;
    }

    return `${venue.minPrice.toLocaleString()} đ/giờ`;
  }, []);

  const handleRecenter = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Không thể truy cập vị trí. Vui lòng cấp quyền trong cài đặt.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setUserRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch (e) {
      console.error("Recenter failed", e);
    }
  }, []);

  if (loading || !initialRegion) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Bản đồ sân</Text>
          <Text style={styles.headerSubtitle}>Chạm vào điểm trên bản đồ để xem chi tiết</Text>
        </View>
        <TouchableOpacity onPress={handleRecenter} style={styles.gpsButton}>
          <Ionicons name="locate-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <VenuesMap
        region={userRegion || initialRegion}
        venues={venues}
        onMarkerPress={handleMarkerPress}
      />

      {locationError && (
        <View style={styles.locationWarning}>
          <Ionicons name="warning-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.locationWarningText}>{locationError}</Text>
          <TouchableOpacity onPress={() => Linking.openSettings()}>
            <Text style={styles.locationWarningLink}>Cài đặt</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedVenue && (
        <VenueBottomCard
          venue={selectedVenue}
          onClose={() => setSelectedVenue(null)}
          onOpenDirections={handleOpenDirections}
          onViewDetail={handleViewDetail}
          formatPriceRange={formatPriceRange}
        />
      )}
    </View>
  );
}

const VenuesMap = React.memo(
  ({
    region,
    venues,
    onMarkerPress,
  }: {
    region: Region;
    venues: VenueListItem[];
    onMarkerPress: (venue: VenueListItem) => void;
  }) => {
    const markers = useMemo(
      () =>
        venues
          .filter((v) => v.lat != null && v.lng != null)
          .map((v) => (
            <Marker
              key={v.id}
              coordinate={{ latitude: v.lat!, longitude: v.lng! }}
              onPress={() => onMarkerPress(v)}
              pinColor={Colors.primary}
            />
          )),
      [venues, onMarkerPress]
    );

    return (
      <MapView
        style={styles.map}
        initialRegion={region}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
        followsUserLocation={false}
        showsCompass
        toolbarEnabled={false}
      >
        {markers}
      </MapView>
    );
  },
  (prev, next) =>
    prev.region === next.region &&
    prev.venues === next.venues &&
    prev.onMarkerPress === next.onMarkerPress
);

const VenueBottomCard = React.memo(
  ({
    venue,
    onClose,
    onOpenDirections,
    onViewDetail,
    formatPriceRange,
  }: {
    venue: VenueListItem;
    onClose: () => void;
    onOpenDirections: (venue: VenueListItem) => void;
    onViewDetail: (venue: VenueListItem) => void;
    formatPriceRange: (venue: VenueListItem) => string;
  }) => {
    return (
      <View style={styles.bottomCard}>
        
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={18} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.bottomCardHandle} />

        <View style={styles.cardHeader}>
          <View style={styles.titleRatingRow}>
            <Text style={styles.venueName} numberOfLines={2}>
              {venue.name}
            </Text>

            {venue.avgRating != null && venue.avgRating > 0 ? (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.ratingText}>{venue.avgRating.toFixed(1)}</Text>
              </View>
            ) : (
              <Text style={styles.noRatingText}>Chưa có đánh giá</Text>
            )}
          </View>
        </View>

        <View style={styles.venueDetails}>
          {venue.imageUrl ? (
            <Image source={{ uri: venue.imageUrl }} style={styles.venueImage} resizeMode="cover" />
          ) : (
            <View style={[styles.venueImage, styles.imageFallback]}>
              <Ionicons name="image-outline" size={24} color={Colors.textSecondary} />
            </View>
          )}

          <View style={styles.venueInfo}>
            <View style={styles.addressContainer}>
              <Ionicons name="location-outline" size={18} color={Colors.primary} />
              <Text style={styles.venueAddress}>
                {venue.address}
                {venue.district ? `, ${venue.district}` : ""}
                {venue.city ? `, ${venue.city}` : ""}
              </Text>
            </View>
            {venue.phone && (
              <View style={styles.addressContainer}>
                <Ionicons name="call-outline" size={18} color={Colors.primary} />
                <Text style={styles.venueAddress}>{venue.phone}</Text>
              </View>
            )}
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Giá thuê</Text>
              <Text style={styles.priceText}>{formatPriceRange(venue)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.outlineButton]}
            onPress={() => onOpenDirections(venue)}
          >
            <Ionicons name="navigate-outline" size={18} color={Colors.primary} />
            <Text style={styles.actionOutlineText}>Chỉ đường</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => onViewDetail(venue)}
          >
            <Ionicons name="information-circle-outline" size={18} color={Colors.white} />
            <Text style={styles.actionPrimaryText}>Chi tiết sân</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 52 : (StatusBar.currentHeight || 0) + 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  headerTextWrap: {
    flex: 1,
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  gpsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  map: {
    flex: 1,
  },
  locationWarning: {
    position: "absolute",
    top: Platform.OS === "ios" ? 120 : (StatusBar.currentHeight || 0) + 70,
    left: 16,
    right: 16,
    borderRadius: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  locationWarningText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  locationWarningLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
  },
  bottomCard: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: SCREEN_HEIGHT * 0.45,
    paddingHorizontal: 16,
    paddingTop: 24, 
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
  },

  closeButton: {
    position: "absolute",
    top: 10,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    zIndex: 20,
  },
  bottomCardHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#DDD",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  titleRatingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  venueName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    lineHeight: 22,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  noRatingText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  venueDetails: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  venueImage: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: Colors.card,
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  venueInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 10,
  },
  venueAddress: {
    fontSize: 13,
    flex: 1,
    color: Colors.text,
    lineHeight: 20,
  },
  priceContainer: {
    backgroundColor: "rgba(74, 144, 226, 0.08)",
    padding: 10,
    borderRadius: 10,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  priceText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  outlineButton: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actionOutlineText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  actionPrimaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
  },
});
