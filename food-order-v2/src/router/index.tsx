import { createBrowserRouter, Navigate } from "react-router";
import ProtectedRoute from "../components/common/ProtectedRoute";
import RoleGuard from "../components/common/RoleGuard";
import AppLayout from "../components/common/AppLayout";

// Auth
import LoginPage from "../pages/auth/LoginPage";
import CallbackPage from "../pages/auth/CallbackPage";
import UnauthorizedPage from "../pages/auth/UnauthorizedPage";

// Customer (public / guest)
import TablePage from "../pages/customer/TablePage";
import RestaurantMenuPage from "../pages/customer/RestaurantMenuPage";
import CartPage from "../pages/customer/CartPage";
import CheckoutPage from "../pages/customer/CheckoutPage";
import OrderTrackingPage from "../pages/customer/OrderTrackingPage";
import QRScanPage from "../pages/customer/QRScanPage";
import VendorDineInPage from "../pages/customer/VendorDineInPage";
import VendorTakeawayPage from "../pages/customer/VendorTakeawayPage";

// Vendor
import VendorDashboard from "../pages/vendor/VendorDashboard";
import VendorProfilePage from "../pages/vendor/VendorProfilePage";
import VendorOrdersPage from "../pages/vendor/VendorOrdersPage";
import VendorOrderDetailPage from "../pages/vendor/VendorOrderDetailPage";
import MenusPage from "../pages/vendor/MenusPage";
import MenuFormPage from "../pages/vendor/MenuFormPage";
import MenuItemsPage from "../pages/vendor/MenuItemsPage";
import MenuItemFormPage from "../pages/vendor/MenuItemFormPage";

// Admin
import AdminDashboard from "../pages/admin/AdminDashboard";
import VendorsPage from "../pages/admin/VendorsPage";
import InviteVendorPage from "../pages/admin/InviteVendorPage";
import VendorDetailPage from "../pages/admin/VendorDetailPage";
import AdminTablesPage from "../pages/admin/AdminTablesPage";

// Vendor — QR
import VendorTablesPage from "../pages/vendor/VendorTablesPage";

const router = createBrowserRouter([
  // ─── Root ──────────────────────────────────────────────────────────────────
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },

  // ─── Auth (public) ─────────────────────────────────────────────────────────
  { path: "/login", element: <LoginPage /> },
  { path: "/auth/callback", element: <CallbackPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },

  // ─── Customer / Guest (no auth required) ───────────────────────────────────
  {
    element: <AppLayout variant="customer" />,
    children: [
      // QR scan entry point — handles all venue types
      { path: "/scan/:qrToken", element: <QRScanPage /> },
      // Mall / food court flow
      {
        path: "/mall/:mallId/table/:tableId",
        element: <TablePage />,
      },
      {
        path: "/mall/:mallId/table/:tableId/restaurant/:restaurantId",
        element: <RestaurantMenuPage />,
      },
      // Standalone restaurant dine-in (table belongs to the vendor)
      {
        path: "/restaurant/:vendorId/table/:tableId",
        element: <VendorDineInPage />,
      },
      // Takeaway counter (no table)
      {
        path: "/restaurant/:vendorId/takeaway",
        element: <VendorTakeawayPage />,
      },
      { path: "/cart", element: <CartPage /> },
      { path: "/checkout", element: <CheckoutPage /> },
      { path: "/orders/:orderId", element: <OrderTrackingPage /> },
    ],
  },

  // ─── Vendor (auth + role guard) ────────────────────────────────────────────
  {
    element: (
      <ProtectedRoute>
        <RoleGuard role="vendor">
          <AppLayout variant="vendor" />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      { path: "/vendor", element: <VendorDashboard /> },
      { path: "/vendor/profile", element: <VendorProfilePage /> },
      { path: "/vendor/orders", element: <VendorOrdersPage /> },
      { path: "/vendor/orders/:orderId", element: <VendorOrderDetailPage /> },
      { path: "/vendor/menus", element: <MenusPage /> },
      { path: "/vendor/menus/new", element: <MenuFormPage /> },
      { path: "/vendor/menus/:menuId/edit", element: <MenuFormPage /> },
      { path: "/vendor/menus/:menuId/items", element: <MenuItemsPage /> },
      {
        path: "/vendor/menus/:menuId/items/new",
        element: <MenuItemFormPage />,
      },
      {
        path: "/vendor/menus/:menuId/items/:itemId/edit",
        element: <MenuItemFormPage />,
      },
      { path: "/vendor/tables", element: <VendorTablesPage /> },
    ],
  },

  // ─── Admin (auth + role guard) ─────────────────────────────────────────────
  {
    element: (
      <ProtectedRoute>
        <RoleGuard role="admin">
          <AppLayout variant="admin" />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      { path: "/admin", element: <AdminDashboard /> },
      { path: "/admin/vendors", element: <VendorsPage /> },
      { path: "/admin/vendors/invite", element: <InviteVendorPage /> },
      { path: "/admin/vendors/:vendorId", element: <VendorDetailPage /> },
      { path: "/admin/tables", element: <AdminTablesPage /> },
    ],
  },
]);

export default router;
