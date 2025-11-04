// app/index.tsx
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import LoginScreen from "./screens/LoginScreen";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // TODO: Kiểm tra nếu có token thì chuyển thẳng vào app
    // const checkAuth = async () => {
    //   const token = await AsyncStorage.getItem('token');
    //   if (token) {
    //     router.replace('/(tabs)');
    //   }
    // };
    // checkAuth();
  }, []);

  return <LoginScreen />;
}