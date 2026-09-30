import { Outlet } from "react-router";
import { Box } from "@mui/material";
import Navbar from "./Navbar";
import ActiveOrderBanner from "../customer/ActiveOrderBanner";
import VendorNotificationCenter from "../vendor/VendorNotificationCenter";

interface Props {
  variant: "customer" | "vendor" | "admin" | "super_admin";
}

export default function AppLayout({ variant }: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar variant={variant} />
      {variant === "customer" && <ActiveOrderBanner />}
      {/* Persists across all /vendor/* pages so sockets stay live app-wide */}
      {variant === "vendor" && <VendorNotificationCenter />}
      <Box component="main" sx={{ flex: 1, p: 2 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
