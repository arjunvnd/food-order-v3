import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Avatar,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import {
  fetchMenuItems,
  updateMenuItemInList,
} from "../../store/slices/menusSlice";
import { menuService } from "../../services/menuService";

export default function MenuItemFormPage() {
  const { menuId, itemId } = useParams<{ menuId: string; itemId?: string }>();
  const isEdit = Boolean(itemId);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const existingItem = useAppSelector((s) =>
    s.menus.menuItems.find((i) => i.id === itemId),
  );

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    price?: string;
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEdit && !existingItem && menuId) {
      dispatch(fetchMenuItems(menuId));
    }
  }, [isEdit, existingItem, menuId, dispatch]);

  useEffect(() => {
    if (existingItem) {
      setName(existingItem.name);
      setPrice(String(existingItem.price));
      setDescription(existingItem.description);
      setIsAvailable(existingItem.isAvailable);
      setImagePreview(existingItem.imageUrl);
    }
  }, [existingItem]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!name.trim()) errs.name = "Item name is required";
    const priceVal = parseFloat(price);
    if (!price || isNaN(priceVal) || priceVal <= 0)
      errs.price = "Enter a valid price";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !menuId) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("price", String(parseFloat(price)));
    formData.append("description", description.trim());
    formData.append("isAvailable", String(isAvailable));
    if (imageFile) formData.append("image", imageFile);

    try {
      if (isEdit && itemId) {
        const updated = await menuService.updateMenuItem(itemId, formData);
        dispatch(updateMenuItemInList(updated));
      } else {
        await menuService.createMenuItem(menuId, formData);
        dispatch(fetchMenuItems(menuId));
      }
      navigate(`/vendor/menus/${menuId}/items`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={480} mx="auto">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/vendor/menus/${menuId}/items`)}
        sx={{ mb: 2 }}
      >
        Back to Items
      </Button>
      <Typography variant="h5" fontWeight={700} mb={3}>
        {isEdit ? "Edit Item" : "New Menu Item"}
      </Typography>

      {/* Image upload */}
      <Box textAlign="center" mb={3}>
        <Avatar
          src={imagePreview ?? undefined}
          variant="rounded"
          sx={{
            width: 120,
            height: 120,
            mx: "auto",
            mb: 1,
            bgcolor: "grey.200",
            fontSize: 40,
          }}
        >
          🍴
        </Avatar>
        <Button
          size="small"
          variant="outlined"
          startIcon={<PhotoCameraIcon />}
          onClick={() => fileInputRef.current?.click()}
        >
          {imageFile ? "Change Image" : "Add Image"}
        </Button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleImageChange}
        />
      </Box>

      <Stack spacing={2} mb={3}>
        <TextField
          label="Item Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={Boolean(fieldErrors.name)}
          helperText={fieldErrors.name}
          fullWidth
          required
        />
        <TextField
          label="Price ($)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={Boolean(fieldErrors.price)}
          helperText={fieldErrors.price}
          fullWidth
          required
          inputProps={{ inputMode: "decimal" }}
        />
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={3}
        />
        <FormControlLabel
          control={
            <Switch
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              color="success"
            />
          }
          label="Available for ordering"
        />
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={handleSubmit}
        disabled={loading}
        startIcon={
          loading ? <CircularProgress size={18} color="inherit" /> : undefined
        }
      >
        {loading ? "Saving…" : isEdit ? "Update Item" : "Add Item"}
      </Button>
    </Box>
  );
}
