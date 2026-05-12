import { Outlet } from "react-router";
import { Box } from "@mui/material";
import Navbar from "./Navbar";

interface Props {
  variant: "customer" | "vendor" | "admin";
}

export default function AppLayout({ variant }: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar variant={variant} />
      <Box component="main" sx={{ flex: 1, p: 2 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
