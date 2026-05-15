import api from "./api";
import type { Menu, MenuItem } from "../types";

export const menuService = {
  async getMenusByVendor(_vendorId: string): Promise<Menu[]> {
    // Vendor-authenticated: backend derives vendor identity from JWT
    const res = await api.get<Menu[]>(`/vendor/menus`);
    return res.data;
  },

  async getActiveMenu(vendorId: string): Promise<Menu | null> {
    // Public: used by customer browsing
    const res = await api.get<Menu | null>(
      `/public/vendors/${vendorId}/active-menu`,
    );
    return res.data;
  },

  async getMenuById(menuId: string): Promise<Menu> {
    const res = await api.get<Menu>(`/vendor/menus/${menuId}`);
    return res.data;
  },

  async createMenu(data: {
    vendorId: string;
    name: string;
    description?: string;
  }): Promise<Menu> {
    const res = await api.post<Menu>("/vendor/menus", data);
    return res.data;
  },

  async updateMenu(
    menuId: string,
    data: Partial<Pick<Menu, "name" | "description">>,
  ): Promise<Menu> {
    const res = await api.put<Menu>(`/vendor/menus/${menuId}`, data);
    return res.data;
  },

  async activateMenu(menuId: string): Promise<Menu> {
    const res = await api.patch<Menu>(`/vendor/menus/${menuId}/activate`);
    return res.data;
  },

  async deleteMenu(menuId: string): Promise<void> {
    await api.delete(`/vendor/menus/${menuId}`);
  },

  // Menu Items
  async getMenuItems(menuId: string): Promise<MenuItem[]> {
    const res = await api.get<MenuItem[]>(`/vendor/menus/${menuId}/items`);
    return res.data;
  },

  async getMenuItemById(itemId: string): Promise<MenuItem> {
    const res = await api.get<MenuItem>(`/vendor/menu-items/${itemId}`);
    return res.data;
  },

  async createMenuItem(menuId: string, formData: FormData): Promise<MenuItem> {
    const res = await api.post<MenuItem>(
      `/vendor/menus/${menuId}/items`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data;
  },

  async updateMenuItem(itemId: string, formData: FormData): Promise<MenuItem> {
    const res = await api.put<MenuItem>(
      `/vendor/menu-items/${itemId}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data;
  },

  async toggleMenuItemAvailability(
    itemId: string,
    isAvailable: boolean,
  ): Promise<MenuItem> {
    const res = await api.patch<MenuItem>(
      `/vendor/menu-items/${itemId}/availability`,
      { isAvailable },
    );
    return res.data;
  },

  async deleteMenuItem(itemId: string): Promise<void> {
    await api.delete(`/vendor/menu-items/${itemId}`);
  },
};
