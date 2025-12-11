import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

interface StatItemProps {
  label: string;
  value?: string | number;
  bold?: boolean;
}

function StatItem({ label, value, bold }: StatItemProps) {
  const displayValue = value === undefined || value === null || value === '' ? 'N/A' : value;
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, bold && styles.statValueBold]}>{displayValue}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface StatsCardProps {
  bookings?: number;
  hoursPlayed?: number;
  favoriteSport?: string;
  items?: StatItemProps[];
}

export default function StatsCard({ bookings, hoursPlayed, favoriteSport, items }: StatsCardProps) {
  const data = items ?? [
    { label: 'Bookings', value: bookings },
    { label: 'Hours Played', value: hoursPlayed },
    { label: 'Favorite Sport', value: favoriteSport, bold: true },
  ];

  return (
    <View style={styles.container}>
      {data.map((item, index) => (
        <StatItem key={`${item.label}-${index}`} label={item.label} value={item.value} bold={item.bold} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 6,
  },
  statValueBold: {
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
});
