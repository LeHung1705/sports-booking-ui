import CustomHeader from '@/components/ui/CustomHeader';
import { Colors } from '@/constants/Colors';
import { reviewApi } from '@/api/reviewApi';
import { ReviewRequest } from '@/types/review';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function ReviewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const bookingId = params.bookingId as string;
    const courtName = params.courtName as string || 'Sân bóng';
    const venueName = params.venueName as string || 'Địa điểm';

    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [loading, setLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        checkExistingReview();
    }, []);

    const checkExistingReview = async () => {
        setIsChecking(true);
        try {
            // Gọi API nếu cần kiểm tra review tồn tại
        } catch (error) {
            console.error('Lỗi khi kiểm tra review:', error);
        } finally {
            setIsChecking(false);
        }
    };

    const handleRating = (stars: number) => {
        setRating(stars);
    };

    const renderStars = () => {
        return (
            <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => handleRating(star)}
                        style={styles.starButton}
                        activeOpacity={0.7}
                        disabled={loading}
                    >
                        <Ionicons
                            name={star <= rating ? "star" : "star-outline"}
                            size={35}
                            color={star <= rating ? "#FFD700" : "#D1D5DB"}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Thiếu thông tin', 'Vui lòng chọn số sao đánh giá');
            return;
        }

        if (reviewText.trim().length < 10) {
            Alert.alert('Thiếu thông tin', 'Vui lòng viết ít nhất 10 ký tự cho đánh giá');
            return;
        }

        setLoading(true);
        try {
            const reviewRequest: ReviewRequest = {
                bookingId: bookingId,
                rating: rating,
                comment: reviewText.trim(),
            };

            const response = await reviewApi.creteReview(reviewRequest);
            console.log('Review created successfully:', response);
            
            Alert.alert(
                'Thành công',
                'Đánh giá của bạn đã được gửi. Cảm ơn bạn đã chia sẻ trải nghiệm!',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            router.back();
                        }
                    }
                ]
            );
        } catch (error: any) {
            console.error('Lỗi khi gửi đánh giá:', error);
            
            let errorMessage = 'Không thể gửi đánh giá. Vui lòng thử lại sau.';
            
            if (error.response) {
                const status = error.response.status;
                switch (status) {
                    case 400:
                        errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
                        break;
                    case 409:
                        errorMessage = 'Booking này đã được đánh giá trước đó.';
                        break;
                    default:
                        errorMessage = `Lỗi server (${status}). Vui lòng thử lại sau.`;
                }
                
                if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                }
            } else if (error.request) {
                errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra mạng.';
            } else if (error.message) {
                errorMessage = `Lỗi: ${error.message}`;
            }
            
            Alert.alert('Lỗi', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = rating > 0 && reviewText.trim().length >= 10;

    return (
        <View style={styles.container}>
            <CustomHeader 
                title="Chia sẻ trải nghiệm" 
                showBackButton={true}
            />

            <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.courtInfo}>
                    <Text style={styles.venueName} numberOfLines={1}>{venueName}</Text>
                    <Text style={styles.courtTitle}>{courtName}</Text>
                    <Text style={styles.courtSubtitle}>Hãy đánh giá trải nghiệm của bạn</Text>
                </View>

                <View style={styles.ratingSection}>
                    <Text style={styles.sectionTitle}>Đánh giá tổng thể</Text>
                    {renderStars()}
                    
                    <View style={styles.ratingTextContainer}>
                        <Text style={styles.ratingNumber}>
                            {rating > 0 ? `${rating}.0` : "0"}
                        </Text>
                        <Text style={styles.ratingTotal}>/5.0</Text>
                        <Text style={styles.ratingLabel}>
                            {rating > 0 ? getRatingLabel(rating) : "Chưa đánh giá"}
                        </Text>
                    </View>
                </View>

                <View style={styles.reviewSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Nội dung đánh giá</Text>
                        <Text style={styles.charCounter}>
                            {reviewText.length}/500
                        </Text>
                    </View>
                    
                    <TextInput
                        style={styles.reviewInput}
                        placeholder="Chia sẻ ít nhất 10 ký tự về trải nghiệm của bạn..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                        value={reviewText}
                        onChangeText={setReviewText}
                        maxLength={500}
                        editable={!loading}
                    />
                </View>

                <TouchableOpacity 
                    style={[
                        styles.bottomSubmitButton,
                        (!canSubmit || loading) && styles.bottomSubmitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={!canSubmit || loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <Text style={styles.bottomSubmitButtonText}>
                            <Ionicons name="time-outline" size={20} color="#fff" />
                            {' '}Đang gửi...
                        </Text>
                    ) : (
                        <Text style={styles.bottomSubmitButtonText}>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                            {' '}Gửi đánh giá
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const getRatingLabel = (rating: number): string => {
    switch (rating) {
        case 1: return 'Rất tệ';
        case 2: return 'Không hài lòng';
        case 3: return 'Bình thường';
        case 4: return 'Hài lòng';
        case 5: return 'Rất tốt';
        default: return '';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    courtInfo: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    venueName: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 2,
    },
    courtTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    courtSubtitle: {
        fontSize: 13,
        color: '#6B7280',
    },
    ratingSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    starContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    starButton: {
        padding: 4,
    },
    ratingTextContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 4,
    },
    ratingNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.primary,
    },
    ratingTotal: {
        fontSize: 14,
        color: '#6B7280',
        marginHorizontal: 2,
    },
    ratingLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 6,
        fontStyle: 'italic',
    },
    reviewSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewInput: {
        minHeight: 120,
        fontSize: 14,
        color: '#111827',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        lineHeight: 20,
    },
    charCounter: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    bottomSubmitButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    bottomSubmitButtonDisabled: {
        opacity: 0.6,
    },
    bottomSubmitButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});
