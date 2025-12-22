import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { notificationApi, NotificationItem } from '../api/notificationApi';

interface NotificationContextType {
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  notifications: NotificationItem[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const isRead = useCallback((item: NotificationItem) => item.read || item.is_read || false, []);

  const sortNotifications = useCallback((items: NotificationItem[]) => {
    return items
      .slice()
      .sort((a, b) => {
        const timeA = new Date(a.created_at || a.createdAt || 0).getTime();
        const timeB = new Date(b.created_at || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
  }, []);

  const computeUnread = useCallback(
    (items: NotificationItem[]) => items.filter((item) => !isRead(item)).length,
    [isRead]
  );

  const fetchNotifications = useCallback(async () => {
    try {
      // apiClient tự động gắn token
      const data = await notificationApi.getMyNotifications();
      const sorted = sortNotifications(data || []);
      setNotifications(sorted);
      setUnreadCount(computeUnread(sorted));
    } catch (error) {
      console.log('Lỗi fetch notification context:', error);
    }
  }, [computeUnread, sortNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await notificationApi.markAsRead(id);

        setNotifications((prev) => {
          const updated = prev.map((item) => (item.id === id ? { ...item, read: true, is_read: true } : item));
          setUnreadCount(computeUnread(updated));
          return updated;
        });
      } catch (error) {
        console.log('Lỗi mark read:', error);
      }
    },
    [computeUnread]
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider value={{ unreadCount, fetchNotifications, markAsRead, notifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};

export type { NotificationItem }; // Export type để component dùng
