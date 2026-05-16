import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import { setAuthUser } from "../../store/slices/authSlice";
import api from "../../services/api";

export default function RequestAccessPage() {
  const { user, logout } = useAuth0();
  const dispatch = useAppDispatch();
  const userStatus = useAppSelector((s) => s.auth.status);

  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/request-access", { note });
      setSubmitted(true);
    } catch {
      setError("Failed to send request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Re-sync with backend — if a super admin approved them since last load,
  // the Redux status will update to "ACTIVE" and ProtectedRoute lets them through.
  const handleRefreshStatus = async () => {
    if (!user) return;
    setRefreshing(true);
    await dispatch(setAuthUser(user as Record<string, unknown>));
    setRefreshing(false);
  };

  const handleLogout = () =>
    logout({ logoutParams: { returnTo: window.location.origin + "/login" } });

  // If user is already ACTIVE (approved while this page is open), show a success banner
  if (userStatus === "ACTIVE") {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
        p={2}
      >
        <Paper elevation={3} sx={{ p: 4, maxWidth: 480, width: "100%", textAlign: "center" }}>
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 56, mb: 2 }} />
          <Typography variant="h5" fontWeight={700} mb={1}>
            You&apos;ve been approved!
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Your account is now active. You can proceed to use the platform.
          </Typography>
          <Button variant="contained" href="/vendor" fullWidth>
            Go to Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="background.default"
      p={2}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 480, width: "100%" }}>
        <Box textAlign="center" mb={3}>
          <HourglassEmptyIcon color="warning" sx={{ fontSize: 56, mb: 1 }} />
          <Typography variant="h5" fontWeight={700}>
            Access Pending
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Hi {user?.name ?? user?.email}! Your account is awaiting approval
            from a super admin before you can use the platform.
          </Typography>
        </Box>

        {!submitted ? (
          <>
            <Typography variant="body2" mb={1}>
              Optionally, tell us why you&apos;re requesting access:
            </Typography>
            <TextField
              multiline
              rows={3}
              fullWidth
              placeholder="e.g. I am the vendor for Burger Palace in City Mall…"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              inputProps={{ maxLength: 500 }}
              helperText={`${note.length}/500`}
              sx={{ mb: 2 }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              variant="contained"
              fullWidth
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : "Request Access"}
            </Button>
          </>
        ) : (
          <Alert severity="success" sx={{ mb: 2 }}>
            Your request has been sent! A super admin will review it shortly.
            You&apos;ll be able to proceed once approved.
          </Alert>
        )}

        <Box mt={2} display="flex" gap={1} flexDirection="column">
          <Button
            variant="outlined"
            fullWidth
            onClick={handleRefreshStatus}
            disabled={refreshing}
          >
            {refreshing ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Check Approval Status"
            )}
          </Button>
          <Button variant="text" color="inherit" fullWidth onClick={handleLogout}>
            Log out
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
