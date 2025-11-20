// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
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