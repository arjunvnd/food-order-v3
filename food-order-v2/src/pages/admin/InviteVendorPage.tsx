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

export default function InviteVendorPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
  }>({});

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!name.trim()) errs.name = "Restaurant name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = "Enter a valid email address";
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
        name: name.trim(),
        email: email.trim(),
      });
      setSuccess(true);
      setName("");
      setEmail("");
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
        The vendor will receive an email invitation to set up their account.
      </Typography>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="Restaurant Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={Boolean(fieldErrors.name)}
            helperText={fieldErrors.name}
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
        </Stack>

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Invitation sent! The vendor will receive an email to complete their
            setup.
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
