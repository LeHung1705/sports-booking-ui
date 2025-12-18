import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { userApi } from '../../api/userApi';
import { User } from '../../types/User';
import CustomHeader from '../../components/ui/CustomHeader';

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>();
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setInitialLoading(true);
        const data: User = await userApi.getMyInfo();
        setFullName(data.fullName || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setAvatar(data.avatar);
        setBio('');
        setAddress('');
      } catch (error) {
        console.error('Failed to load profile', error);
        Alert.alert('Error', 'Could not load profile information');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const onSave = async () => {
    try {
      setLoading(true);
      await userApi.updateProfile({ fullName, phone, avatar });
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Failed to update profile', error);
      Alert.alert('Error', 'Could not update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderAvatar = () => {
    const initial = fullName?.trim()?.[0]?.toUpperCase() || 'U';
    return (
      <View style={styles.avatarBlock}>
        <View style={styles.avatarWrapper}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.cameraButton} onPress={() => Alert.alert('Change Photo', 'Photo picker not implemented yet')}>
            <Ionicons name="camera" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Change Photo', 'Photo picker not implemented yet')}>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.container}>
        <CustomHeader title="Edit Profile" showBackButton={true} />

        {initialLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Public Profile</Text>
              {renderAvatar()}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputRowSoft}>
                  <Ionicons name="person-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter full name"
                    value={fullName}
                    onChangeText={setFullName}
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
                <Text style={styles.helperText}>This name will appear on your bookings.</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bio / About Me</Text>
                <View style={[styles.inputRowSoft, styles.textArea]}>
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="Tell others about you"
                    value={bio}
                    onChangeText={setBio}
                    placeholderTextColor={Colors.textSecondary}
                    multiline
                  />
                </View>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Private Details</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={[styles.inputRowSoft, styles.inputDisabled]}>
                  <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.disabledText]}
                    placeholder="Email"
                    value={email}
                    editable={false}
                    placeholderTextColor={Colors.textSecondary}
                  />
                  <Ionicons name="lock-closed" size={18} color={Colors.textSecondary} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputRowSoft}>
                  <Ionicons name="call-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <View style={styles.inputRowSoft}>
                  <Ionicons name="location-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter address"
                    value={address}
                    onChangeText={setAddress}
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={onSave}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  avatarBlock: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarWrapper: {
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: Colors.white,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.white,
  },
  cameraButton: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  changePhotoText: {
    marginTop: 6,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginTop: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  inputRowSoft: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
  },
  disabledText: {
    color: Colors.textSecondary,
  },
  textArea: {
    height: 110,
    alignItems: 'flex-start',
  },
  multilineInput: {
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
