import apiClient from "./apiClient";
import { 
    ApiVenueAvailabilityResponse, 
    BookingListResponse, 
    BookingPayload, 
    BookingResponse 
} from "../types/booking";
import { BookingApplyVoucherResponse } from "../types/voucher";

export const bookingApi = {
  /**
   * Create a new booking
   * POST /api/v1/bookings
   */
  createBooking: async (payload: BookingPayload): Promise<BookingResponse> => {
    const res = await apiClient.post<BookingResponse>("/bookings", payload);
    return res.data;
  },

  /**
   * List user's bookings
   * GET /api/v1/bookings
   */
  getMyBookings: async (params?: { status?: string; from?: string; to?: string }): Promise<BookingListResponse[]> => {
    const res = await apiClient.get<BookingListResponse[]>("/bookings", { params });
    return res.data;
  },

  /**
   * List owner's bookings with filters
   * GET /api/v1/bookings/owner
   */
  getOwnerBookings: async (params?: { statuses?: string[]; venueId?: string; from?: string; to?: string }): Promise<BookingListResponse[]> => {
      const res = await apiClient.get<BookingListResponse[]>("/bookings/owner", { 
        params,
        paramsSerializer: {
           indexes: null // This ensures arrays are sent as `statuses=A&statuses=B` (no brackets) which Spring Boot prefers
        }
      });
      return res.data;
  },

  /**
   * List owner's pending bookings (awaiting confirmation)
   * GET /api/v1/bookings/owner/pending
   */
  getOwnerPendingBookings: async (): Promise<BookingListResponse[]> => {
      const res = await apiClient.get<BookingListResponse[]>("/bookings/owner/pending");
      return res.data;
  },

  /**
   * Get detailed booking info
   * GET /api/v1/bookings/{id}
   */
  getBookingDetail: async (id: string): Promise<import("../types/booking").BookingDetailResponse> => {
      const res = await apiClient.get<import("../types/booking").BookingDetailResponse>(`/bookings/${id}`);
      return res.data;
  },

  /**
   * Cancel a booking
   * PUT /api/v1/bookings/{id}/cancel
   */
  cancelBooking: async (id: string, reason: string): Promise<import("../types/booking").BookingCancelResponse> => {
      const res = await apiClient.put<import("../types/booking").BookingCancelResponse>(`/bookings/${id}/cancel`, {
          cancelReason: reason
      });
      return res.data;
  },

  /**
   * Check availability (Real Endpoint)
   * GET /api/v1/venues/{id}/availability?date=YYYY-MM-DD
   */
  getVenueAvailability: async (venueId: string, date: string): Promise<ApiVenueAvailabilityResponse> => {
    // Convert date object or string to YYYY-MM-DD if needed, assuming input is already formatted or simple date string
    const res = await apiClient.get<ApiVenueAvailabilityResponse>(`/venues/${venueId}/availability`, {
        params: { date }
    });
    return res.data;
  },

  /**
   * Apply a voucher to a booking
   * PUT /api/v1/bookings/{id}/apply-voucher
   */
  applyVoucher: async (bookingId: string, voucherCode: string): Promise<BookingApplyVoucherResponse> => {
    const res = await apiClient.put<BookingApplyVoucherResponse>(`/bookings/${bookingId}/apply-voucher`, {
      voucher_code: voucherCode
    });
    return res.data;
  },

  /**
   * Remove a voucher from a booking
   * PUT /api/v1/bookings/{id}/remove-voucher
   */
  removeVoucher: async (bookingId: string): Promise<any> => {
    const res = await apiClient.put(`/bookings/${bookingId}/remove-voucher`);
    return res.data;
  },

  /**
   * Mark a booking as paid (User action)
   * PUT /api/v1/bookings/{id}/mark-paid
   */
  markBookingAsPaid: async (
    bookingId: string, 
    refundBankInfo?: { 
      refundBankName: string; 
      refundAccountNumber: string; 
      refundAccountName: string 
    }
  ): Promise<import("../types/booking").BookingDetailResponse> => {
    const res = await apiClient.put<import("../types/booking").BookingDetailResponse>(
      `/bookings/${bookingId}/mark-paid`, 
      refundBankInfo
    );
    return res.data;
  },

  /**
   * Confirm payment (Owner action)
   * PUT /api/v1/bookings/{id}/confirm-payment
   */
  confirmBooking: async (bookingId: string): Promise<import("../types/booking").BookingDetailResponse> => {
      const res = await apiClient.put<import("../types/booking").BookingDetailResponse>(`/bookings/${bookingId}/confirm-payment`);
      return res.data;
  },

  /**
   * Get revenue stats for owner
   * GET /api/v1/bookings/owner/revenue-stats
   */
  getRevenueStats: async (params?: { from?: string; to?: string }): Promise<{date: string, value: number, count: number}[]> => {
    const res = await apiClient.get<{date: string, value: number, count: number}[]>("/bookings/owner/revenue-stats", { params });
    return res.data;
  }
};

