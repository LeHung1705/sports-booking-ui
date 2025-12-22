import apiClient from "./apiClient";

export interface NotificationItem {
  id: string;
  title?: string;
  body?: string;
  type?: string;
  created_at?: string;
  createdAt?: string;
  read: boolean;
  is_read?: boolean;
}

export const notificationApi = {
  registerToken: async (token: string, deviceType: string) => {
    return apiClient.post("/notifications/register", { token, deviceType });
  },

  getMyNotifications: async (): Promise<NotificationItem[]> => {
    const response = await apiClient.get("/notifications/my-notifications");
    return response.data;
  },

  markAsRead: async (id: string) => {
    return apiClient.put(`/notifications/${id}/read`);
  },
};
