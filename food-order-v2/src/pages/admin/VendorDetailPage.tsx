import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Avatar,
  Chip,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockResetIcon from "@mui/icons-material/LockReset";
import { restaurantService } from "../../services/restaurantService";
import type { Vendor } from "../../types";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function VendorDetailPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!vendorId) return;
    restaurantService
      .getVendorById(vendorId)
      .then(setVendor)
      .catch(() => setError("Failed to load vendor."))
      .finally(() => setLoading(false));
  }, [vendorId]);

  const handleResetPassword = async () => {
    if (!vendorId) return;
    setResetLoading(true);
    try {
      await restaurantService.resetVendorPassword(vendorId);
      setResetSuccess(true);
    } catch {
      setError("Failed to reset password. Please try again.");
    } finally {
      setResetLoading(false);
      setResetDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !vendor) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error}
      </Alert>
    );
  }

  if (!vendor) return null;

  return (
    <Box maxWidth={560} mx="auto">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/admin/vendors")}
        sx={{ mb: 2 }}
      >
        Back to Vendors
      </Button>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar
            src={vendor.logoUrl ?? undefined}
            sx={{ width: 64, height: 64, fontSize: 28 }}
          >
            🍽️
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {vendor.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {vendor.cuisineType}
            </Typography>
            <Chip
              label={vendor.isActive ? "Open" : "Closed"}
              color={vendor.isActive ? "success" : "default"}
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Box>
        </Box>

        {vendor.description && (
          <Typography variant="body2" color="text.secondary" mb={2}>
            {vendor.description}
          </Typography>
        )}

        <Divider sx={{ mb: 2 }} />

        <Typography variant="caption" color="text.secondary">
          Vendor ID: {vendor.id}
        </Typography>
      </Paper>

      {resetSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Password reset email has been sent to the vendor.
        </Alert>
      )}
      {error && vendor && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        variant="outlined"
        color="warning"
        startIcon={<LockResetIcon />}
        onClick={() => setResetDialogOpen(true)}
        disabled={resetLoading}
      >
        Reset Vendor Password
      </Button>

      <ConfirmDialog
        open={resetDialogOpen}
        title="Reset Vendor Password?"
        message={`This will send a password reset email to the vendor's registered address. They will be asked to create a new password.`}
        confirmLabel={resetLoading ? "Sending…" : "Reset Password"}
        onConfirm={handleResetPassword}
        onCancel={() => setResetDialogOpen(false)}
      />
    </Box>
  );
}
