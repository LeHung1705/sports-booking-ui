import apiClient from "./apiClient";
import type { VenueDetail, VenueListItem, VenueListRequest } from "@/types/venue";
import type { ApiVenueAvailabilityResponse } from "@/types/booking";

export const venueApi = {
  async listVenues(params?: VenueListRequest): Promise<VenueListItem[]> {
    const res = await apiClient.get<VenueListItem[]>("/venues", { params });
    return res.data;
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
  async getVenueAvailability(venueId: string, date: string): Promise<ApiVenueAvailabilityResponse> {
      const res = await apiClient.get<ApiVenueAvailabilityResponse>(`/venues/${venueId}/availability`, {
          params: { date }
      });
      return res.data;
  }
};
