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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockResetIcon from "@mui/icons-material/LockReset";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { restaurantService } from "../../services/restaurantService";
import type { Vendor, VendorType } from "../../types";

const VENDOR_TYPES: { value: VendorType; label: string }[] = [
  { value: "MALL_VENDOR", label: "Mall Vendor" },
  { value: "STANDALONE", label: "Standalone" },
  { value: "TAKEAWAY", label: "Takeaway" },
];

export default function VendorDetailPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [form, setForm] = useState({
    restaurantName: "",
    description: "",
    cuisineType: "",
    vendorType: "MALL_VENDOR" as VendorType,
    isActive: true,
  });

  useEffect(() => {
    if (!vendorId) return;
    restaurantService
      .getAdminVendorById(vendorId)
      .then((v) => {
        setVendor(v);
        setForm({
          restaurantName: v.restaurantName ?? "",
          description: v.description ?? "",
          cuisineType: v.cuisineType ?? "",
          vendorType: v.vendorType ?? "MALL_VENDOR",
          isActive: v.isActive,
        });
      })
      .catch(() => setError("Failed to load vendor."))
      .finally(() => setLoading(false));
  }, [vendorId]);

  const handleResetPassword = async () => {
    if (!vendorId || newPassword.length < 8) return;
    setResetLoading(true);
    setResetError(null);
    try {
      await restaurantService.resetVendorPassword(vendorId, newPassword);
      setResetSuccess(true);
      setResetDialogOpen(false);
      setNewPassword("");
    } catch {
      setResetError("Failed to set password. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseResetDialog = () => {
    setResetDialogOpen(false);
    setNewPassword("");
    setShowPassword(false);
    setResetError(null);
  };

  const handleSave = async () => {
    if (!vendorId) return;
    setSaveLoading(true);
    setError(null);
    try {
      const updated = await restaurantService.updateVendor(vendorId, form);
      setVendor(updated);
      setEditing(false);
    } catch {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (!vendor) return;
    setForm({
      restaurantName: vendor.restaurantName ?? "",
      description: vendor.description ?? "",
      cuisineType: vendor.cuisineType ?? "",
      vendorType: vendor.vendorType ?? "MALL_VENDOR",
      isActive: vendor.isActive,
    });
    setEditing(false);
    setError(null);
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

  const ownerName = vendor.user?.name ?? vendor.name ?? "—";
  const ownerEmail = vendor.user?.email ?? "—";

  return (
    <Box maxWidth={600} mx="auto">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/admin/vendors")}
        sx={{ mb: 2 }}
      >
        Back to Vendors
      </Button>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        {/* Header */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              src={vendor.logoUrl ?? undefined}
              sx={{ width: 64, height: 64, fontSize: 28 }}
            >
              🍽️
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {vendor.restaurantName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {ownerName} · {ownerEmail}
              </Typography>
            </Box>
          </Box>
          {!editing && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {editing ? (
          <Stack spacing={2}>
            <TextField
              label="Restaurant Name"
              value={form.restaurantName}
              onChange={(e) =>
                setForm((f) => ({ ...f, restaurantName: e.target.value }))
              }
              fullWidth
              size="small"
            />
            <TextField
              label="Cuisine Type"
              value={form.cuisineType}
              onChange={(e) =>
                setForm((f) => ({ ...f, cuisineType: e.target.value }))
              }
              fullWidth
              size="small"
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              fullWidth
              size="small"
              multiline
              rows={3}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Vendor Type</InputLabel>
              <Select
                label="Vendor Type"
                value={form.vendorType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    vendorType: e.target.value as VendorType,
                  }))
                }
              >
                {VENDOR_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                />
              }
              label={form.isActive ? "Open" : "Closed"}
            />
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saveLoading || !form.restaurantName.trim()}
              >
                {saveLoading ? "Saving…" : "Save Changes"}
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancelEdit}
                disabled={saveLoading}
              >
                Cancel
              </Button>
            </Box>
          </Stack>
        ) : (
          <Stack spacing={1}>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                label={vendor.isActive ? "Open" : "Closed"}
                color={vendor.isActive ? "success" : "default"}
                size="small"
              />
              <Chip
                label={
                  VENDOR_TYPES.find((t) => t.value === vendor.vendorType)
                    ?.label ?? vendor.vendorType
                }
                variant="outlined"
                size="small"
              />
              <Chip
                label={
                  vendor.isProfileComplete
                    ? "Profile Complete"
                    : "Profile Incomplete"
                }
                color={vendor.isProfileComplete ? "success" : "warning"}
                size="small"
              />
            </Box>
            {vendor.cuisineType && (
              <Typography variant="body2">
                <strong>Cuisine:</strong> {vendor.cuisineType}
              </Typography>
            )}
            {vendor.description && (
              <Typography variant="body2" color="text.secondary">
                {vendor.description}
              </Typography>
            )}
            {vendor.mall && (
              <Typography variant="body2">
                <strong>Mall:</strong> {vendor.mall.name}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              Vendor ID: {vendor.id}
            </Typography>
          </Stack>
        )}
      </Paper>

      {resetSuccess && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setResetSuccess(false)}
        >
          Password updated successfully.
        </Alert>
      )}
      {error && vendor && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
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
        Set New Password
      </Button>

      <Dialog
        open={resetDialogOpen}
        onClose={handleCloseResetDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Set New Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Enter a new password for <strong>{ownerEmail}</strong>. It must be
            at least 8 characters.
          </Typography>
          {resetError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {resetError}
            </Alert>
          )}
          <TextField
            label="New Password"
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            size="small"
            autoComplete="new-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((s) => !s)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetDialog} disabled={resetLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleResetPassword}
            disabled={resetLoading || newPassword.length < 8}
          >
            {resetLoading ? "Saving…" : "Set Password"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
