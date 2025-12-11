import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { bookingApi } from '../../api/bookingApi';
import { BookingDetailResponse } from '../../types/booking';
import { Colors } from '../../constants/Colors';
import CustomHeader from '@/components/ui/CustomHeader';

export default function BookingDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [booking, setBooking] = useState<BookingDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [canceling, setCanceling] = useState(false);

    useEffect(() => {
        if (id) {
            fetchBookingDetail();
        }
    }, [id]);

    const fetchBookingDetail = async () => {
        try {
            const data = await bookingApi.getBookingDetail(id as string);
            setBooking(data);
        } catch (error) {
            console.error('Error fetching booking detail:', error);
            Alert.alert('Error', 'Failed to load booking details');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!booking) return;

        const startTime = new Date(booking.startTime);
        const now = new Date();
        const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilStart < 0) {
            Alert.alert('Cannot Cancel', 'This booking has already started or passed.');
            return;
        }

        let refundMessage = "";
        let refundPercentage = 0;

        if (hoursUntilStart > 6) {
            refundMessage = "You will receive a 100% refund of the deposit.";
            refundPercentage = 100;
        } else if (hoursUntilStart >= 2) {
            refundMessage = "You will receive a 50% refund of the deposit.";
            refundPercentage = 50;
        } else {
            refundMessage = "You will NOT receive any refund (0%).";
            refundPercentage = 0;
        }

        Alert.alert(
            'Cancel Booking?',
            `${refundMessage}\n\nAre you sure you want to cancel?`,
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        setCanceling(true);
                        try {
                            const res = await bookingApi.cancelBooking(booking.id, "User requested cancellation");
                            Alert.alert('Success', `Booking canceled. Refund amount: ${res.refundAmount?.toLocaleString('vi-VN')} VND`, [
                                { text: 'OK', onPress: () => fetchBookingDetail() }
                            ]);
                        } catch (error: any) {
                            Alert.alert('Error', error?.response?.data?.message || 'Failed to cancel booking');
                        } finally {
                            setCanceling(false);
                        }
                    }
                }
            ]
        );
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'CONFIRMED': return '#4CAF50';
            case 'PENDING': return '#FFC107';
            case 'CANCELED': return '#F44336';
            case 'COMPLETED': return '#9E9E9E';
            default: return '#2196F3';
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!booking) {
        return (
            <View style={styles.center}>
                <Text>Booking not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.wrapper}>
            <CustomHeader title="Chi tiết đặt sân" showBackButton={true} />
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.courtName}>{booking.venue} - {booking.court}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                        <Text style={styles.statusText}>{booking.status || 'UNKNOWN'}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Time</Text>
                    <View style={styles.row}>
                        <Ionicons name="time-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>Start: {formatDateTime(booking.startTime)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Ionicons name="time-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>End:   {formatDateTime(booking.endTime)}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                     <Text style={styles.sectionTitle}>Price Details</Text>
                     <View style={styles.row}>
                        <Ionicons name="pricetag-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>Total: {booking.totalPrice?.toLocaleString('vi-VN')} VND</Text>
                     </View>
                </View>

                {booking.payment && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment</Text>
                        <View style={styles.row}>
                            <Ionicons name="card-outline" size={20} color="#666" />
                            <Text style={styles.infoText}>Amount: {booking.payment.amount?.toLocaleString('vi-VN')} VND</Text>
                        </View>
                        <View style={styles.row}>
                            <Ionicons name="information-circle-outline" size={20} color="#666" />
                            <Text style={styles.infoText}>Status: {booking.payment.status}</Text>
                        </View>
                    </View>
                )}

                {/* Cancel Button */}
                { booking.status !== 'CANCELED' && booking.status !== 'COMPLETED' && booking.status !== 'FAILED' &&
                  new Date(booking.startTime).getTime() > new Date().getTime() && (
                    <TouchableOpacity 
                        style={[styles.cancelButton, canceling && styles.disabledButton]} 
                        onPress={handleCancel}
                        disabled={canceling}
                    >
                        {canceling ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                        )}
                    </TouchableOpacity>
                )}
                
                { booking.status === 'CANCELED' && (
                    <View style={styles.canceledBanner}>
                        <Text style={styles.canceledText}>This booking has been canceled.</Text>
                    </View>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: '#f5f5f5' },
    container: { padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { marginBottom: 24 },
    courtName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    statusText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    section: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    infoText: { marginLeft: 10, fontSize: 15, color: '#555' },
    cancelButton: { backgroundColor: '#F44336', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
    disabledButton: { opacity: 0.7 },
    cancelButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    canceledBanner: { backgroundColor: '#ffebee', padding: 16, borderRadius: 12, marginTop: 24, alignItems: 'center' },
    canceledText: { color: '#c62828', fontSize: 16, fontWeight: 'bold' }
});
