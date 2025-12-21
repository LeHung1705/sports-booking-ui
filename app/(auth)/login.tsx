// app/screens/LoginScreen.tsx
import { registerForPushNotificationsAsync } from '../../utils/pushNotifications'; // Import hàm vừa tạo
import { notificationApi } from '../../api/apiClient'; // Import api call
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login({ email, password });

      if (response.data) {
        if (response.data.accessToken) {
            await AsyncStorage.setItem("accessToken", response.data.accessToken);
        }
        if (response.data.user) {
            await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
        }
        // --- ĐOẠN MỚI THÊM: ĐĂNG KÝ PUSH TOKEN ---
        try {
            console.log("🚀 Đang đăng ký Push Notification...");
            const pushToken = await registerForPushNotificationsAsync();
            if (pushToken) {
                await notificationApi.registerToken(
                    pushToken, 
                    Platform.OS // 'ios' hoặc 'android'
                );
                console.log("✅ Đã gửi token lên server thành công!");
            }
        } catch (pushErr) {
            console.log("⚠️ Lỗi đăng ký push (không chặn login):", pushErr);
        }
        // ------------------------------------------
      }

      Alert.alert("Success", "Login successful!", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Logo */}
        <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logoImage}
            />
        </View>

        {/* Text header */}
        <Text style={styles.title}>Welcome, TechBo!</Text>
        <Text style={styles.subtitle}>
        Đặt sân thể thao nhanh chóng, tiện lợi và kết nối đam mê mọi lúc mọi nơi.
        </Text>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <FontAwesome
                name={showPassword ? "eye-slash" : "eye"}
                size={20}
                color="#555"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push("./forgot-password")}>
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Social login */}
        <Text style={styles.orText}>or</Text>

        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="google" size={20} color="#DB4437" />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="facebook" size={20} color="#1877F2" />
            <Text style={styles.socialText}>Facebook</Text>
          </TouchableOpacity>
        </View>

        {/* Register */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("./register")}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
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
  logoContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 28,
    color: "#1A1A1A",
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 40,
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
  forgot: {
    color: "#007AFF",
    textAlign: "right",
    marginBottom: 20,
    fontSize: 14,
  },
  button: {
    backgroundColor: PRIMARY,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#A5D6C1",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  orText: {
    color: "#888",
    textAlign: "center",
    marginVertical: 16,
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  socialText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  registerText: {
    color: "#666",
  },
  registerLink: {
    color: PRIMARY,
    fontWeight: "bold",
  },
  passwordContainer: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#F5F5F5",
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#E0E0E0",
  paddingHorizontal: 14,
  marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    color: "#000",
    paddingVertical: 14,
  },

});