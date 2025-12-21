export type Sport = "FOOTBALL" | "BADMINTON" | "TENNIS" | "BASKETBALL" | "VOLLEYBALL" | "PICKLEBALL";

export interface VenueListRequest {
  q?: string;
  city?: string;
  sport?: Sport;
  radius?: number;
  lat?: number;
  lng?: number;
}

export interface PricingRule {
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  pricePerHour: number;
}

export interface VenueListItem {
  id: string;
  name: string;
  address: string;
  district?: string | null;
  city?: string | null;
  phone?: string | null;
  imageUrl?: string;
  avgRating?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  lat?: number;
  lng?: number;
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
  
  // Bank Info
  bankBin?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;

  lat?: number;
  lng?: number;
  courts: VenueDetailCourtItem[];
  pricingConfig?: PricingRule[];
}

export interface VenueUpdateRequest {
  name?: string;
  address?: string;
  district?: string;
  city?: string;
  phone?: string;
  description?: string;
  lat?: number;
  lng?: number;
  imageUrl?: string;
  bankBin?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

export type VenueListResponse = VenueListItem[];