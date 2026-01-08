import CustomHeader from '@/components/ui/CustomHeader';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
    StatusBar
} from 'react-native';
import { bookingApi } from '../../api/bookingApi';
import { Colors } from '../../constants/Colors';
import { BookingListResponse } from '../../types/booking';

type Category = 'ALL' | 'CONFIRMED' | 'AWAITING_CONFIRM' | 'CANCELED' | 'PENDING_REVIEW' | 'REVIEWED';

export default function MyBookingsScreen() {
    const router = useRouter();
    const [bookings, setBookings] = useState<BookingListResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<'CONFIRMED' | 'AWAITING_CONFIRM' | 'CANCELED'>('CONFIRMED');
    
    const { highlightId } = useLocalSearchParams<{ highlightId: string }>();

    // Effect to switch tab if highlightId is present
    useEffect(() => {
        if (highlightId && bookings.length > 0) {
            const target = bookings.find(b => b.id === highlightId);
            if (target) {
                if (['CONFIRMED', 'COMPLETED'].includes(target.status)) setSelectedCategory('CONFIRMED');
                else if (['AWAITING_CONFIRM', 'PENDING_PAYMENT', 'PENDING'].includes(target.status)) setSelectedCategory('AWAITING_CONFIRM');
                else setSelectedCategory('CANCELED');
            }
        }
    }, [highlightId, bookings]);

    const fetchBookings = async () => {
        try {
            const data = await bookingApi.getMyBookings();
            const sorted = data.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
            setBookings(sorted);
        } catch (error) {
            console.error('Lỗi khi fetch bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchBookings();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const counts = {
        CONFIRMED: bookings.filter(b => ['CONFIRMED'].includes(b.status)).length,
        AWAITING_CONFIRM: bookings.filter(b => ['AWAITING_CONFIRM', 'PENDING_PAYMENT', 'PENDING'].includes(b.status)).length,
        CANCELED: bookings.filter(b => ['CANCELED', 'REFUND_PENDING', 'REJECTED', 'FAILED'].includes(b.status)).length,
        PENDING_REVIEW: bookings.filter(b => b.status === 'COMPLETED').length,
        REVIEWED: bookings.filter(b => b.status === 'REVIEWED').length,
    };

    const categories: Category[] = ['ALL', 'CONFIRMED', 'AWAITING_CONFIRM', 'CANCELED', 'PENDING_REVIEW', 'REVIEWED'];
    const categoryLabels: Record<Category, string> = {
        ALL: 'Tất cả',
        CONFIRMED: 'Đã duyệt',
        AWAITING_CONFIRM: 'Chờ duyệt',
        CANCELED: 'Đã hủy',
        PENDING_REVIEW: 'Chưa đánh giá',
        REVIEWED: 'Đã đánh giá',
    };

    const filteredBookings = bookings.filter(b => {
        switch (selectedCategory) {
            case 'ALL': return true;
            case 'CONFIRMED': return ['CONFIRMED'].includes(b.status);
            case 'AWAITING_CONFIRM': return ['AWAITING_CONFIRM', 'PENDING_PAYMENT', 'PENDING'].includes(b.status);
            case 'CANCELED': return ['CANCELED', 'REFUND_PENDING', 'REJECTED', 'FAILED'].includes(b.status);
            case 'PENDING_REVIEW': return b.status === 'COMPLETED';
            case 'REVIEWED': return b.status === 'REVIEWED';
            default: return false;
        }
    });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return { color: '#10B981', text: 'Đã xác nhận' };
            case 'PENDING':
            case 'PENDING_PAYMENT':
                return { color: '#F59E0B', text: 'Chờ thanh toán' };
            case 'AWAITING_CONFIRM':
                return { color: '#F59E0B', text: 'Chờ xác nhận' };
            case 'CANCELED':
            case 'REJECTED':
            case 'FAILED':
                return { color: '#EF4444', text: 'Đã hủy' };
            case 'COMPLETED':
                return { color: '#6B7280', text: 'Hoàn thành' };
            case 'REVIEWED':
                return { color: '#3B82F6', text: 'Đã đánh giá' };
            case 'REFUND_PENDING':
                return { color: '#8B5CF6', text: 'Hoàn tiền' };
            default:
                return { color: '#3B82F6', text: status };
        }
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const bookingDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        let dayPrefix = '';
        if (bookingDate.getTime() === today.getTime()) {
            dayPrefix = 'Hôm nay, ';
        } else if (bookingDate.getTime() === yesterday.getTime()) {
            dayPrefix = 'Hôm qua, ';
        }

        const timeStr = date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        if (dayPrefix) {
            return `${dayPrefix}${timeStr}`;
        }

        return date.toLocaleDateString('vi-VN', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        }) + `, ${timeStr}`;
    };

    const renderItem = ({ item }: { item: BookingListResponse }) => {
        const isHighlighted = highlightId === item.id;
        return (
        <TouchableOpacity 
            style={[styles.card, isHighlighted && styles.highlightedCard]}
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
                    <Text style={styles.totalLabel}>Tổng tiền</Text>
                    <Text style={styles.price}>{item.totalPrice?.toLocaleString('vi-VN')} VND</Text>
                </View>

                {item.status === 'COMPLETED' && (
                    <TouchableOpacity
                        style={styles.reviewBtn}
                        onPress={() => router.push({
                            pathname: '/booking/review',
                            params: {
                                bookingId: item.id,
                                courtName: item.court,
                                venueName: item.venue
                            }
                        })}
                    >
                        <Text style={styles.reviewBtnText}>Viết đánh giá</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>
                {selectedCategory === 'ALL'
                    ? 'Bạn chưa có đơn đặt sân nào'
                    : `Không có đơn đặt sân trong mục "${categoryLabels[selectedCategory]}"`}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* StatusBar - Điều chỉnh cho từng platform */}
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#F9FAFB"
                translucent={Platform.OS === 'android'}
            />

            <CustomHeader title="Lịch sử đặt sân" showBackButton={true} />

            {/* Category Tabs - Dùng View thay vì FlatList cho đơn giản */}
            <View style={styles.categoryWrapper}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={categories}
                    keyExtractor={(item) => item}
                    contentContainerStyle={styles.categoryListContent}
                    renderItem={({ item: cat }) => {
                        const isSelected = selectedCategory === cat;
                        return (
                            <TouchableOpacity
                                style={[
                                    styles.categoryBtn,
                                    isSelected && styles.categoryBtnSelected,
                                ]}
                                onPress={() => setSelectedCategory(cat)}
                                activeOpacity={0.8}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    isSelected && styles.categoryTextSelected
                                ]}>
                                    {categoryLabels[cat]}
                                </Text>
                                {cat !== 'ALL' && counts[cat] > 0 && (
                                    <View style={[
                                        styles.categoryCount,
                                        isSelected && styles.categoryCountSelected
                                    ]}>
                                        <Text style={[
                                            styles.categoryCountText,
                                            isSelected && styles.categoryCountTextSelected
                                        ]}>
                                            {counts[cat]}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredBookings}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[
                        styles.listContent,
                        filteredBookings.length === 0 && styles.emptyListContent
                    ]}
                    style={styles.mainList}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.primary]}
                            tintColor={Colors.primary}
                        />
                    }
                    ListEmptyComponent={renderEmptyComponent}
                    showsVerticalScrollIndicator={true}
                    removeClippedSubviews={Platform.OS === 'android'}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    mainList: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    emptyListContent: {
        flexGrow: 1,
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
    highlightedCard: {
        borderWidth: 2,
        borderColor: Colors.primary,
        backgroundColor: '#E8F5E9',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    venueName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
        marginRight: 12
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500'
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6
    },
    courtName: {
        fontSize: 14,
        color: '#4B5563',
        marginLeft: 8
    },
    dateText: {
        fontSize: 14,
        color: '#4B5563',
        marginLeft: 8
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    totalLabel: {
        fontSize: 14,
        color: '#6B7280'
    },
    price: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primary
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 24,
    },
    // Category Styles
    categoryWrapper: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        minHeight: 56,
        justifyContent: 'center',
    },
    categoryListContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
    },
    categoryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        gap: 6,
        marginRight: 8,
    },
    categoryBtnSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6B7280',
    },
    categoryTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    categoryCount: {
        backgroundColor: '#E5E7EB',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    categoryCountSelected: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    categoryCountText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#4B5563',
    },
    categoryCountTextSelected: {
        color: '#fff',
    },
    reviewBtn: {
        marginTop: 12,
        paddingVertical: 10,
        backgroundColor: Colors.primary,
        borderRadius: 8,
        alignItems: 'center'
    },
    reviewBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14
    },
});