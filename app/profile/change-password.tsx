import React, { useState, useEffect } from 'react'; // Thêm useEffect
import {
  ActivityIndicator,
  Alert,
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
import { authApi } from '../../api/authApi';
import { userApi } from '../../api/userApi'; // [QUAN TRỌNG] Thêm import này để lấy email

export default function ChangePasswordScreen() {
  const router = useRouter();
  
  // State lưu dữ liệu nhập
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State lưu email người dùng (Lấy ngầm)
  const [userEmail, setUserEmail] = useState('');

  // State hiển thị
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ 1. Lấy Email ngay khi vào màn hình
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const userData = await userApi.getMyInfo();
        if (userData && userData.email) {
          setUserEmail(userData.email);
          console.log("Sẽ đổi pass cho email:", userData.email);
        }
      } catch (error) {
        console.error("Không lấy được thông tin user", error);
        Alert.alert("Lỗi", "Không tải được thông tin người dùng");
      }
    };
    fetchEmail();
  }, []);

  const handleUpdate = async () => {
    // Validate cơ bản
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (!userEmail) {
        Alert.alert('Error', 'User email not found. Please try reloading.');
        return;
    }

    try {
      setLoading(true);
      
      // ✅ 2. GỌI API THẬT (Thay vì gọi logout như cũ)
      await authApi.changePassword({
        email: userEmail,
        currentPassword: currentPassword,
        newPassword: newPassword
      });

      // Nếu thành công (Không nhảy vào catch)
      Alert.alert('Success', 'Password updated successfully! Please login again.', [
        { 
            text: 'OK', 
            onPress: async () => {
                // Tùy chọn: Tự động logout luôn cho an toàn
                try { await authApi.logout(); } catch(e) {} 
                router.replace('/(auth)/login'); 
            } 
        },
      ]);

    } catch (error: any) {
      console.error('Failed to change password', error);
      // Lấy thông báo lỗi từ Backend trả về (nếu có)
      const message = error.response?.data?.message || 'Could not update password. Please check your current password.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordInput = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    visible: boolean,
    setVisible: (v: boolean) => void,
    placeholder: string,
    testID?: string,
  ) => {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputRowSoft}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={Colors.textSecondary}
            secureTextEntry={!visible}
            value={value}
            onChangeText={onChange}
            autoCapitalize="none"
            testID={testID}
          />
          <TouchableOpacity onPress={() => setVisible(!visible)} style={styles.eyeButton}>
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionCard}>
            {renderPasswordInput('Current Password', currentPassword, setCurrentPassword, showCurrent, setShowCurrent, 'Enter current password', 'current-password')}
            {renderPasswordInput('New Password', newPassword, setNewPassword, showNew, setShowNew, 'Enter new password', 'new-password')}
            {renderPasswordInput('Confirm New Password', confirmPassword, setConfirmPassword, showConfirm, setShowConfirm, 'Confirm new password', 'confirm-password')}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleUpdate}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
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
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  eyeButton: {
    paddingLeft: 8,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
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









