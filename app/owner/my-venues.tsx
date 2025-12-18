import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { venueApi } from '../../api/venueApi';
import { VenueDetail } from '../../types/venue';
import { Colors } from '../../constants/Colors';
import CustomHeader from '../../components/ui/CustomHeader';

export default function MyVenuesScreen() {
  const router = useRouter();
  const [venues, setVenues] = useState<VenueDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadVenues();
    }, [])
  );

  const loadVenues = async () => {
    try {
      setLoading(true);
      const data = await venueApi.getMyVenues();
      setVenues(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: VenueDetail }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/owner/edit-venue?id=${item.id}`)}
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
      </View>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <CustomHeader title="My Venues" showBackButton />
      
      {loading ? (
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
