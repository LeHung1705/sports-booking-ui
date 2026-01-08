import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { venueApi } from '../../api/venueApi';
import { VenueDetail } from '../../types/venue';
import { Colors } from '../../constants/Colors';
import CustomHeader from '../../components/ui/CustomHeader';

export default function MyVenuesScreen() {
  const router = useRouter();
  const [venues, setVenues] = useState<VenueDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { highlightId } = useLocalSearchParams<{ highlightId: string }>();

  useFocusEffect(
    useCallback(() => {
      loadVenues();
    }, [])
  );

  const loadVenues = async () => {
    try {
      if (!refreshing) setLoading(true);
      const data = await venueApi.getMyVenues();
      setVenues(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load venues');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadVenues();
  }, []);

  const renderItem = ({ item }: { item: VenueDetail }) => {
    const isHighlighted = highlightId === item.id;
    return (
    <TouchableOpacity 
      style={[styles.card, isHighlighted && styles.highlightedCard]}
      onPress={() => router.push({ pathname: '/owner/VenueDetailScreen', params: { venueId: item.id } })}
    >
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} 
        style={styles.image} 
      />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
        <View style={styles.row}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.city}>{item.city}</Text>
        </View>
        {!item.isActive && (
            <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>Đang chờ duyệt</Text>
            </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
  )};

  return (
    <View style={styles.container}>
      <CustomHeader 
        title="Địa điểm của tôi" 
        showBackButton 
        rightIcon={
          <TouchableOpacity onPress={() => router.push('/owner/CreateVenueScreen')}>
            <Ionicons name="add" size={28} color="#333" />
          </TouchableOpacity>
        }
      />
      
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : venues.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>You haven't created any venues yet.</Text>
          <TouchableOpacity 
            style={styles.createBtn}
            onPress={() => router.push('/owner/CreateVenueScreen')}
          >
            <Text style={styles.createBtnText}>Create Venue</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={venues}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  highlightedCard: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
  },
  pendingBadge: {
      backgroundColor: '#FFF3E0',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: 4,
      alignSelf: 'flex-start',
  },
  pendingText: {
      fontSize: 10,
      color: '#FF9800',
      fontWeight: 'bold',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4
  },
  city: {
      fontSize: 12,
      color: '#888'
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  createBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
