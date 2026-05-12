import { Navigate } from "react-router";
import { useRole } from "../../hooks/useRole";
import type { UserRole } from "../../types";
import { Box, CircularProgress } from "@mui/material";
import { useAppSelector } from "../../hooks/useAppStore";

interface Props {
  role: UserRole;
  children: React.ReactNode;
}

export default function RoleGuard({ role, children }: Props) {
  const userRole = useRole();
  const isLoading = useAppSelector((s) => s.auth.isLoading);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (userRole !== role) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
