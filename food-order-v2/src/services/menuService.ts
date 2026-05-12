import api from "./api";
import type { Menu, MenuItem } from "../types";

export const menuService = {
  async getMenusByVendor(vendorId: string): Promise<Menu[]> {
    const res = await api.get<Menu[]>(`/vendors/${vendorId}/menus`);
    return res.data;
  },

  async getActiveMenu(vendorId: string): Promise<Menu | null> {
    const res = await api.get<Menu | null>(`/vendors/${vendorId}/menus/active`);
    return res.data;
  },

  async getMenuById(menuId: string): Promise<Menu> {
    const res = await api.get<Menu>(`/menus/${menuId}`);
    return res.data;
  },

  async createMenu(data: {
    vendorId: string;
    name: string;
    description: string;
  }): Promise<Menu> {
    const res = await api.post<Menu>("/menus", data);
    return res.data;
  },

  async updateMenu(
    menuId: string,
    data: Partial<Pick<Menu, "name" | "description" | "isActive">>,
  ): Promise<Menu> {
    const res = await api.patch<Menu>(`/menus/${menuId}`, data);
    return res.data;
  },

  async deleteMenu(menuId: string): Promise<void> {
    await api.delete(`/menus/${menuId}`);
  },

  // Menu Items
  async getMenuItems(menuId: string): Promise<MenuItem[]> {
    const res = await api.get<MenuItem[]>(`/menus/${menuId}/items`);
    return res.data;
  },

  async getMenuItemById(itemId: string): Promise<MenuItem> {
    const res = await api.get<MenuItem>(`/menu-items/${itemId}`);
    return res.data;
  },

  async createMenuItem(menuId: string, formData: FormData): Promise<MenuItem> {
    const res = await api.post<MenuItem>(`/menus/${menuId}/items`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async updateMenuItem(itemId: string, formData: FormData): Promise<MenuItem> {
    const res = await api.patch<MenuItem>(`/menu-items/${itemId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async deleteMenuItem(itemId: string): Promise<void> {
    await api.delete(`/menu-items/${itemId}`);
  },
};
