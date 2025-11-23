// api/courtApi.ts
import apiClient from "./apiClient";
import type { Court } from "@/types/Court";

export interface CourtSearchParams {
  keyword?: string;
  sportType?: string;
  minPrice?: number;
  maxPrice?: number;
  district?: string;
  city?: string;
}

export const courtApi = {
  async getCourts(): Promise<Court[]> {
    const res = await apiClient.get<Court[]>(`/api/v1/courts`);
    return res.data;
  },

  async getCourtById(id: string): Promise<Court> {
    const res = await apiClient.get<Court>(`/api/v1/courts/${id}`);
    return res.data;
  },

  async searchCourts(params: CourtSearchParams): Promise<Court[]> {
    const res = await apiClient.get<Court[]>(`/api/v1/courts/search`, {
      params,
    });
    return res.data;
  },

  async getNearbyCourts(
    lat: number,
    lng: number,
    radiusKm = 5
  ): Promise<Court[]> {
    const res = await apiClient.get<Court[]>(`/api/v1/courts/nearby`, {
      params: { lat, lng, radius_km: radiusKm },
    });
    return res.data;
  },
};
