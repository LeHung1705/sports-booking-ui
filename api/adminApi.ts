import apiClient from "./apiClient";
import { VenueListItem } from "../types/venue";

export interface AdminStats {
  totalUsers: number;
  totalVenues: number;
  pendingVenues?: number; // Optional depending on backend impl
}

export interface AdminUserItem {
  uid: string;
  email: string;
  fullName: string;
  role: "USER" | "OWNER" | "ADMIN";
}

// Extend VenueListItem or define specific pending venue type
// Backend Venue entity has owner, address, etc.
export interface PendingVenueItem extends VenueListItem {
    ownerName?: string;
    ownerEmail?: string;
}

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get("/admin/stats");
    return response.data;
  },

  getPendingVenues: async (): Promise<PendingVenueItem[]> => {
    const response = await apiClient.get("/admin/venues/pending");
    console.log("Admin Pending Venues Response:", response.data);
    
    const data = Array.isArray(response.data) ? response.data : [];
    
    return data.map((v: any) => ({
        id: v.id,
        name: v.name,
        address: v.address,
        district: v.district,
        city: v.city,
        imageUrl: v.imageUrl,
        ownerName: v.ownerName || v.owner?.fullName || "Unknown",
        ownerEmail: v.ownerEmail || v.owner?.email || "Unknown",
    }));
  },

  approveVenue: async (venueId: string): Promise<void> => {
    await apiClient.put(`/admin/venues/${venueId}/approve`);
  },

  rejectVenue: async (venueId: string): Promise<void> => {
    await apiClient.put(`/admin/venues/${venueId}/reject`);
  },

  getAllUsers: async (): Promise<AdminUserItem[]> => {
    const response = await apiClient.get("/admin/users");
    return response.data;
  },

  upgradeUserToOwner: async (userId: string): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/upgrade`);
  },

  degradeUserToUser: async (userId: string): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/degrade`);
  },
};
