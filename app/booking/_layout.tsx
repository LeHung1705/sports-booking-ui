import { Stack } from 'expo-router';
import React from 'react';

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="schedule" />
      <Stack.Screen name="detail" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="success" />
      <Stack.Screen name="my_bookings" />
      <Stack.Screen name="time-slot" />
    </Stack>
  );
}
