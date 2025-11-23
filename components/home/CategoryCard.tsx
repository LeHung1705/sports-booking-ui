import React from "react";
import { TouchableOpacity, Text, StyleSheet, View, Image, ImageSourcePropType } from "react-native";
import { Colors } from "../../constants/Colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface CategoryCardProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  onPress?: () => void;
  iconColor?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  icon,
  title,
  onPress,
  iconColor = Colors.primary,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={iconName} size={26} color={iconColor} />
      </View> */}
      <View style={styles.categoryIcon}>
        <Image source={icon} style={styles.icon} contentFit="contain" />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "30%",
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  iconWrap: {
    marginBottom: 6,
  },
  icon: { width: 32, height: 32 },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
  },
   categoryIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
});
