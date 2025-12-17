import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { adminApi, AdminUserItem } from '../../api/adminApi';
import CustomHeader from '../../components/ui/CustomHeader';
import { Colors } from '../../constants/Colors';

export default function ManageUsersScreen() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(u => 
        (u.fullName && u.fullName.toLowerCase().includes(lower)) || 
        (u.email && u.email.toLowerCase().includes(lower))
      ));
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
      Alert.alert("Error", "Could not fetch users.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (uid: string, name: string) => {
    Alert.alert(
      "Confirm Upgrade",
      `Are you sure you want to upgrade "${name}" to Owner?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Upgrade",
          onPress: async () => {
            setProcessingId(uid);
            try {
              await adminApi.upgradeUserToOwner(uid);
              Alert.alert("Success", "User upgraded to OWNER.");
              // Update local state instead of refetching everything for better UX
              setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: 'OWNER' } : u));
            } catch (error) {
              Alert.alert("Error", "Failed to upgrade user.");
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const handleDegrade = async (uid: string, name: string) => {
    Alert.alert(
      "Confirm Degrade",
      `Are you sure you want to degrade "${name}" to User?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Degrade",
          onPress: async () => {
            setProcessingId(uid);
            try {
              await adminApi.degradeUserToUser(uid);
              Alert.alert("Success", "User degraded to USER.");
              setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: 'USER' } : u));
            } catch (error) {
              Alert.alert("Error", "Failed to degrade user.");
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: AdminUserItem }) => {
    const roleUpper = (item.role || '').toUpperCase();
    const isOwner = roleUpper.includes('OWNER');
    const isAdmin = roleUpper.includes('ADMIN');

    return (
      <View style={styles.card}>
          <View style={styles.infoContainer}>
              <Text style={styles.userName}>{item.fullName || "No Name"}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
              <View style={[styles.roleBadge, 
                  isOwner ? styles.bgOwner : isAdmin ? styles.bgAdmin : styles.bgUser
              ]}>
                  <Text style={[styles.roleText, 
                      isOwner ? styles.textOwner : isAdmin ? styles.textAdmin : styles.textUser
                  ]}>{item.role}</Text>
              </View>
          </View>

          {!isOwner && !isAdmin && (
             <TouchableOpacity 
                style={[styles.upgradeButton, processingId === item.uid && styles.disabledButton]}
                onPress={() => handleUpgrade(item.uid, item.fullName)}
                disabled={processingId === item.uid}
             >
                 {processingId === item.uid ? (
                    <ActivityIndicator color="#fff" size="small" />
                 ) : (
                    <Text style={styles.upgradeButtonText}>Upgrade</Text>
                 )}
             </TouchableOpacity>
          )}

          {isOwner && (
             <TouchableOpacity 
                style={[styles.degradeButton, processingId === item.uid && styles.disabledButton]}
                onPress={() => handleDegrade(item.uid, item.fullName)}
                disabled={processingId === item.uid}
             >
                 {processingId === item.uid ? (
                    <ActivityIndicator color="#fff" size="small" />
                 ) : (
                    <Text style={styles.upgradeButtonText}>Degrade</Text>
                 )}
             </TouchableOpacity>
          )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="User Management" showBackButton={true} />

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput 
            style={styles.searchInput}
            placeholder="Search by name or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
        />
      </View>
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.uid}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={15}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    height: 46,
  },
  searchIcon: {
      marginRight: 8,
  },
  searchInput: {
      flex: 1,
      height: '100%',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoContainer: {
      flex: 1,
      marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  roleBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: 4,
  },
  bgUser: { backgroundColor: '#E3F2FD' },
  bgOwner: { backgroundColor: '#E8F5E9' },
  bgAdmin: { backgroundColor: '#FCE4EC' },
  
  textUser: { color: '#1976D2', fontSize: 11, fontWeight: '700' },
  textOwner: { color: '#388E3C', fontSize: 11, fontWeight: '700' },
  textAdmin: { color: '#C2185B', fontSize: 11, fontWeight: '700' },

  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  degradeButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
      backgroundColor: '#ccc',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
