import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { NotificationProvider } from "@/context/NotificationContext";
import { registerForPushNotificationsAsync } from "@/utils/pushNotifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Cấu hình hiển thị thông báo khi App đang mở (Foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const router = useRouter();
  
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // 1. Đảm bảo đăng ký Channel (Android) và quyền (iOS) mỗi khi mở app
    registerForPushNotificationsAsync();

    // 2. Lắng nghe khi thông báo đến (Foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("🔔 RootLayout: Thông báo đến!", notification);
    });

    // 3. Lắng nghe khi người dùng BẤM vào thông báo (Background/Killed -> Open)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(async (response) => {
      console.log("👆 Người dùng bấm thông báo:", response);
      const data = response.notification.request.content.data;
      const type = data.type; // VENUE_CREATED, BOOKING_CREATED, etc.
      
      // Map keys from snake_case or camelCase
      // @ts-ignore
      const venueId = data.venueId || data.venue_id;
      // @ts-ignore
      const bookingId = data.bookingId || data.booking_id;

      // Check Role (cần lấy từ Storage vì Context chưa chắc đã load xong)
      const userRole = await AsyncStorage.getItem('userRole') || await AsyncStorage.getItem('role');
      const isOwner = userRole && /owner/i.test(userRole);
      const isAdmin = userRole && /admin/i.test(userRole);

      if (type === 'VENUE_CREATED' && isAdmin) {
          router.push({ pathname: '/admin/approve-venues', params: { highlightId: venueId } });
      } else if ((type === 'VENUE_APPROVED' || type === 'VENUE_REJECTED') && isOwner) {
          router.push({ pathname: '/owner/my-venues', params: { highlightId: venueId } });
      } else if (isOwner) {
          // Booking notifications for Owner
          if (bookingId) {
               router.push({ pathname: '/owner/bookings', params: { highlightId: bookingId } });
          } else {
               router.push('/owner/bookings');
          }
      } else {
         // User notifications
         if (bookingId) {
              router.push({ pathname: '/booking/my_bookings', params: { highlightId: bookingId } });
         } else {
              router.push('/booking/my_bookings');
         }
      }
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, []);

  return (
    <NotificationProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="(auth)/login"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(auth)/register"
          options={{
            headerShown: true,
            title: "Đăng ký",
            headerBackTitle: "Quay lại",
          }}
        />
        <Stack.Screen
          name="(auth)/forgot-password"
          options={{
            headerShown: true,
            title: "Quên mật khẩu",
            headerBackTitle: "Quay lại",
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </NotificationProvider>
  );
}