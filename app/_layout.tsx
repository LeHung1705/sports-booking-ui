import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications"; // 1. Thêm import này

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
  
  // 2. Thêm logic lắng nghe thông báo (State refs)
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // A. Lắng nghe khi thông báo đến (App đang mở)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("🔔 RootLayout: Thông báo đến!", notification);
    });

    // B. Lắng nghe khi người dùng BẤM vào thông báo
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("👆 Người dùng bấm thông báo:", response);
      
      // Ví dụ: Điều hướng đến trang Lịch sử đặt sân khi bấm thông báo
      // const bookingId = response.notification.request.content.data.bookingId;
      // if (bookingId) router.push(`/booking-details/${bookingId}`);
    });

    return () => {
      // Dọn dẹp listener khi component unmount
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, []);

  // 3. Phần giao diện Stack GIỮ NGUYÊN 100% như cũ của bạn
  return (
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
  );
}