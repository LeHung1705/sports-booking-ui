import { venueApi } from "@/api/venueApi";
import { VenueCard } from "@/components/home/VenueCard";
import FilterBottomSheet from "@/components/search/FilterBottomSheet";
import { Colors } from "@/constants/Colors";
import type { Sport, VenueListItem, VenueListRequest } from "@/types/venue";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SPORTS: { key: Sport; label: string }[] = [
  { key: "FOOTBALL", label: "Bóng đá" },
  { key: "BADMINTON", label: "Cầu lông" },
  { key: "TENNIS", label: "Tennis" },
  { key: "BASKETBALL", label: "Bóng rổ" },
  { key: "VOLLEYBALL", label: "Bóng chuyền" },
];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    q?: string;
    sport?: Sport;
    city?: string;
  }>();

  const [searchQuery, setSearchQuery] = useState(params.q || "");
  const [sport, setSport] = useState<Sport | undefined>(params.sport as Sport | undefined);
  const [city, setCity] = useState<string>(params.city || "");
  const [radius, setRadius] = useState<number>(5);
  const [venues, setVenues] = useState<VenueListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const loadData = useCallback(async (override?: Partial<VenueListRequest>) => {
    setLoading(true);
    try {
      const query: VenueListRequest = {
        q: override?.q ?? (searchQuery || undefined),
        sport: override?.sport ?? sport,
        city: override?.city ?? (city || undefined),
        radius: override?.radius ?? radius,
      };

      console.log("Search query:", query);
      const data = await venueApi.listVenues(query);
      setVenues(data);
    } catch (e) {
      console.error("Search venues failed", e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sport, city, radius]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleSubmit = () => {
    if (searchQuery.trim() || sport || city) {
      loadData({ q: searchQuery });
    }
  };

  const handlePressVenue = (venue: VenueListItem) => {
    router.push({
      pathname: "/venue/[id]",
      params: { id: venue.id },
    });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    loadData({ q: "" });
  };

  const handleClearAllFilters = () => {
    setSport(undefined);
    setCity("");
    setRadius(5);
    setSearchQuery("");
    loadData({ q: "", sport: undefined, city: undefined, radius: 5 });
  };

  const handleApplyFilters = (filters: { sport?: Sport; city?: string; radius: number }) => {
    setSport(filters.sport);
    setCity(filters.city || "");
    setRadius(filters.radius);
    setShowFilterSheet(false);
    loadData(filters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (sport) count++;
    if (city) count++;
    if (radius !== 5) count++;
    return count;
  };

  const getSportLabel = (sportKey: Sport) => {
    return SPORTS.find(s => s.key === sportKey)?.label || sportKey;
  };

  // Kiểm tra có filter đang active không
  const hasActiveFilters = getActiveFiltersCount() > 0;

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: "Tìm kiếm sân",
        }} 
      />

      {/* HEADER SEARCH */}
      <View style={styles.searchHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.searchInputWrap}>
          <Ionicons
            name="search-outline"
            size={18}
            color={Colors.textSecondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm sân theo tên, khu vực..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSubmit}
            autoFocus={!params.q}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          {searchQuery ? (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : null}

          {/* Icon bộ lọc bên trong search bar - như trong design */}
          <View style={styles.filterDivider} />
          <TouchableOpacity 
            style={[
              styles.filterIconButton,
              hasActiveFilters && styles.filterIconButtonActive
            ]}
            onPress={() => setShowFilterSheet(true)}
          >
            <Ionicons 
              name="options-outline" 
              size={16} 
              color={hasActiveFilters ? Colors.primary : Colors.textSecondary} 
            />
            {hasActiveFilters && (
              <View style={styles.filterIconBadge}>
                <Text style={styles.filterIconBadgeText}>{getActiveFiltersCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* FILTER BAR - Chỉ hiển thị khi có filter active */}
      {hasActiveFilters && (
        <View style={styles.filterBar}>
          <View style={styles.filterLeft}>
            <Text style={styles.activeFiltersLabel}>Bộ lọc đang áp dụng:</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[
                ...(sport ? [{ type: 'sport', value: sport }] : []),
                ...(city ? [{ type: 'city', value: city }] : []),
                ...(radius !== 5 ? [{ type: 'radius', value: radius }] : []),
              ]}
              keyExtractor={(item) => `${item.type}-${item.value}`}
              renderItem={({ item }) => (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterText}>
                    {item.type === 'sport' ? getSportLabel(item.value as Sport) : 
                     item.type === 'city' ? item.value : 
                     `${item.value}km`}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => {
                      if (item.type === 'sport') setSport(undefined);
                      if (item.type === 'city') setCity("");
                      if (item.type === 'radius') setRadius(5);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={12} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              )}
              style={styles.activeFiltersScroll}
            />
          </View>

          <TouchableOpacity 
            onPress={handleClearAllFilters}
            style={styles.clearAllButton}
          >
            <Text style={styles.clearAllText}>Xoá hết</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SEARCH RESULTS */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
        </View>
      ) : (
        <FlatList
          data={venues}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VenueCard
              venue={item}
              onPress={() => handlePressVenue(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Không tìm thấy sân phù hợp</Text>
              <Text style={styles.emptySubtext}>Thử điều chỉnh bộ lọc hoặc từ khoá tìm kiếm</Text>
            </View>
          }
          ListHeaderComponent={
            venues.length > 0 ? (
              <Text style={styles.resultsCount}>
                Tìm thấy {venues.length} sân phù hợp
              </Text>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FILTER BOTTOM SHEET */}
      <FilterBottomSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={{ sport, city, radius }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
    gap: 12,
  },
  backButton: { 
    padding: 4,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    padding: 0,
    includeFontPadding: false,
    marginRight: 8,
  },
  clearButton: {
    padding: 4,
    marginRight: 4,
  },
  // Divider giữa input và icon filter
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  // Icon bộ lọc bên trong search bar
  filterIconButton: {
    padding: 4,
    borderRadius: 6,
    position: 'relative',
  },
  filterIconButtonActive: {
    backgroundColor: Colors.primary + '20',
  },
  filterIconBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIconBadgeText: {
    color: Colors.white,
    fontSize: 8,
    fontWeight: 'bold',
  },
  // Filter bar styles
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  filterLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeFiltersLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeFiltersScroll: {
    flex: 1,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginRight: 6,
    height: 24,
  },
  activeFilterText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '500',
  },
  clearAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  loadingWrap: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  resultsCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});