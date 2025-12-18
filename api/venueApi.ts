import apiClient from "./apiClient";
import type { VenueDetail, VenueListItem, VenueListRequest } from "@/types/venue";
import type { ApiVenueAvailabilityResponse } from "@/types/booking";
import type { VenueUpdateRequest } from "@/types/venue";

export const venueApi = {
  async listVenues(params?: VenueListRequest): Promise<VenueListItem[]> {
    const res = await apiClient.get<VenueListItem[]>("/venues", { params });
    return res.data;
  },
  // ✅ THÊM MỚI: chỉ lấy sân của owner đang login
  async listMyVenues(): Promise<VenueListItem[]> {
    const res = await apiClient.get<any[]>("/venues/my-venues");
    const data = res.data || [];

    // Backend trả VenueResponse → map sang VenueListItem để UI dùng ổn định
    return data.map((v: any) => ({
      id: v.id,
      name: v.name,
      address: v.address,
      city: v.city,
      district: v.district,
      phone: v.phone,
      imageUrl: v.imageUrl,
      minPrice: v.minPrice ?? null,
      maxPrice: v.maxPrice ?? null,
      lat: v.lat ?? v.latitude,
      lng: v.lng ?? v.longitude,
    }));
  },
  
  async listNearbyVenues(lat: number,lng: number,radius: number): Promise<VenueListItem[]> {
    const res = await apiClient.get<VenueListItem[]>("/venues", {
      params: { lat, lng, radius },
    });
    return res.data;
  },
 
  async getVenueDetail(id: string): Promise<VenueDetail> {
    const res = await apiClient.get<VenueDetail>(`/venues/${id}`);
    return res.data;
  },

  async updateVenue(id: string, data: VenueUpdateRequest) {
    const res = await apiClient.put(`/venues/${id}`, data);
    return res.data;
  },

  async getVenueAvailability(venueId: string, date: string): Promise<ApiVenueAvailabilityResponse> {
      const res = await apiClient.get<ApiVenueAvailabilityResponse>(`/venues/${venueId}/availability`, {
          params: { date }
      });
      return res.data;
  },
  async getMyVenues(): Promise<VenueDetail[]> { // Using VenueDetail as it matches response structure mostly or I should use specific type
      const res = await apiClient.get<VenueDetail[]>("/venues/my-venues");
      return res.data;
  },
  async updateVenue(id: string, data: any): Promise<VenueDetail> {
      const res = await apiClient.put<VenueDetail>(`/venues/${id}`, data);
      return res.data;
  }
};
