import { Sport } from "./venue";

export interface BookingPayload {
  court_id: string;
  start_time: string; // ISO 8601 string (OffsetDateTime)
  end_time: string;   // ISO 8601 string (OffsetDateTime)
}

export interface BookingResponse {
  id: string;
  totalAmount: number;
  status: string;
}

export interface BookingListResponse {
  id: string;
  court: string;
  startTime: string;
  status: string;
}

export interface PricingRule {
    startTime: string;
    endTime: string;
    price: number;
}

export interface BookingSlot {
    id: string;
    time: string;
    status: 'available' | 'booked';
    price: number;
    courtId: string;
    courtName: string;
}

// API Response DTOs
export interface ApiTimeSlot {
    time: string;     // "HH:mm"
    endTime: string;  // "HH:mm"
    price: number;
    status: 'available' | 'booked';
}

export interface ApiCourtAvailability {
    courtId: string;
    courtName: string;
    slots: ApiTimeSlot[];
}

export interface ApiVenueAvailabilityResponse {
    venueId: string;
    venueName: string;
    courts: ApiCourtAvailability[];
}


// UI Helper Types (UI state)
export type TimeSlotStatus = 'available' | 'booked' | 'selected';

export interface TimeTableSlot {
  slotId: string;    // courtId_startTime
  time: string;      // "HH:mm"
  endTime: string;   // "HH:mm"
  status: TimeSlotStatus;
  price: number;
}

export interface TimeTableData {
  courtId: string;
  courtName: string;
  slots: TimeTableSlot[];
}
