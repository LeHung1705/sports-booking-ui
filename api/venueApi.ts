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
