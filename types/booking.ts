// types/Booking.ts
export interface TimeSlot {
    id: string;
    time: string; // VD: "07:00 - 08:00"
    price: number;
    isAvailable: boolean;
    isSelected?: boolean;
  }
  
  export interface Court {
    id: string;
    name: string; // VD: "Sân 7A"
    type: string; // VD: "Sân 7 người"
    slots: TimeSlot[];
  }
  
  export interface BookingState {
    selectedDate: string;
    selectedSlots: {
      courtId: string;
      slotId: string;
      price: number;
      time: string;
      courtName: string;
    }[];
  }