export interface VoucherPreviewRequest {
    code: string;
    order_amount: number;
    venue_id: string;
    user_id?: string;
}

export interface VoucherPreviewResponse {
    valid: boolean;
    discount: number;
    reason: string;
}

export interface BookingApplyVoucherRequest {
    voucher_code: string;
}

export interface BookingApplyVoucherResponse {
    id: string; // Booking UUID
    original_price: number;
    discount_value: number;
    total_amount: number;
    voucher_code: string;
}
