import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    ViewStyle
} from "react-native";
import { Colors } from "../../constants/Colors";

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  variant?: "primary" | "outline" | "danger";
  style?: ViewStyle;
}

export default function CustomButton({
  title,
  onPress,
  isLoading = false,
  variant = "primary",
  style,
}: CustomButtonProps) {
  // Logic chọn màu dựa trên variant
  const getBackgroundColor = () => {
    if (variant === "outline") return "transparent";
    if (variant === "danger") return Colors.error;
    return Colors.primary;
  };

  const getTextColor = () => {
    if (variant === "outline") return Colors.primary;
    return Colors.white;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === "outline" ? Colors.primary : "transparent",
          borderWidth: variant === "outline" ? 1 : 0,
        },
        style,
      ]}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 16,
    // Shadow giống LoginScreen
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});