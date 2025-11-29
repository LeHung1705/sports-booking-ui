import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Thay IP máy bạn
const API_BASE_URL = "http://192.168.1.14:8080/api/v1"; 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor Request
apiClient.interceptors.request.use(
  // 👇 Dùng ': any' ở đây là liều thuốc chữa bách bệnh cho lỗi version
  async (config: any) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (token) {
        // Fix cho mọi phiên bản: đảm bảo headers luôn tồn tại
        if (!config.headers) {
          config.headers = {};
        }
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error loading token", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor Response
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.log(`❌ API Error [${error.response.status}]:`, error.response.data);
    } else {
      console.log("❌ Network Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;