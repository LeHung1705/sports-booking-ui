import CustomHeader from '@/components/ui/CustomHeader';
import PolicyModal from '@/components/ui/PolicyModal';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { bookingApi } from '../../api/bookingApi';
import { Colors } from '../../constants/Colors';
import { BookingDetailResponse } from '../../types/booking';

const VIETNAM_BANKS = [
    "Vietcombank", "BIDV", "VietinBank", "Agribank", "Techcombank", "VPBank", "MB Bank", "ACB", 
    "Sacombank", "VIB", "TPBank", "LPBank (LienVietPostBank)", "MSB", "SHB", "OCB", "Eximbank", "SCB"
];

export default function BookingDetailScreen() {
    const { id } = useLocalSearchParams();
    const [booking, setBooking] = useState<BookingDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [canceling, setCanceling] = useState(false);
    
    // Policy Modal State
    const [showPolicy, setShowPolicy] = useState(false);

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

        // Show Policy First
        setShowPolicy(true);
    };

    const onPolicyConfirm = () => {
        setShowPolicy(false);
        if (!booking) return;

        const startTime = new Date(booking.startTime);
        const now = new Date();
        const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

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

            {/* Policy Modal */}
            <PolicyModal
                visible={showPolicy}
                title="CHÍNH SÁCH HỦY & HOÀN TIỀN"
                onConfirm={onPolicyConfirm}
                onCancel={() => setShowPolicy(false)}
                confirmText="Tôi đã hiểu và muốn Hủy"
            >
                 <Text style={styles.policyHeader}>1. Chính sách Hủy sân & Hoàn tiền</Text>
                 <Text style={styles.policyText}>
                   Số tiền được hoàn lại phụ thuộc vào thời điểm bạn yêu cầu hủy so với giờ bắt đầu:{"\n"}
                   • <Text style={styles.bold}>Hủy sớm (Trước {">"} 6 tiếng):</Text> Hoàn lại <Text style={styles.bold}>100%</Text> số tiền đã thanh toán.{"\n"}
                   • <Text style={styles.bold}>Hủy cận giờ (Từ 2 - 6 tiếng):</Text> Hoàn lại <Text style={styles.bold}>50%</Text> số tiền đã thanh toán.{"\n"}
                   • <Text style={styles.bold}>Hủy gấp ({"<"} 2 tiếng):</Text> <Text style={styles.bold}>Không hoàn tiền</Text>.{"\n"}
                   • <Text style={styles.bold}>Lỗi từ sân:</Text> Nếu lịch bị hủy do lỗi hệ thống hoặc từ phía chủ sân, bạn được hoàn <Text style={styles.bold}>100%</Text> ngay lập tức bất kể thời gian.
                 </Text>

                 <Text style={styles.policyHeader}>2. Quy trình Hoàn tiền (Khi hủy sân)</Text>
                 <Text style={styles.policyText}>
                   Do thanh toán được chuyển trực tiếp cho Chủ sân, quy trình hoàn tiền sẽ thực hiện như sau:{"\n"}
                   1. <Text style={styles.bold}>Yêu cầu hủy:</Text> Bạn bấm "Hủy đặt sân" trên ứng dụng.{"\n"}
                   2. <Text style={styles.bold}>Cung cấp thông tin:</Text> Nhập thông tin tài khoản ngân hàng của bạn (Tên NH, Số TK, Tên chủ TK) để nhận tiền hoàn.{"\n"}
                   3. <Text style={styles.bold}>Xử lý:</Text> Hệ thống ghi nhận yêu cầu hủy và tính toán số tiền được hoàn (dựa trên chính sách ở mục 2). Trạng thái đơn chuyển thành <Text style={{fontStyle:'italic'}}>Chờ hoàn tiền</Text>.{"\n"}
                   4. <Text style={styles.bold}>Nhận tiền:</Text> Chủ sân sẽ kiểm tra và chuyển khoản ngược lại vào tài khoản bạn đã cung cấp.{"\n"}
                   5. <Text style={styles.bold}>Hoàn tất:</Text> Sau khi Chủ sân xác nhận đã chuyển, trạng thái đơn đổi thành <Text style={{fontStyle:'italic'}}>Đã hủy</Text> và bạn nhận được thông báo.
                 </Text>
                 
                 <Text style={styles.policyNote}>
                     *Bấm "Tôi đã hiểu và muốn Hủy" đồng nghĩa với việc bạn đã hiểu và đồng ý với toàn bộ chính sách trên.*
                 </Text>
            </PolicyModal>

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
                                <Text style={styles.modalTitle}>Thông tin nhận tiền hoàn</Text>
                                
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

    // Policy Styles
    policyHeader: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginTop: 12, marginBottom: 8 },
    policyText: { fontSize: 14, color: '#444', lineHeight: 22, marginBottom: 8 },
    policyNote: { fontSize: 13, fontStyle: 'italic', color: '#666', marginTop: 12, textAlign: 'center' },
    bold: { fontWeight: 'bold', color: '#000' },
});
