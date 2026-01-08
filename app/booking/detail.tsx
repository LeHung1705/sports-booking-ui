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
            console.error('Lỗi khi lấy chi tiết đặt sân:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin chi tiết đặt sân');
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
            Alert.alert('Không thể hủy', 'Lịch đặt sân này đã bắt đầu hoặc đã qua.');
            return;
        }

        // Hiển thị chính sách trước
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
                "Khách hàng yêu cầu hủy",
                {
                    bankName,
                    accountNumber,
                    accountHolderName: "Khách hàng"
                }
            );

            setIsCancelModalVisible(false);
            const refundAmt = res.refundAmount !== undefined && res.refundAmount !== null ? res.refundAmount : 0;
            Alert.alert('Thành công', `Đã gửi yêu cầu hủy. Số tiền hoàn dự kiến: ${refundAmt.toLocaleString('vi-VN')} VND`, [
                { text: 'OK', onPress: () => fetchBookingDetail() }
            ]);
        } catch (error: any) {
            Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể hủy đơn đặt sân');
        } finally {
            setCanceling(false);
        }
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return 'Không có';
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'CONFIRMED': return '#10B981';
            case 'PENDING': return '#F59E0B';
            case 'PENDING_PAYMENT': return '#F59E0B';
            case 'AWAITING_CONFIRM': return '#F59E0B';
            case 'CANCELED': return '#EF4444';
            case 'REJECTED': return '#EF4444';
            case 'FAILED': return '#EF4444';
            case 'COMPLETED': return '#6B7280';
            case 'REVIEWED': return '#3B82F6';
            case 'REFUND_PENDING': return '#8B5CF6';
            default: return '#3B82F6';
        }
    };

    const getStatusText = (status?: string) => {
        switch (status) {
            case 'CONFIRMED': return 'Đã xác nhận';
            case 'PENDING': return 'Chờ xử lý';
            case 'PENDING_PAYMENT': return 'Chờ thanh toán';
            case 'AWAITING_CONFIRM': return 'Chờ xác nhận';
            case 'CANCELED': return 'Đã hủy';
            case 'REJECTED': return 'Đã từ chối';
            case 'FAILED': return 'Thất bại';
            case 'COMPLETED': return 'Hoàn thành';
            case 'REVIEWED': return 'Đã đánh giá';
            case 'REFUND_PENDING': return 'Chờ hoàn tiền';
            default: return status || 'Không xác định';
        }
    };

    const renderBankItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={styles.bankItem}
            onPress={() => {
                setBankName(item);
                setShowBankPicker(false);
            }}
            activeOpacity={0.6}
        >
            <Text style={styles.bankItemText}>{item}</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.wrapper}>
                <CustomHeader title="Chi tiết đặt sân" showBackButton={true} />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Đang tải thông tin...</Text>
                </View>
            </View>
        );
    }

    if (!booking) {
        return (
            <View style={styles.wrapper}>
                <CustomHeader title="Chi tiết đặt sân" showBackButton={true} />
                <View style={styles.center}>
                    <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.notFoundText}>Không tìm thấy thông tin đặt sân</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.wrapper}>
            <CustomHeader title="Chi tiết đặt sân" showBackButton={true} />
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Header với tên sân và status */}
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <Text style={styles.venueName} numberOfLines={2}>
                            {booking.venue}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                            <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
                        </View>
                    </View>
                </View>

                {/* Thông tin sân */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Thông tin sân</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={18} color="#6B7280" />
                        <Text style={styles.infoText}>Sân: {booking.court}</Text>
                    </View>
                </View>

                {/* Thời gian */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Thời gian</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={18} color="#6B7280" />
                        <Text style={styles.infoText}>Bắt đầu: {formatDateTime(booking.startTime)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={18} color="#6B7280" />
                        <Text style={styles.infoText}>Kết thúc: {formatDateTime(booking.endTime)}</Text>
                    </View>
                </View>

                {/* Thanh toán */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Thanh toán</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="pricetag-outline" size={18} color="#6B7280" />
                        <Text style={styles.infoText}>Tổng tiền: {booking.totalPrice?.toLocaleString('vi-VN')} VND</Text>
                    </View>
                </View>

                {/* Thông tin thanh toán */}
                {booking.payment && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment</Text>
                        <View style={styles.row}>
                            <Ionicons name="card-outline" size={20} color="#666" />
                            <Text style={styles.infoText}>Amount: {Number(booking.payment.amount ?? 0).toLocaleString('vi-VN')} VND</Text>
                        </View>
                        <View style={styles.row}>
                            <Ionicons name="information-circle-outline" size={20} color="#666" />
                            <Text style={styles.infoText}>Status: {(booking.payment as any)?.status ?? 'N/A'}</Text>
                        </View>
                    </View>
                )}

                {/* Nút hủy đặt sân */}
                {booking.status !== 'CANCELED' && booking.status !== 'COMPLETED' && booking.status !== 'FAILED' &&
                    new Date(booking.startTime).getTime() > new Date().getTime() && (
                        <TouchableOpacity
                            style={[styles.cancelButton, canceling && styles.disabledButton]}
                            onPress={handleCancel}
                            disabled={canceling}
                            activeOpacity={0.8}
                        >
                            {canceling ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Ionicons name="close-circle-outline" size={20} color="#fff" />
                                    <Text style={styles.cancelButtonText}> Hủy đặt sân</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                {/* Banner đã hủy */}
                {booking.status === 'CANCELED' && (
                    <View style={styles.canceledBanner}>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#059669" />
                        <Text style={styles.canceledText}>Đơn đặt sân này đã bị hủy</Text>
                    </View>
                )}

            </ScrollView>

            {/* Modal chính sách */}
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
                    3. <Text style={styles.bold}>Xử lý:</Text> Hệ thống ghi nhận yêu cầu hủy và tính toán số tiền được hoàn (dựa trên chính sách ở mục 2). Trạng thái đơn chuyển thành <Text style={{ fontStyle: 'italic' }}>Chờ hoàn tiền</Text>.{"\n"}
                    4. <Text style={styles.bold}>Nhận tiền:</Text> Chủ sân sẽ kiểm tra và chuyển khoản ngược lại vào tài khoản bạn đã cung cấp.{"\n"}
                    5. <Text style={styles.bold}>Hoàn tất:</Text> Sau khi Chủ sân xác nhận đã chuyển, trạng thái đơn đổi thành <Text style={{ fontStyle: 'italic' }}>Đã hủy</Text> và bạn nhận được thông báo.
                </Text>

                <Text style={styles.policyNote}>
                    *Bấm "Tôi đã hiểu và muốn Hủy" đồng nghĩa với việc bạn đã hiểu và đồng ý với toàn bộ chính sách trên.*
                </Text>
            </PolicyModal>

            {/* Modal hủy đặt sân & chọn ngân hàng */}
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
                                    ItemSeparatorComponent={() => <View style={styles.bankSeparator} />}
                                    contentContainerStyle={styles.bankListContent}
                                />
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalButtonCancel, { marginTop: 10 }]}
                                    onPress={() => setShowBankPicker(false)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.modalButtonTextCancel}>Quay lại</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.modalTitle}>Thông tin nhận tiền hoàn</Text>

                                <View style={styles.modalWarning}>
                                    <Ionicons name="information-circle-outline" size={20} color="#92400E" />
                                    <Text style={styles.modalWarningText}>{refundMessage}</Text>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.modalLabel}>Tên Ngân hàng</Text>
                                    <TouchableOpacity
                                        style={styles.modalInputSelector}
                                        onPress={() => setShowBankPicker(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={{ color: bankName ? '#1F2937' : '#9CA3AF', fontSize: 16 }}>
                                            {bankName || "Chọn ngân hàng"}
                                        </Text>
                                        <Ionicons name="chevron-down-outline" size={20} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.modalLabel}>Số Tài khoản</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="VD: 0123456789"
                                        value={accountNumber}
                                        onChangeText={setAccountNumber}
                                        keyboardType="numeric"
                                    />
                                </View>

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.modalButtonCancel]}
                                        onPress={() => setIsCancelModalVisible(false)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.modalButtonTextCancel}>Đóng</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.modalButtonConfirm]}
                                        onPress={handleSubmitCancel}
                                        disabled={canceling}
                                        activeOpacity={0.7}
                                    >
                                        {canceling ? (
                                            <ActivityIndicator color="white" size="small" />
                                        ) : (
                                            <>
                                                <Ionicons name="send-outline" size={16} color="#fff" />
                                                <Text style={styles.modalButtonTextConfirm}>Gửi yêu cầu</Text>
                                            </>
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
    wrapper: {
        flex: 1,
        backgroundColor: '#F9FAFB'
    },
    container: {
        padding: 16
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    notFoundText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    header: {
        marginBottom: 24,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    venueName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        marginRight: 12,
        lineHeight: 28,
    },
    courtName: {
        fontSize: 16,
        color: '#4B5563',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
        letterSpacing: 0.2,
    },
    card: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 16
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12
    },
    infoText: {
        marginLeft: 12,
        fontSize: 15,
        color: '#4B5563',
        flex: 1,
        lineHeight: 22,
    },
    cancelButton: {
        backgroundColor: '#EF4444',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    disabledButton: {
        opacity: 0.7
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600'
    },
    canceledBanner: {
        backgroundColor: '#D1FAE5',
        padding: 20,
        borderRadius: 12,
        marginTop: 24,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    canceledText: {
        color: '#065F46',
        fontSize: 16,
        fontWeight: '600'
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 20,
        color: '#111827'
    },
    modalWarning: {
        backgroundColor: '#FEF3C7',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    modalWarningText: {
        color: '#92400E',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
        lineHeight: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#F9FAFB',
        color: '#1F2937',
    },
    modalInputSelector: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    modalButtonCancel: {
        backgroundColor: '#F3F4F6',
    },
    modalButtonConfirm: {
        backgroundColor: Colors.primary,
    },
    modalButtonTextCancel: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 16
    },
    modalButtonTextConfirm: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16
    },

    // Bank Picker Styles
    bankItem: {
        paddingVertical: 16,
        paddingHorizontal: 12
    },
    bankItemText: {
        fontSize: 16,
        color: '#374151'
    },
    bankSeparator: {
        height: 1,
        backgroundColor: '#E5E7EB'
    },
    bankListContent: {
        paddingBottom: 20
    },

    // Policy Styles
    policyHeader: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginTop: 16,
        marginBottom: 8
    },
    policyText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 22,
        marginBottom: 12
    },
    policyNote: {
        fontSize: 13,
        fontStyle: 'italic',
        color: '#6B7280',
        marginTop: 16,
        textAlign: 'center',
        lineHeight: 18,
    },
    bold: {
        fontWeight: '600',
        color: '#111827'
    },
});