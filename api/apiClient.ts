// api/apiClient.ts
import axios from "axios";

const API_BASE_URL = "http://172.20.10.6:8080/api/v1";
console.log("🌐 API Base URL:", API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor để tự động thêm token vào header
apiClient.interceptors.request.use(
  (config) => {
    // ✅ nếu không cần chờ async → dùng sync logic
    // const token = "token_của_bạn"; // hoặc lấy từ context
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;