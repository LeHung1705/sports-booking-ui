import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onPressAction?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText = "Xem tất cả",
  onPressAction,
}) => {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle}>{subtitle}</Text>
        ) : null}
      </View>

      {onPressAction && (
        <TouchableOpacity onPress={onPressAction} activeOpacity={0.7}>
          <View style={styles.actionRow}>
            <Text style={styles.actionText}>{actionText}</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={Colors.primary}
            />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
    marginRight: 2,
  },
});
