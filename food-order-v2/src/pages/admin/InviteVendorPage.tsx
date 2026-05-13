import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import { restaurantService } from "../../services/restaurantService";

const isDevInvite = import.meta.env.VITE_VENDOR_INVITE_DEV_MODE === "true";

export default function InviteVendorPage() {
  const navigate = useNavigate();
  const [vendorName, setVendorName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    vendorName?: string;
    restaurantName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!vendorName.trim()) errs.vendorName = "Vendor name is required";
    if (!restaurantName.trim())
      errs.restaurantName = "Restaurant name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = "Enter a valid email address";
    if (isDevInvite) {
      if (!password) errs.password = "Password is required";
      else if (password.length < 8)
        errs.password = "Must be at least 8 characters";
      if (password !== confirmPassword)
        errs.confirmPassword = "Passwords do not match";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInvite = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await restaurantService.inviteVendor({
        name: vendorName.trim(),
        restaurantName: restaurantName.trim(),
        email: email.trim(),
        ...(isDevInvite ? { password } : {}),
      });
      setSuccess(true);
      setVendorName("");
      setRestaurantName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to invite vendor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={480} mx="auto">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/admin/vendors")}
        sx={{ mb: 2 }}
      >
        Back to Vendors
      </Button>
      <Typography variant="h5" fontWeight={700} mb={1}>
        Invite Vendor
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {isDevInvite
          ? "Dev mode: set a temporary password for the vendor. No email will be sent — share the password with them directly."
          : "The vendor will receive an email invitation to set their password and complete their profile."}
      </Typography>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="Restaurant Name"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            error={Boolean(fieldErrors.restaurantName)}
            helperText={fieldErrors.restaurantName}
            fullWidth
            required
          />
          <TextField
            label="Vendor Full Name"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            error={Boolean(fieldErrors.vendorName)}
            helperText={fieldErrors.vendorName}
            fullWidth
            required
          />
          <TextField
            label="Vendor Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={Boolean(fieldErrors.email)}
            helperText={fieldErrors.email}
            fullWidth
            required
          />
          {isDevInvite && (
            <>
              <TextField
                label="Temporary Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={Boolean(fieldErrors.password)}
                helperText={
                  fieldErrors.password ??
                  "Min 8 characters — share this with the vendor"
                }
                fullWidth
                required
              />
              <TextField
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={Boolean(fieldErrors.confirmPassword)}
                helperText={fieldErrors.confirmPassword}
                fullWidth
                required
              />
            </>
          )}
        </Stack>

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {isDevInvite
              ? "Vendor created. Share the temporary password with them so they can log in."
              : `Invitation sent! ${email || "The vendor"} will receive an email to set their password.`}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          fullWidth
          size="large"
          sx={{ mt: 3 }}
          onClick={handleInvite}
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <SendIcon />
            )
          }
        >
          {loading ? "Sending…" : "Send Invitation"}
        </Button>
      </Paper>
    </Box>
  );
}
