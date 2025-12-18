import CustomHeader from '@/components/ui/CustomHeader';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { bookingApi } from '../../api/bookingApi';
import { Colors } from '../../constants/Colors';
import { BookingListResponse } from '../../types/booking';

export default function MyBookingsScreen() {
    const router = useRouter();
    const [bookings, setBookings] = useState<BookingListResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<'CONFIRMED' | 'AWAITING_CONFIRM' | 'CANCELED'>('CONFIRMED');

    const fetchBookings = async () => {
        try {
            const data = await bookingApi.getMyBookings();
            // Sort by date descending (newest first)
            const sorted = data.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
            setBookings(sorted);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getCounts = () => {
        const confirmed = bookings.filter(b => ['CONFIRMED', 'COMPLETED'].includes(b.status)).length;
        const awaiting = bookings.filter(b => ['AWAITING_CONFIRM', 'PENDING_PAYMENT', 'PENDING'].includes(b.status)).length;
        const canceled = bookings.filter(b => ['CANCELED', 'REFUND_PENDING', 'REJECTED', 'FAILED'].includes(b.status)).length;
        return { CONFIRMED: confirmed, AWAITING_CONFIRM: awaiting, CANCELED: canceled };
    };

    const counts = getCounts();

    const filteredBookings = bookings.filter(b => {
        if (selectedCategory === 'CONFIRMED') return ['CONFIRMED', 'COMPLETED'].includes(b.status);
        if (selectedCategory === 'AWAITING_CONFIRM') return ['AWAITING_CONFIRM', 'PENDING_PAYMENT', 'PENDING'].includes(b.status);
        if (selectedCategory === 'CANCELED') return ['CANCELED', 'REFUND_PENDING', 'REJECTED', 'FAILED'].includes(b.status);
        return false;
    });

    useFocusEffect(
        useCallback(() => {
            fetchBookings();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return '#4CAF50'; // Green
            case 'PENDING': return '#FFC107'; // Amber
            case 'CANCELED': return '#F44336'; // Red
            case 'COMPLETED': return '#9E9E9E'; // Grey
            case 'FAILED': return '#F44336'; // Red
            default: return '#2196F3'; // Blue
        }
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const renderItem = ({ item }: { item: BookingListResponse }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => {
                if (item.status === 'PENDING_PAYMENT') {
                    router.push({
                        pathname: '/booking/checkout',
                        params: { bookingId: item.id }
                    });
                } else {
                    router.push(`/booking/detail?id=${item.id}`);
                }
            }}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.venueName} numberOfLines={1}>{item.venue || 'Unknown Venue'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>
            
            <View style={styles.row}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.courtName}>{item.court}</Text>
            </View>

            <View style={styles.row}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.dateText}>{formatDateTime(item.startTime)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.footer}>
                <Text style={styles.totalLabel}>Total Price</Text>
                <Text style={styles.price}>{item.totalPrice?.toLocaleString('vi-VN')} VND</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <CustomHeader title="Lịch sử đặt sân" showBackButton={true} />
            
            <View style={styles.categoryContainer}>
                <TouchableOpacity 
                    style={[
                        styles.categoryBtn, 
                        { borderColor: Colors.primary, backgroundColor: selectedCategory === 'CONFIRMED' ? Colors.primary : '#fff' }
                    ]}
                    onPress={() => setSelectedCategory('CONFIRMED')}
                >
                    <Text style={[styles.categoryText, { color: selectedCategory === 'CONFIRMED' ? '#fff' : Colors.primary }]}>
                        Đã duyệt ({counts.CONFIRMED})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[
                        styles.categoryBtn, 
                        { borderColor: '#FFC107', backgroundColor: selectedCategory === 'AWAITING_CONFIRM' ? '#FFC107' : '#fff' }
                    ]}
                    onPress={() => setSelectedCategory('AWAITING_CONFIRM')}
                >
                    <Text style={[styles.categoryText, { color: selectedCategory === 'AWAITING_CONFIRM' ? '#fff' : '#FFC107' }]}>
                        Chờ duyệt ({counts.AWAITING_CONFIRM})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[
                        styles.categoryBtn, 
                        { borderColor: '#F44336', backgroundColor: selectedCategory === 'CANCELED' ? '#F44336' : '#fff' }
                    ]}
                    onPress={() => setSelectedCategory('CANCELED')}
                >
                    <Text style={[styles.categoryText, { color: selectedCategory === 'CANCELED' ? '#fff' : '#F44336' }]}>
                        Đã hủy ({counts.CANCELED})
                    </Text>
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredBookings}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No bookings found in this category</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    venueName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    courtName: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
    },
    dateText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 14,
        color: '#888',
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
    categoryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        gap: 10,
    },
    categoryBtn: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
