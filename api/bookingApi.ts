import apiClient from "./apiClient";
import { 
    ApiVenueAvailabilityResponse, 
    BookingListResponse, 
    BookingPayload, 
    BookingResponse 
} from "../types/booking";

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
   * Get detailed booking info
   * GET /api/v1/bookings/{id}
   */
  getBookingDetail: async (id: string) => {
      const res = await apiClient.get(`/bookings/${id}`);
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
  }
};
