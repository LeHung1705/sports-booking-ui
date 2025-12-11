import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { adminApi, PendingVenueItem } from '../../api/adminApi';
import { Colors } from '../../constants/Colors';
import CustomHeader from '../../components/ui/CustomHeader';

export default function ApproveVenuesScreen() {
  const [venues, setVenues] = useState<PendingVenueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingVenues();
  }, []);

  const fetchPendingVenues = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getPendingVenues();
      setVenues(data);
    } catch (error) {
      console.error("Failed to fetch pending venues", error);
      Alert.alert("Error", "Could not fetch pending venues.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, name: string) => {
    Alert.alert(
      "Confirm Approval",
      `Are you sure you want to approve venue "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            setProcessingId(id);
            try {
              await adminApi.approveVenue(id);
              Alert.alert("Success", "Venue approved successfully.");
              fetchPendingVenues();
            } catch (error) {
              Alert.alert("Error", "Failed to approve venue.");
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: PendingVenueItem }) => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <Text style={styles.venueName}>{item.name}</Text>
            <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Pending</Text>
            </View>
        </View>
        
        <Text style={styles.infoText}>📍 {item.address}, {item.district}, {item.city}</Text>
        <Text style={styles.infoText}>👤 Owner: {item.ownerName}</Text>
        <Text style={styles.infoText}>📧 {item.ownerEmail}</Text>

        <TouchableOpacity 
            style={[styles.approveButton, processingId === item.id && styles.disabledButton]}
            onPress={() => handleApprove(item.id, item.name)}
            disabled={processingId === item.id}
        >
            {processingId === item.id ? (
                <ActivityIndicator color="#fff" size="small" />
            ) : (
                <Text style={styles.approveButtonText}>Approve Venue</Text>
            )}
        </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomHeader title="Approve Venues" showBackButton={true} />
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : venues.length === 0 ? (
        <View style={styles.center}>
            <Text style={styles.emptyText}>No pending venues found.</Text>
        </View>
      ) : (
        <FlatList
          data={venues}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
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
  approveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
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
