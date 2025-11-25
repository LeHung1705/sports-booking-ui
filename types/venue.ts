import { Double } from "react-native/Libraries/Types/CodegenTypes";

export type Sport = "FOOTBALL" | "BADMINTON" | "TENNIS" | "BASKETBALL" | "VOLLEYBALL" | "PICKLEBALL";

export interface VenueListRequest {
  q?: string;
  city?: string;
  sport?: Sport;
  radius?: number;
  lat?: number;
  lng?: number;
}


export interface VenueListItem {
  id: string;
  name: string;
  address: string;
  imageUrl?: string;
  avgRating?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
}

export interface VenueDetailCourtItem {
  id: string;
  name: string;
  sport?: Sport | null;
  imageUrl?: string | null;
  pricePerHour: number;
}

export interface VenueDetail {
  id: string;
  name: string;
  address: string;
  district?: string | null;
  city?: string | null;
  phone?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  avgRating?: number | null;
  reviewCount?: number | null;
  courts: VenueDetailCourtItem[];
}

export type VenueListResponse = VenueListItem[];
