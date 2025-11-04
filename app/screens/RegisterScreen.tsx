// app/screens/RegisterScreen.tsx
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
} from "react-native";
import { authApi } from "../../api/authApi";

export default function RegisterScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const { full_name, email, password, confirmPassword } = formData;

    if (!full_name || !email || !password || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      console.log("📝 Attempting registration...");
      const response = await authApi.register(formData);

      Alert.alert("Thành công", "Đăng ký thành công! Vui lòng đăng nhập.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("❌ Registration failed:", error);

      if (error.response) {
        Alert.alert("Lỗi", error.response.data.message || "Đăng ký thất bại");
      } else if (error.request) {
        Alert.alert("Lỗi", "Không thể kết nối tới server");
      } else {
        Alert.alert("Lỗi", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logoImage}
            />
        </View>
        <View style={styles.header}>
          <Text style={styles.title}>Tạo tài khoản mới</Text>
          <Text style={styles.subtitle}>
            Bắt đầu hành trình thể thao cùng TechBo — đặt sân dễ dàng, nhanh chóng và tiện lợi.
          </Text>
        </View>

        <View style={styles.form}>
          {/* Họ tên */}
          <TextInput
            style={styles.input}
            placeholder="Họ và tên *"
            placeholderTextColor="#888"
            value={formData.full_name}
            onChangeText={(text) => setFormData({ ...formData, full_name: text })}
            editable={!loading}
          />

          {/* Email */}
          <TextInput
            style={styles.input}
            placeholder="Email *"
            placeholderTextColor="#888"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          {/* Số điện thoại */}
          <TextInput
            style={styles.input}
            placeholder="Số điện thoại"
            placeholderTextColor="#888"
            value={formData.phoneNumber}
            onChangeText={(text) =>
              setFormData({ ...formData, phoneNumber: text })
            }
            keyboardType="phone-pad"
            editable={!loading}
          />

          {/* Mật khẩu */}
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu *"
            placeholderTextColor="#888"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
            editable={!loading}
          />

          {/* Xác nhận mật khẩu */}
          <TextInput
            style={styles.input}
            placeholder="Xác nhận mật khẩu *"
            placeholderTextColor="#888"
            value={formData.confirmPassword}
            onChangeText={(text) =>
              setFormData({ ...formData, confirmPassword: text })
            }
            secureTextEntry
            editable={!loading}
          />

          {/* Nút đăng ký */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Đăng Ký</Text>
            )}
          </TouchableOpacity>

          {/* Đã có tài khoản */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.back()} disabled={loading}>
              <Text style={styles.loginLink}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const PRIMARY = "#00A36C";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // nền sáng
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
  },
  form: {
    paddingVertical: 8,
  },
  input: {
    backgroundColor: "#F5F5F5",
    color: "#000",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  button: {
    backgroundColor: PRIMARY,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: "#A5D6C1",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginText: {
    color: "#666",
    fontSize: 14,
  },
  loginLink: {
    color: PRIMARY,
    fontWeight: "bold",
    fontSize: 14,
  },
});
