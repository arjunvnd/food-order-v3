import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, useLocation } from "react-router";
import { Box, CircularProgress } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import { setAuthUser } from "../../store/slices/authSlice";
import { setTokenGetter } from "../../services/api";

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, isLoading, user, getAccessTokenSilently } =
    useAuth0();
  const dispatch = useAppDispatch();
  const role = useAppSelector((s) => s.auth.role);
  const userStatus = useAppSelector((s) => s.auth.status);
  const [bootstrapping, setBootstrapping] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    setTokenGetter(getAccessTokenSilently);

    if (!role) {
      setBootstrapping(true);
      dispatch(setAuthUser(user as Record<string, unknown>)).finally(() =>
        setBootstrapping(false),
      );
    }
  }, [isAuthenticated, user, getAccessTokenSilently, role, dispatch]);

  if (isLoading || bootstrapping) {
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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // PENDING users can only visit /request-access — redirect them everywhere else
  if (userStatus === "PENDING" && pathname !== "/request-access") {
    return <Navigate to="/request-access" replace />;
  }

  return <>{children}</>;
}
