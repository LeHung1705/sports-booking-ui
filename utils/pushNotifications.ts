import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Cấu hình hành vi khi nhận thông báo lúc App đang MỞ (Foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Hiển thị thông báo ngay cả khi đang dùng app
    shouldPlaySound: true,
    shouldSetBadge: false,
    // iOS 15+ yêu cầu thêm hai trường bên dưới để tránh lỗi kiểu
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    // Android cần tạo Channel để thông báo hoạt động
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    // 1. Kiểm tra quyền hiện tại
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 2. Nếu chưa có quyền -> Xin quyền
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // 3. Nếu vẫn không được cấp quyền -> Dừng
    if (finalStatus !== 'granted') {
      console.log('❌ Failed to get push token for push notification!');
      return undefined;
    }

    // 4. Lấy Expo Push Token (Dạng: ExponentPushToken[xxxxxxxx])
    // projectId lấy từ app.json/app.config.js (Expo tự động handle)
    try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({
            projectId, 
        })).data;
        console.log("🔥 Expo Push Token:", token);
    } catch (e) {
        console.error("Lỗi lấy token:", e);
    }
    
  } else {
    console.log('⚠️ Must use physical device for Push Notifications');
  }

  return token;
}