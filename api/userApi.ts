// userApi.ts
import apiClient from './apiClient';
import { User, UpdateUserRequest } from '../types/User';

export const userApi = {
  getMyInfo: async (): Promise<User> => {
    const response = await apiClient.get('/users/me');
    const raw = response.data;

    // TODO: chỉnh tên field cho đúng với UserProfileResponse thực tế
    const user: User = {
      id: raw.id,
      fullName: raw.fullName ?? raw.full_name ?? raw.name ?? '',
      email: raw.email,
      phone: raw.phone,
      avatar: raw.avatar ?? raw.avatarUrl,
      role: raw.role, // "ROLE_USER" | "ROLE_OWNER" | "ROLE_ADMIN"
    };

    return user;
  },

 // api/userApi.ts

  updateProfile: async (data: UpdateUserRequest): Promise<User> => {
    // 1. Tạo một payload mới, mapping lại tên biến cho khớp với Java
    const payload = {
      full_name: data.fullName, // <--- ĐỔI TÊN Ở ĐÂY: fullName (Frontend) -> full_name (Backend)
      phone: data.phone,
      avatar: data.avatar // Nếu Java DTO chưa có trường này thì dòng này vô tác dụng, nhưng cứ gửi
    };

    // 2. Gửi payload này đi thay vì gửi 'data' gốc
    const response = await apiClient.put('/users/me', payload); 
    
    // ... Phần xử lý response giữ nguyên ...
    const raw = response.data;
    const user: User = {
      id: raw.id,
      fullName: raw.fullName ?? raw.full_name ?? raw.name ?? '', // Đoạn này để hứng response trả về
      email: raw.email,
      phone: raw.phone,
      avatar: raw.avatar ?? raw.avatarUrl,
      role: raw.role,
    };
    return user;
  },
};