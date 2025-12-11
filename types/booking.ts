
export interface BookingPayload {
  court_id: string;
  start_time: string; // ISO 8601 string (OffsetDateTime)
  end_time: string;   // ISO 8601 string (OffsetDateTime)
  payment_option?: 'DEPOSIT' | 'FULL_PAYMENT';
}

export interface BookingResponse {
  id: string;
  totalAmount: number;
  amountToPay: number;
  status: string;
  bankBin?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

export interface BookingListResponse {
  id: string;
  venue: string;
  court: string;
  userName?: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
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

export interface BookingDetailResponse {
  id: string;
  venue: string;
  court: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  payment?: {
    id: string;
    amount: number;
    status: string;
    returnPayload?: string;
  };
}

export interface BookingCancelRequest {
    cancelReason: string;
}

export interface BookingCancelResponse {
    status: string;
    refundAmount: number;
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
