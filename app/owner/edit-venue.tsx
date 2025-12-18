import React, { useEffect, useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { venueApi } from '../../api/venueApi';
import CustomHeader from '../../components/ui/CustomHeader';
import { Colors } from '../../constants/Colors';
import * as ImagePicker from 'expo-image-picker';

export default function EditVenueScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Bank Info State
  const [bankBin, setBankBin] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');

  useEffect(() => {
    if (id) {
      loadVenueDetail();
    }
  }, [id]);

  const loadVenueDetail = async () => {
    try {
      setLoading(true);
      const data = await venueApi.getVenueDetail(id!);
      setName(data.name);
      setAddress(data.address);
      setPhone(data.phone || '');
      setDescription(data.description || '');
      setImageUrl(data.imageUrl || '');
      
      setBankBin(data.bankBin || '');
      setBankName(data.bankName || '');
      setBankAccountNumber(data.bankAccountNumber || '');
      setBankAccountName(data.bankAccountName || '');
      
    } catch (error) {
      Alert.alert('Error', 'Failed to load venue details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !address) {
      Alert.alert('Error', 'Name and Address are required');
      return;
    }

    setSaving(true);
    try {
      await venueApi.updateVenue(id!, {
        name,
        address,
        phone,
        description,
        imageUrl,
        bankBin,
        bankName,
        bankAccountNumber,
        bankAccountName
      });
      Alert.alert('Success', 'Venue updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
        console.error("Update error:", error);
        Alert.alert('Error', error.response?.data?.message || 'Failed to update venue');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
        // In a real app, you would upload this image to a server/storage and get a URL.
        // For this prototype, if the backend accepts Base64 or we just use the local URI (which won't work for other users), 
        // we might need an upload endpoint. 
        // However, looking at CreateVenueScreen, it sends the URI directly? 
        // Wait, CreateVenueScreen sends `imageUrl: images[0]`. If it's a local file uri, backend can't see it unless backend uploads it.
        // Checking VenueCreateRequest: imageUrl is String.
        // If the backend doesn't handle file upload, this URI is useless for others.
        // But the user didn't ask to fix image upload. I'll just set the URI for now.
        // Ideally we need an upload service.
        setImageUrl(result.assets[0].uri);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Edit Venue" showBackButton />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          
          <Text style={styles.sectionTitle}>General Info</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Venue Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Venue Name" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Address" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone Number" keyboardType="phone-pad" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput 
                style={[styles.input, styles.textArea]} 
                value={description} 
                onChangeText={setDescription} 
                placeholder="Description" 
                multiline 
                numberOfLines={4} 
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Image URL</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput style={[styles.input, { flex: 1 }]} value={imageUrl} onChangeText={setImageUrl} placeholder="Image URL" />
                <TouchableOpacity style={styles.pickBtn} onPress={pickImage}>
                    <Ionicons name="image-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
            {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.previewImage} /> : null}
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Bank Information (For Payments)</Text>
          <Text style={styles.helperText}>This information will be shown to users when they book.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bank Name</Text>
            <TextInput style={styles.input} value={bankName} onChangeText={setBankName} placeholder="e.g. MB Bank, Vietcombank" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bank Bin (ID)</Text>
            <TextInput style={styles.input} value={bankBin} onChangeText={setBankBin} placeholder="e.g. 970422" keyboardType="numeric" />
            <Text style={styles.subHelp}>Look up your bank's BIN code for VietQR (e.g. MB: 970422)</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Number</Text>
            <TextInput style={styles.input} value={bankAccountNumber} onChangeText={setBankAccountNumber} placeholder="Account Number" keyboardType="numeric" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Holder Name</Text>
            <TextInput style={styles.input} value={bankAccountName} onChangeText={setBankAccountName} placeholder="ACCOUNT HOLDER NAME" autoCapitalize="characters" />
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveBtn, saving && styles.disabledBtn]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12, marginTop: 8 },
  helperText: { fontSize: 13, color: '#666', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  pickBtn: {
      backgroundColor: Colors.primary,
      width: 50,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8
  },
  previewImage: {
      width: '100%',
      height: 200,
      marginTop: 10,
      borderRadius: 8,
      resizeMode: 'cover'
  },
  subHelp: {
      fontSize: 12,
      color: '#888',
      marginTop: 4
  }
});
