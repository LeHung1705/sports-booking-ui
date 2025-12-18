import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { bookingApi } from '../../api/bookingApi';
import { Colors } from '../../constants/Colors';
import { format, subDays, startOfWeek, startOfMonth, endOfDay, startOfDay, endOfWeek, endOfMonth } from 'date-fns';

const { width } = Dimensions.get('window');

type FilterType = 'YESTERDAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

interface RevenueChartProps {
    onStatsChange?: (revenue: number, bookings: number, label: string) => void;
}

export default function RevenueChart({ onStatsChange }: RevenueChartProps) {
  const [filter, setFilter] = useState<FilterType>('WEEK');
  const [data, setData] = useState<{value: number, label: string}[]>([]);
  const [loading, setLoading] = useState(false);
  // Remove internal totalRevenue state since it's now passed up
  
  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let from: Date;
      let to: Date;
      let label = "";

      const now = new Date();

      switch (filter) {
        case 'YESTERDAY':
          from = subDays(now, 1);
          from = startOfDay(from);
          to = endOfDay(from);
          label = "Hôm qua";
          break;
        case 'WEEK':
          from = startOfWeek(now, { weekStartsOn: 1 }); 
          to = endOfWeek(now, { weekStartsOn: 1 });
          label = "Tuần này";
          break;
        case 'MONTH':
          from = startOfMonth(now);
          to = endOfMonth(now);
          label = "Tháng này";
          break;
        case 'CUSTOM':
          from = subDays(now, 7);
          to = endOfDay(now); 
          label = "Tùy chọn";
          break;
        default:
          from = subDays(now, 7);
          to = endOfDay(now);
          label = "7 ngày qua";
      }

      // Use toISOString() to match OwnerHistoryScreen behavior (UTC conversion)
      const fromStr = from.toISOString();
      const toStr = to.toISOString();

      console.log(`[RevenueChart] Fetching ${filter} (ISO): ${fromStr} -> ${toStr}`);

      const stats = await bookingApi.getRevenueStats({ from: fromStr, to: toStr });
      
      // Calculate totals
      const totalRev = stats.reduce((acc, curr) => acc + curr.value, 0);
      const totalBks = stats.reduce((acc, curr) => acc + (curr.count || 0), 0);

      if (onStatsChange) {
          onStatsChange(totalRev, totalBks, label);
      }

      // Transform for Chart
      const chartData = stats.map(item => ({
        value: item.value,
        label: format(new Date(item.date), 'dd/MM'),
        labelTextStyle: { color: 'gray', width: 40, fontSize: 10 },
      }));

      setData(chartData);

    } catch (error) {
      console.error("Failed to fetch revenue stats", error);
    } finally {
      setLoading(false);
    }
  };

  const renderFilterBtn = (title: string, type: FilterType) => (
    <TouchableOpacity
      style={[styles.filterBtn, filter === type && styles.filterBtnActive]}
      onPress={() => setFilter(type)}
    >
      <Text style={[styles.filterText, filter === type && styles.filterTextActive]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TỔNG QUAN DOANH THU</Text>
      
      <View style={styles.filterContainer}>
        {renderFilterBtn('Hôm qua', 'YESTERDAY')}
        {renderFilterBtn('Tuần', 'WEEK')}
        {renderFilterBtn('Tháng', 'MONTH')}
      </View>

      {loading ? (
        <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <View style={styles.chartWrapper}>
            {data.length > 0 ? (
                <LineChart
                    data={data}
                    height={160}
                    width={width - 64} // Adjust for padding (16*2 outer + 16*2 inner)
                    spacing={40}
                    initialSpacing={20}
                    color={Colors.primary}
                    thickness={3}
                    startFillColor="rgba(20, 105, 235, 0.3)"
                    endFillColor="rgba(20, 105, 235, 0.01)"
                    startOpacity={0.9}
                    endOpacity={0.2}
                    areaChart
                    yAxisTextStyle={{ color: 'gray', fontSize: 10 }}
                    noOfSections={4}
                    yAxisLabelWidth={45} 
                    formatYLabel={(label) => {
                         const val = parseFloat(label);
                         if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
                         if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
                         return label;
                    }}
                    scrollToEnd={true}
                    pointerConfig={{
                        pointerStripHeight: 160,
                        pointerStripColor: 'lightgray',
                        pointerStripWidth: 2,
                        pointerColor: 'lightgray',
                        radius: 6,
                        pointerLabelWidth: 100,
                        pointerLabelHeight: 90,
                        activatePointersOnLongPress: true,
                        autoAdjustPointerLabelPosition: false,
                        pointerLabelComponent: items => {
                          const item = items[0];
                          return (
                            <View
                              style={{
                                height: 90,
                                width: 100,
                                justifyContent: 'center',
                                marginTop: -30,
                                marginLeft: -40,
                              }}>
                              <View style={{paddingHorizontal:10, paddingVertical:6, borderRadius:10, backgroundColor:'white', borderWidth:1, borderColor:'#eee', elevation:4}}>
                                <Text style={{fontWeight: 'bold', textAlign: 'center', color: Colors.primary, fontSize: 12}}>
                                  {item.value ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: "compact" }).format(item.value) : '0'}
                                </Text>
                                <Text style={{fontSize: 10, textAlign: 'center', color: '#666'}}>{item.label}</Text>
                              </View>
                            </View>
                          );
                        },
                      }}
                />
            ) : (
                <View style={{height: 160, justifyContent: 'center', alignItems: 'center'}}>
                    <Text style={{color: '#999'}}>Không có dữ liệu cho giai đoạn này</Text>
                </View>
            )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 24, 
    paddingVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden'
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    marginBottom: 16,
    paddingHorizontal: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#eee'
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: 'white',
  },
  chartWrapper: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: 10
  }
});

