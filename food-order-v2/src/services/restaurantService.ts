import api from "./api";
import type { Vendor } from "../types";

export const restaurantService = {
  async getVendorsByMall(mallId: string): Promise<Vendor[]> {
    const res = await api.get<Vendor[]>(`/malls/${mallId}/vendors`);
    return res.data;
  },

  async getVendorById(vendorId: string): Promise<Vendor> {
    const res = await api.get<Vendor>(`/vendors/${vendorId}`);
    return res.data;
  },

  // Vendor-only: update own profile (supports multipart for logo upload)
  async updateVendorProfile(
    vendorId: string,
    formData: FormData,
  ): Promise<Vendor> {
    const res = await api.put<Vendor>(`/vendors/${vendorId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  // Admin-only
  async getAllVendors(): Promise<Vendor[]> {
    const res = await api.get<Vendor[]>("/admin/vendors");
    return res.data;
  },

  async inviteVendor(data: { name: string; email: string }): Promise<Vendor> {
    const res = await api.post<Vendor>("/admin/vendors/invite", data);
    return res.data;
  },

  async resetVendorPassword(vendorId: string): Promise<void> {
    await api.post(`/admin/vendors/${vendorId}/reset-password`);
  },
};
