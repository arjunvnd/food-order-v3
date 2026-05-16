import api from "./api";
import type { Vendor, ScanResult } from "../types";

export const restaurantService = {
  /**
   * Unified QR scan resolver — call this on the /scan/:qrToken page.
   * Returns a typed context (MALL_TABLE, VENDOR_TABLE, or VENDOR_COUNTER)
   * so the UI can navigate to the right flow.
   */
  async resolveScanToken(qrToken: string): Promise<ScanResult> {
    const res = await api.get<ScanResult>(`/public/scan/${qrToken}`);
    return res.data;
  },

  async getVendorsByMall(mallId: string): Promise<Vendor[]> {
    const res = await api.get<Vendor[]>(`/public/malls/${mallId}/vendors`);
    return res.data;
  },

  async getVendorById(vendorId: string): Promise<Vendor> {
    const res = await api.get<Vendor>(`/public/vendors/${vendorId}`);
    return res.data;
  },

  // Vendor-only: get own full profile (authenticated)
  async getVendorProfile(): Promise<Vendor> {
    const res = await api.get<Vendor>(`/vendor/profile`);
    return res.data;
  },

  // Vendor-only: update own profile (supports multipart for logo upload)
  async updateVendorProfile(
    _vendorId: string,
    formData: FormData,
  ): Promise<Vendor> {
    const res = await api.put<Vendor>(`/vendor/profile`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  // Admin-only
  async getAllVendors(): Promise<Vendor[]> {
    const res = await api.get<Vendor[]>("/admin/vendors");
    return res.data;
  },

  async getAdminVendorById(vendorId: string): Promise<Vendor> {
    const res = await api.get<Vendor>(`/admin/vendors/${vendorId}`);
    return res.data;
  },

  async inviteVendor(data: {
    name: string;
    email: string;
    restaurantName: string;
    password?: string;
  }): Promise<Vendor> {
    const res = await api.post<Vendor>("/admin/vendors/invite", data);
    return res.data;
  },

  async resetVendorPassword(vendorId: string, password: string): Promise<void> {
    await api.patch(`/admin/vendors/${vendorId}/reset-password`, { password });
  },

  async updateVendor(
    vendorId: string,
    data: {
      restaurantName?: string;
      description?: string;
      cuisineType?: string;
      vendorType?: string;
      isActive?: boolean;
    },
  ): Promise<Vendor> {
    const res = await api.patch<Vendor>(`/admin/vendors/${vendorId}`, data);
    return res.data;
  },
};
