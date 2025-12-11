// Định nghĩa các quyền trong hệ thống
export type UserRole = 'ROLE_USER' | 'ROLE_OWNER' | 'ROLE_ADMIN';

// Khớp với dữ liệu API trả về
export interface User {
  id: number;
  fullName: string; // Trong Excel có thể là full_name, bạn cần check kỹ JSON thực tế
  email: string;
  phone: string;
  avatar?: string;  // Dấu ? nghĩa là có thể null
  role: UserRole;   // Quan trọng: Dùng để chia giao diện
}

// Interface cho việc update (chỉ gửi những gì cần sửa)
export interface UpdateUserRequest {
  fullName?: string;
  phone?: string;
  avatar?: string;
}