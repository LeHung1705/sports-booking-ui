import type { Sport } from "./venue";

export interface CourtReviewItem {
  id: string;
  rating: number;
  comment?: string | null;
  userName: string;
  createdAt?: string | null;
}

export interface CourtDetail {
  id: string;
  name: string;
  sport?: Sport | null;
  pricePerHour: number;
  description?: string | null;
  imageUrl?: string | null;

  venueId: string;
  venueName: string;
  venueAddress: string;
  venueDistrict?: string | null;
  venueCity?: string | null;

  avgRating?: number | null;
  reviewCount?: number | null;
  reviews: CourtReviewItem[];
}
