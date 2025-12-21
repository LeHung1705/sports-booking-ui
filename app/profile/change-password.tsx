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
import CustomHeader from '../../components/ui/CustomHeader';

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
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
      return;
    }

    if (!userEmail) {
        Alert.alert('Lỗi', 'Không tìm thấy email người dùng. Vui lòng tải lại trang.');
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
      Alert.alert('Thành công', 'Cập nhật mật khẩu thành công! Vui lòng đăng nhập lại.', [
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
      const message = error.response?.data?.message || 'Không thể cập nhật mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại.';
      Alert.alert('Lỗi', message);
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
      keyboardVerticalOffset={0}
    >
      <View style={styles.container}>
      <CustomHeader title="Đổi mật khẩu" showBackButton={true} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionCard}>
            {renderPasswordInput('Mật khẩu hiện tại', currentPassword, setCurrentPassword, showCurrent, setShowCurrent, 'Nhập mật khẩu hiện tại', 'current-password')}
            {renderPasswordInput('Mật khẩu mới', newPassword, setNewPassword, showNew, setShowNew, 'Nhập mật khẩu mới', 'new-password')}
            {renderPasswordInput('Xác nhận mật khẩu mới', confirmPassword, setConfirmPassword, showConfirm, setShowConfirm, 'Xác nhận lại mật khẩu mới', 'confirm-password')}
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
              <Text style={styles.saveButtonText}>Cập nhật mật khẩu</Text>
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









