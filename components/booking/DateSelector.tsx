import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../constants/Colors";

interface DateSelectorProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export default function DateSelector({ selectedDate, onSelectDate }: DateSelectorProps) {
  // Tạo mảng 7 ngày tới
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const isSameDate = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth();

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {dates.map((date, index) => {
          const isSelected = isSameDate(date, selectedDate);
          const dayName = index === 0 ? "Hôm nay" : `Thứ ${date.getDay() + 1}`; // Cần xử lý thứ CN sau
          
          return (
            <TouchableOpacity
              key={index}
              style={[styles.item, isSelected && styles.itemSelected]}
              onPress={() => onSelectDate(date)}
            >
              <Text style={[styles.dayText, isSelected && styles.textSelected]}>
                {dayName === "Thứ 1" ? "CN" : dayName}
              </Text>
              <Text style={[styles.dateText, isSelected && styles.textSelected]}>
                {date.getDate()}/{date.getMonth() + 1}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  item: {
    width: 60,
    height: 70,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "transparent",
  },
  itemSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dayText: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  textSelected: {
    color: "#fff",
  },
});