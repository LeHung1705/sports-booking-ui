import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// ⚠️ QUAN TRỌNG: Đổi thành IP máy bạn
// Windows: ipconfig → IPv4 Address
// Mac: ifconfig getifaddr en0

const API_BASE_URL = "http://192.168.68.52:8080/api/v1";


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============ REQUEST INTERCEPTOR ============
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log request (chỉ trong dev)
      if (__DEV__) {
        const fullUrl = config.params 
          ? `${config.url}?${new URLSearchParams(config.params).toString()}`
          : config.url;
        console.log(`📤 ${config.method?.toUpperCase()} ${fullUrl}`);
      }
    } catch (error) {
      console.error("❌ Error loading token:", error);
    }
    return config;
  },
  (error: AxiosError) => {
    console.error("❌ Request error:", error.message);
    return Promise.reject(error);
  }
);

// ============ RESPONSE INTERCEPTOR ============
apiClient.interceptors.response.use(
  (response) => {
    // Log response (chỉ trong dev)
    if (__DEV__) {
      console.log(`📥 ${response.config.url} → ${response.status}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    // 1. Lỗi từ server (có response)
    if (error.response) {
      const status = error.response.status;
      console.log(`❌ API Error [${status}]:`, error.response.data);
      
      // Token hết hạn → xóa và yêu cầu đăng nhập lại
      if (status === 401) {
        await AsyncStorage.removeItem("accessToken");
        console.log("🔐 Token expired, redirecting to login...");
        // TODO: Navigate to login
      }
      
      // Server error
      if (status >= 500) {
        console.log("🔥 Server error, please try again later");
      }
    } 
    // 2. Request gửi đi nhưng không nhận được response
    else if (error.request) {
      console.log("❌ Network Error (no response):", error.message);
      console.log("💡 Check: Backend running? Same WiFi? Firewall?");
    } 
    // 3. Lỗi khác
    else {
      console.log("❌ Error:", error.message);
    }
    
    return Promise.reject(error);
  }
);

// ============ HELPER FUNCTIONS ============
export const getBaseURL = () => API_BASE_URL;

export const testConnection = async (): Promise<boolean> => {
  try {
    console.log("🔍 Testing connection to:", API_BASE_URL);
    const response = await apiClient.get("/health"); // hoặc endpoint test
    console.log("✅ Backend connected!");
    return true;
  } catch (error) {
    console.log("❌ Cannot connect to backend");
    return false;
  }
};

export default apiClient;