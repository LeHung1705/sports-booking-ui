import { Double } from "react-native/Libraries/Types/CodegenTypes";

export type Sport =
  | "FOOTBALL"
  | "BADMINTON"
  | "TENNIS"
  | "BASKETBALL"
  | "VOLLEYBALL";

export interface VenueListRequest {
  q?: string;        
  city?: string;
  sport?: Sport;
  lat?: number;
  lng?: number;
  radius?: number;
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


export type VenueListResponse = VenueListItem[];
