import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';

interface ProfileHeaderProps {
  fullName?: string;
  email?: string;
  avatar?: string;
  role?: string;
}

export default function ProfileHeader({ fullName, email, avatar, role }: ProfileHeaderProps) {
  // Tên fallback nếu BE chưa có hoặc trả sai field
  const safeName =
    (fullName && fullName.trim().length > 0)
      ? fullName.trim()
      : (email && email.split('@')[0]) || 'User';

  const initial = safeName.charAt(0).toUpperCase();

  const upperRole = (role || '').toUpperCase();
  const roleBadge = upperRole.includes('ADMIN')
    ? { label: 'ADMINISTRATOR', color: '#FF3B30' }
    : upperRole.includes('OWNER')
      ? { label: 'CHỦ SÂN', color: '#5856D6' }
      : undefined;

  return (
    <View style={styles.card}>
      <View style={styles.avatarContainer}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
      </View>
      <View style={styles.nameContainer}>
        <Text style={styles.name}>{safeName}</Text>
        <Ionicons name="checkmark-circle" size={18} color={Colors.primary} style={styles.verifiedBadge} />
      </View>
      {roleBadge && (
        <View style={[styles.roleBadge, { backgroundColor: roleBadge.color }]}> 
          <Text style={styles.roleBadgeText}>{roleBadge.label}</Text>
        </View>
      )}
      <Text style={styles.email}>{email ?? ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 0,
    marginTop: -5,
    marginBottom: 8,
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    paddingTop: 50,
  },
  avatarContainer: {
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.white,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
  },
  avatarText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: Colors.white,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  roleBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  email: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 5,
  },
});
