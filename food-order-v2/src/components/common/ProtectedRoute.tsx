import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router";
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
  const [bootstrapping, setBootstrapping] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Always re-wire the token getter — it lives in module scope and is lost
    // on every page refresh since it's set in CallbackPage only.
    setTokenGetter(getAccessTokenSilently);

    // If Redux auth state is empty it means the page was refreshed and
    // CallbackPage never ran. Re-sync with the backend to restore role/vendorId.
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

  return <>{children}</>;
}
