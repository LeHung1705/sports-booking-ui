export interface Court {
  id: string;
  name: string;
  address: string;
  city?: string;
  district?: string;
  pricePerHour: number;
  rating: number;
  ratingCount?: number;
  thumbnailUrl?: string;
  distanceKm?: number;
  lat?: number;
  lng?: number;
}

export interface CourtDetail extends Court {
  images?: string[];
  facilities?: string[];
  description?: string;
}

export interface CourtSearchParams {
  keyword?: string;
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  sportType?: string;
}
