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
        name="screens/LoginScreen"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="screens/RegisterScreen"
        options={{
          headerShown: true,
          title: "Đăng ký",
          headerBackTitle: "Quay lại",
        }}
      />
      <Stack.Screen
        name="screens/ForgotPasswordScreen"
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