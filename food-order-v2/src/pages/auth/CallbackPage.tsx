import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth0 } from "@auth0/auth0-react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAppDispatch } from "../../hooks/useAppStore";
import { setAuthUser } from "../../store/slices/authSlice";
import { setTokenGetter } from "../../services/api";

export default function CallbackPage() {
  const { isLoading, isAuthenticated, user, getAccessTokenSilently, error } =
    useAuth0();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    // Wire up the token getter for Axios
    setTokenGetter(getAccessTokenSilently);

    dispatch(setAuthUser(user as Record<string, unknown>)).then((action) => {
      if (setAuthUser.fulfilled.match(action)) {
        const role = action.payload.role;
        if (role === "admin") navigate("/admin", { replace: true });
        else if (role === "vendor") navigate("/vendor", { replace: true });
        else navigate("/unauthorized", { replace: true });
      }
    });
  }, [
    isLoading,
    isAuthenticated,
    user,
    getAccessTokenSilently,
    dispatch,
    navigate,
  ]);

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Typography color="error">
          Authentication error: {error.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      gap={2}
    >
      <CircularProgress />
      <Typography>Signing you in…</Typography>
    </Box>
  );
}
