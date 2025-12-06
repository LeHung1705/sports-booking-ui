import { ApiVenueAvailabilityResponse, TimeTableData, TimeTableSlot } from "@/types/booking";

export const transformToTimeTable = (
  apiData: ApiVenueAvailabilityResponse,
  date: Date
): TimeTableData[] => {
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD

  return apiData.courts.map((court) => {
    const slots: TimeTableSlot[] = court.slots.map(s => {
        // ID unique: courtId_date_hour
        const slotId = `${court.courtId}_${dateStr}_${s.time}`;
        
        return {
            slotId: slotId,
            time: s.time,
            endTime: s.endTime,
            status: s.status,
            price: s.price
        };
    });

    return {
      courtId: court.courtId,
      courtName: court.courtName,
      slots: slots,
    };
  });
};