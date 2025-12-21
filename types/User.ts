// Định nghĩa các quyền trong hệ thống
export type UserRole = 'ROLE_USER' | 'ROLE_OWNER' | 'ROLE_ADMIN';

// Khớp với dữ liệu API trả về
export interface User {
  id: string; // Updated to match UUID string from backend
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  role: UserRole;
  stats?: Record<string, any>; // Add stats map
}

// Interface cho việc update (chỉ gửi những gì cần sửa)
export interface UpdateUserRequest {
  fullName?: string;
  phone?: string;
  avatar?: string;
}