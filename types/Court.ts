export type SportType =
  | "FOOTBALL"
  | "BADMINTON"
  | "TENNIS"
  | "BASKETBALL"
  | "VOLLEYBALL"
  | "OTHER";

export interface CourtReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Court {
  id: string;
  name: string;
  address: string;
  district?: string;
  city?: string;

  sportType: SportType;
  minPricePerHour: number;
  maxPricePerHour?: number;

  ratingAvg: number;
  ratingCount: number;

  distanceKm?: number;

  latitude: number;
  longitude: number;

  thumbnailUrl?: string;
  images?: string[];

  facilities?: string[];
  reviews?: CourtReview[];
}
