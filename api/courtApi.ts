import apiClient from "./apiClient";
import type { CourtDetail, CourtReview, CourtReviewItem, PageResponse } from "@/types/court";

export const courtApi = {
  async getCourtDetail(venueId: string, courtId: string): Promise<CourtDetail> {
    const res = await apiClient.get<CourtDetail>(`/venues/${venueId}/courts/${courtId}`);
    return res.data;
  },

  async getCourtReviews(courtId: string): Promise<CourtReview[]> {
    const res = await apiClient.get<PageResponse<CourtReviewItem>>(
      `/courts/${courtId}/reviews`,
      { params: { page: 0, size: 10, sort: "createdAt,desc" } }
    );

    return res.data.content.map(item => ({
      id: item.id,
      rating: item.rating,
      comment: item.comment ?? "",
      userName: item.userName,
      createdAt: item.createdAt,
    }));
  }
};
