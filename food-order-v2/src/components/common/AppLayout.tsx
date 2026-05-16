import { Outlet } from "react-router";
import { Box } from "@mui/material";
import Navbar from "./Navbar";
import ActiveOrderBanner from "../customer/ActiveOrderBanner";

interface Props {
  variant: "customer" | "vendor" | "admin" | "super_admin";
}

export default function AppLayout({ variant }: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar variant={variant} />
      {variant === "customer" && <ActiveOrderBanner />}
      <Box component="main" sx={{ flex: 1, p: 2 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
