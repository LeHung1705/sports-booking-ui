
export interface ReviewRequest {
    bookingId: string;
    rating: number;
    comment: string;
}

export interface ReviewResponse {
    id: string;
    rating: number; 
    comment: string;
    userFullName: string;
    createdAt: string;
}