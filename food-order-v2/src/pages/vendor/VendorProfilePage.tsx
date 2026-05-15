import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Switch,
  FormControlLabel,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  Paper,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { useAppSelector } from "../../hooks/useAppStore";
import { restaurantService } from "../../services/restaurantService";
import type { Vendor } from "../../types";

export default function VendorProfilePage() {
  const vendorId = useAppSelector((s) => s.auth.vendorId ?? "");
  const [searchParams] = useSearchParams();
  const isSetupMode = searchParams.get("setup") === "true";
  const navigate = useNavigate();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cuisineType, setCuisineType] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!vendorId) return;
    restaurantService
      .getVendorProfile()
      .then((v) => {
        setVendor(v);
        setName(v.restaurantName);
        setDescription(v.description ?? "");
        setCuisineType(v.cuisineType ?? "");
        setIsActive(v.isActive);
        setLogoPreview(v.logoUrl);
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setFetchLoading(false));
  }, [vendorId]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!vendor) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("description", description.trim());
    formData.append("cuisineType", cuisineType.trim());
    formData.append("isActive", String(isActive));
    if (logoFile) formData.append("logo", logoFile);

    try {
      const updated = await restaurantService.updateVendorProfile(
        vendor.id,
        formData,
      );
      setVendor(updated);
      setSuccess(true);
      setLogoFile(null);
      if (isSetupMode) {
        navigate("/vendor", { replace: true });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth={560} mx="auto">
      <Typography variant="h5" fontWeight={700} mb={1}>
        {isSetupMode ? "Complete Your Profile" : "Restaurant Profile"}
      </Typography>
      {isSetupMode && (
        <Typography variant="body2" color="text.secondary" mb={3}>
          Welcome! Please fill in your restaurant details before you start
          managing orders.
        </Typography>
      )}

      {/* Logo */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, textAlign: "center" }}>
        <Avatar
          src={logoPreview ?? undefined}
          sx={{ width: 100, height: 100, mx: "auto", mb: 2, fontSize: 40 }}
        >
          🍽️
        </Avatar>
        <Button
          variant="outlined"
          startIcon={<PhotoCameraIcon />}
          onClick={() => fileInputRef.current?.click()}
          size="small"
        >
          Change Logo
        </Button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleLogoChange}
        />
        {logoFile && (
          <Typography
            variant="caption"
            display="block"
            mt={1}
            color="text.secondary"
          >
            {logoFile.name} selected
          </Typography>
        )}
      </Paper>

      <Stack spacing={2} mb={3}>
        <TextField
          label="Restaurant Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
        />
        <TextField
          label="Cuisine Type"
          value={cuisineType}
          onChange={(e) => setCuisineType(e.target.value)}
          fullWidth
          placeholder="e.g. Italian, Chinese, Fast Food"
        />
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={3}
        />
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <FormControlLabel
        control={
          <Switch
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            color="success"
          />
        }
        label={isActive ? "Restaurant is Open" : "Restaurant is Closed"}
        sx={{ mb: 3 }}
      />

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Profile saved successfully.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={handleSave}
        disabled={loading}
        startIcon={
          loading ? <CircularProgress size={18} color="inherit" /> : undefined
        }
      >
        {loading ? "Saving…" : "Save Changes"}
      </Button>
    </Box>
  );
}
