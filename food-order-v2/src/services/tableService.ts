import api from "./api";
import type { Table, Vendor } from "../types";

// ─── Admin (mall tables) ──────────────────────────────────────────────────────

export const tableService = {
  async getAdminTables(): Promise<Table[]> {
    const res = await api.get<Table[]>("/admin/tables");
    return res.data;
  },

  async createAdminTable(tableNumber: string): Promise<Table> {
    const res = await api.post<Table>("/admin/tables", { tableNumber });
    return res.data;
  },

  async updateAdminTable(
    tableId: string,
    data: { tableNumber?: string; isActive?: boolean },
  ): Promise<Table> {
    const res = await api.put<Table>(`/admin/tables/${tableId}`, data);
    return res.data;
  },

  async deleteAdminTable(tableId: string): Promise<void> {
    await api.delete(`/admin/tables/${tableId}`);
  },

  async rotateAdminQr(
    tableId: string,
  ): Promise<Pick<Table, "id" | "tableNumber" | "qrToken">> {
    const res = await api.patch<Pick<Table, "id" | "tableNumber" | "qrToken">>(
      `/admin/tables/${tableId}/rotate-qr`,
    );
    return res.data;
  },

  // ─── Vendor (own tables for standalone restaurants) ──────────────────────

  async getVendorTables(): Promise<Table[]> {
    const res = await api.get<Table[]>("/vendor/tables");
    return res.data;
  },

  async createVendorTable(tableNumber: string): Promise<Table> {
    const res = await api.post<Table>("/vendor/tables", { tableNumber });
    return res.data;
  },

  async updateVendorTable(
    tableId: string,
    data: { tableNumber?: string; isActive?: boolean },
  ): Promise<Table> {
    const res = await api.put<Table>(`/vendor/tables/${tableId}`, data);
    return res.data;
  },

  async deleteVendorTable(tableId: string): Promise<void> {
    await api.delete(`/vendor/tables/${tableId}`);
  },

  async rotateVendorTableQr(
    tableId: string,
  ): Promise<Pick<Table, "id" | "tableNumber" | "qrToken">> {
    const res = await api.patch<Pick<Table, "id" | "tableNumber" | "qrToken">>(
      `/vendor/tables/${tableId}/rotate-qr`,
    );
    return res.data;
  },

  /** Rotate the vendor's own counter QR (used for TAKEAWAY vendors). */
  async rotateVendorCounterQr(): Promise<Pick<Vendor, "id" | "qrToken">> {
    const res =
      await api.patch<Pick<Vendor, "id" | "qrToken">>("/vendor/qr-token");
    return res.data;
  },
};
