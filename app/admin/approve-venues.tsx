import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { adminApi, PendingVenueItem } from '../../api/adminApi';
import { Colors } from '../../constants/Colors';
import CustomHeader from '../../components/ui/CustomHeader';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ApproveVenuesScreen() {
  const router = useRouter();
  const [venues, setVenues] = useState<PendingVenueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const { highlightId } = useLocalSearchParams<{ highlightId: string }>();

  useEffect(() => {
    fetchPendingVenues();
  }, []);

  const fetchPendingVenues = async () => {
    try {
      const data = await adminApi.getPendingVenues();
      setVenues(data);
    } catch (error) {
      console.error("Failed to fetch pending venues", error);
      Alert.alert("Error", "Could not fetch pending venues.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPendingVenues();
  }, []);

  const handleApprove = async (id: string, name: string) => {
    Alert.alert(
      "Xác nhận duyệt",
      `Bạn có chắc muốn duyệt địa điểm "${name}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Duyệt",
          onPress: async () => {
            setProcessingId(id);
            try {
              await adminApi.approveVenue(id);
              Alert.alert("Thành công", "Đã duyệt địa điểm.");
              fetchPendingVenues();
            } catch (error) {
              Alert.alert("Lỗi", "Không thể duyệt địa điểm.");
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const handleReject = async (id: string, name: string) => {
    Alert.alert(
      "Xác nhận từ chối",
      `Bạn có chắc muốn từ chối và XÓA địa điểm "${name}"? Hành động này không thể hoàn tác.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Từ chối & Xóa",
          style: 'destructive',
          onPress: async () => {
            setProcessingId(id);
            try {
              await adminApi.rejectVenue(id);
              Alert.alert("Thành công", "Đã từ chối và xóa địa điểm.");
              fetchPendingVenues();
            } catch (error) {
              Alert.alert("Lỗi", "Không thể từ chối địa điểm.");
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: PendingVenueItem }) => {
    const isHighlighted = highlightId === item.id;
    return (
    <View style={[styles.card, isHighlighted && styles.highlightedCard]}>
        <View style={styles.cardHeader}>
            <Text style={styles.venueName}>{item.name}</Text>
            <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Chờ duyệt</Text>
            </View>
        </View>
        
        <Text style={styles.infoText}>📍 {item.address}, {item.district}, {item.city}</Text>
        <Text style={styles.infoText}>👤 Chủ sân: {item.ownerName}</Text>
        <Text style={styles.infoText}>📧 {item.ownerEmail}</Text>

        <TouchableOpacity onPress={() => router.push(`/venue/${item.id}`)} style={{alignSelf: 'flex-start', marginVertical: 8}}>
            <Text style={{color: Colors.primary, fontWeight: '600'}}>Xem chi tiết ›</Text>
        </TouchableOpacity>

        <View style={styles.actionRow}>
            <TouchableOpacity 
                style={[styles.rejectButton, processingId === item.id && styles.disabledButton]}
                onPress={() => handleReject(item.id, item.name)}
                disabled={processingId === item.id}
            >
                <Text style={styles.rejectButtonText}>Từ chối</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.approveButton, processingId === item.id && styles.disabledButton]}
                onPress={() => handleApprove(item.id, item.name)}
                disabled={processingId === item.id}
            >
                {processingId === item.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <Text style={styles.approveButtonText}>Duyệt</Text>
                )}
            </TouchableOpacity>
        </View>
    </View>
  )};

  return (
    <View style={styles.container}>
      <CustomHeader title="Duyệt địa điểm" showBackButton={true} />
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : venues.length === 0 ? (
        <View style={styles.center}>
            <Text style={styles.emptyText}>Không có địa điểm nào chờ duyệt.</Text>
        </View>
      ) : (
        <FlatList
          data={venues}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  highlightedCard: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4', // Light green bg
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#FFF4E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  approveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#EF4444', // Red
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
  },
  approveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
      color: '#888',
      fontSize: 16,
  }
});
