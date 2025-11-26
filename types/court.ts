import type { Sport } from "./venue";

export interface CourtDetail {
  id: string;
  name: string;
  sport: Sport;
  pricePerHour: number;
  imageUrl?: string | null;
  isActive: boolean;
}

export interface CourtReviewItem {
  id: string;
  rating: number;
  comment?: string | null;
  userName: string;
  createdAt: string;  
}


export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface CourtReview {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  createdAt: string;
}
