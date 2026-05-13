// ─── Roles ───────────────────────────────────────────────────────────────────

export type UserRole = "vendor" | "admin";

// ─── Mall / Table ─────────────────────────────────────────────────────────────

export interface Mall {
  id: string;
  name: string;
}

export interface Table {
  id: string;
  mallId: string;
  tableNumber: string;
}

// ─── Vendor ───────────────────────────────────────────────────────────────────

export interface Vendor {
  id: string;
  restaurantName: string;
  name?: string; // user.name from join
  description: string | null;
  logoUrl: string | null;
  cuisineType: string | null;
  isActive: boolean;
  isProfileComplete: boolean;
  userId: string;
  mallId: string;
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export interface Menu {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Menu Item ────────────────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  menuId: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string | null;
  isAvailable: boolean;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  vendorId: string | null;
  vendorName: string | null;
  mallId: string | null;
  tableId: string | null;
}

// ─── Guest ────────────────────────────────────────────────────────────────────

export interface GuestInfo {
  name: string;
  phone: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export type OrderStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED";

export interface OrderItem {
  menuItemId: string;
  menuItemName: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  guestName: string;
  guestPhone: string;
  vendorId: string;
  vendorName: string;
  mallId: string;
  tableId: string;
  tableNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
