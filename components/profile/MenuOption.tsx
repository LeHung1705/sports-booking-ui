import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';

export interface MenuOptionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  showBorder?: boolean;
  color?: string;
}

export default function MenuOption({ 
  icon, 
  title, 
  onPress, 
  showBorder = true,
  color = Colors.primary 
}: MenuOptionProps) {
  return (
    <TouchableOpacity 
      style={[styles.container, !showBorder && styles.noBorder]} 
      onPress={onPress}
    >
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Đẩy mũi tên ra cuối dòng
  },
  iconContainer: {
    marginRight: 12,
  },
  title: {
    flex: 1, // Đẩy text chiếm không gian còn lại
    fontSize: 16,
    color: Colors.text,
  },
});
