import apiClient from "./apiClient";
import { Court, CourtDetail, CourtSearchParams } from "@/types/Court";


export const courtApi = {
  getCourts: async () => {
    const res = await apiClient.get<Court[]>('/courts');
    return res.data;
  }
};

export default courtApi;