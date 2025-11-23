import apiClient from "./apiClient";

import type {
  VenueListRequest,
  VenueListResponse,
} from "../types/venue";

export const venueApi = {
  async listVenues(params?: VenueListRequest): Promise<VenueListResponse> {
    const res = await apiClient.get<VenueListResponse>("/venues", {
      params,
    });
    return res.data;
  },
};