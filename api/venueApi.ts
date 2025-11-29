import apiClient from "./apiClient";
import type { VenueDetail, VenueListItem, VenueListRequest } from "@/types/venue";

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
};
