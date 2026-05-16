import { Navigate } from "react-router";
import { Box, CircularProgress } from "@mui/material";
import { useAppSelector } from "../../hooks/useAppStore";

interface Props {
  children: React.ReactNode;
}

/** Restricts access to SUPER_ADMIN users only. Must be used inside ProtectedRoute. */
export default function SuperAdminGuard({ children }: Props) {
  const isSuperAdmin = useAppSelector((s) => s.auth.isSuperAdmin);
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

  if (!isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
