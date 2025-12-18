import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { bookingApi } from '../../api/bookingApi';
import { BookingDetailResponse } from '../../types/booking';
import { Colors } from '../../constants/Colors';
import CustomHeader from '@/components/ui/CustomHeader';

const VIETNAM_BANKS = [
    "Vietcombank", "BIDV", "VietinBank", "Agribank", "Techcombank", "VPBank", "MB Bank", "ACB", 
    "Sacombank", "VIB", "TPBank", "LPBank (LienVietPostBank)", "MSB", "SHB", "OCB", "Eximbank", "SCB"
];

export default function BookingDetailScreen() {
    const { id } = useLocalSearchParams();
    const [booking, setBooking] = useState<BookingDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [canceling, setCanceling] = useState(false);
    
    // Cancel Modal State
    const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [refundMessage, setRefundMessage] = useState('');
    const [showBankPicker, setShowBankPicker] = useState(false);

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

    const handleCancel = () => {
        if (!booking) return;

        const startTime = new Date(booking.startTime);
        const now = new Date();
        const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilStart < 0) {
            Alert.alert('Cannot Cancel', 'This booking has already started or passed.');
            return;
        }

        let message = "";
        if (hoursUntilStart > 6) {
            message = "Chính sách: Hoàn 100% tiền cọc (Trước 6h)";
        } else if (hoursUntilStart >= 2) {
            message = "Chính sách: Hoàn 50% tiền cọc (2h - 6h)";
        } else {
            message = "Chính sách: Không hoàn tiền (Dưới 2h)";
        }
        setRefundMessage(message);
        setIsCancelModalVisible(true);
    };

    const handleSubmitCancel = async () => {
        if (!booking) return;

        if (!bankName || !accountNumber.trim()) {
            Alert.alert('Thông báo', 'Vui lòng chọn ngân hàng và điền số tài khoản.');
            return;
        }

        setCanceling(true);
        try {
            const res = await bookingApi.cancelBooking(
                booking.id, 
                "User requested cancellation",
                {
                    bankName,
                    accountNumber,
                    accountHolderName: "Khach Hang" // Placeholder to satisfy backend validation
                }
            );
            
            setIsCancelModalVisible(false);
            const refundAmt = res.refundAmount !== undefined && res.refundAmount !== null ? res.refundAmount : 0;
            Alert.alert('Thành công', `Đã gửi yêu cầu huỷ. Số tiền hoàn dự kiến: ${refundAmt.toLocaleString('vi-VN')} VND`, [
                { text: 'OK', onPress: () => fetchBookingDetail() }
            ]);
        } catch (error: any) {
            Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể huỷ đơn');
        } finally {
            setCanceling(false);
        }
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

    const renderBankItem = ({ item }: { item: string }) => (
        <TouchableOpacity 
            style={styles.bankItem}
            onPress={() => {
                setBankName(item);
                setShowBankPicker(false);
            }}
        >
            <Text style={styles.bankItemText}>{item}</Text>
        </TouchableOpacity>
    );

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

            {/* Unified Cancel & Bank Picker Modal */}
            <Modal
                visible={isCancelModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => {
                    if (showBankPicker) setShowBankPicker(false);
                    else setIsCancelModalVisible(false);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, showBankPicker && { height: '60%' }]}>
                        {showBankPicker ? (
                            <>
                                <Text style={styles.modalTitle}>Chọn Ngân hàng</Text>
                                <FlatList
                                    data={VIETNAM_BANKS}
                                    keyExtractor={(item) => item}
                                    renderItem={renderBankItem}
                                    ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#eee' }} />}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                />
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.modalButtonCancel, { marginTop: 10 }]}
                                    onPress={() => setShowBankPicker(false)}
                                >
                                    <Text style={styles.modalButtonTextCancel}>Quay lại</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.modalTitle}>Yêu cầu Hủy & Hoàn tiền</Text>
                                
                                <View style={styles.modalWarning}>
                                     <Text style={styles.modalWarningText}>{refundMessage}</Text>
                                </View>

                                <Text style={styles.modalLabel}>Tên Ngân hàng</Text>
                                <TouchableOpacity 
                                    style={styles.modalInputSelector}
                                    onPress={() => setShowBankPicker(true)}
                                >
                                    <Text style={{ color: bankName ? '#000' : '#999' }}>{bankName || "Chọn ngân hàng"}</Text>
                                    <Ionicons name="chevron-down-outline" size={20} color="#666" />
                                </TouchableOpacity>

                                <Text style={styles.modalLabel}>Số Tài khoản</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="VD: 0123456789"
                                    value={accountNumber}
                                    onChangeText={setAccountNumber}
                                    keyboardType="numeric"
                                />

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity 
                                        style={[styles.modalButton, styles.modalButtonCancel]}
                                        onPress={() => setIsCancelModalVisible(false)}
                                    >
                                        <Text style={styles.modalButtonTextCancel}>Đóng</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        style={[styles.modalButton, styles.modalButtonConfirm]}
                                        onPress={handleSubmitCancel}
                                        disabled={canceling}
                                    >
                                        {canceling ? (
                                            <ActivityIndicator color="white" size="small" />
                                        ) : (
                                            <Text style={styles.modalButtonTextConfirm}>Gửi yêu cầu</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
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
    canceledText: { color: '#c62828', fontSize: 16, fontWeight: 'bold' },
    
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 16, color: '#333' },
    modalWarning: { backgroundColor: '#fff3cd', padding: 12, borderRadius: 8, marginBottom: 16 },
    modalWarningText: { color: '#856404', textAlign: 'center', fontSize: 14 },
    modalLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6 },
    modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
    modalInputSelector: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    modalButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    modalButtonCancel: { backgroundColor: '#f5f5f5', marginRight: 10 },
    modalButtonConfirm: { backgroundColor: Colors.primary, marginLeft: 10 },
    modalButtonTextCancel: { color: '#666', fontWeight: '600', fontSize: 16 },
    modalButtonTextConfirm: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    
    bankItem: { paddingVertical: 14, paddingHorizontal: 10 },
    bankItemText: { fontSize: 16, color: '#333' },
});
