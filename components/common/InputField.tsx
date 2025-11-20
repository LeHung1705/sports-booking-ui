import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View, // Thêm import này
    ViewStyle, // Thêm import này
} from "react-native";
import { Colors } from "../../constants/Colors";

// FIX: Dùng Omit để bỏ 'style' gốc của TextInput, và định nghĩa lại nó là ViewStyle
interface InputFieldProps extends Omit<TextInputProps, "style"> {
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  style?: StyleProp<ViewStyle>; // Định nghĩa lại: style này dành cho View container
}

export default function InputField({
  icon,
  error,
  style,
  ...props
}: InputFieldProps) {
  return (
    // Bây giờ 'style' đã là ViewStyle, View sẽ chấp nhận không báo lỗi nữa
    <View style={[styles.container, style]}>
      <View style={[styles.inputWrapper, error ? styles.errorBorder : null]}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={Colors.textSecondary}
            style={styles.icon}
          />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textSecondary}
          {...props} // Các props còn lại (value, onChangeText) sẽ vào đây
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 56,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
  },
  icon: {
    marginRight: 12,
  },
  errorBorder: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});