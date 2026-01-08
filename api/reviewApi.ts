import apiClient from "./apiClient";
import { ReviewRequest, ReviewResponse } from "@/types/review";

export const reviewApi = {

    createReview: async (payload: ReviewRequest): Promise<ReviewResponse> => {
        const res = await apiClient.post<ReviewResponse>("/reviews", payload);
        return res.data;
    }
}
