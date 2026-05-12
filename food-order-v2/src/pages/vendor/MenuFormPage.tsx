import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import {
  fetchMenusByVendor,
  updateMenuInList,
} from "../../store/slices/menusSlice";
import { menuService } from "../../services/menuService";

export default function MenuFormPage() {
  const { menuId } = useParams<{ menuId?: string }>();
  const isEdit = Boolean(menuId);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const vendorId = useAppSelector((s) => s.auth.user?.sub ?? "");
  const existingMenu = useAppSelector((s) =>
    s.menus.menus.find((m) => m.id === menuId),
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (isEdit && !existingMenu && vendorId) {
      dispatch(fetchMenusByVendor(vendorId));
    }
  }, [isEdit, existingMenu, vendorId, dispatch]);

  useEffect(() => {
    if (existingMenu) {
      setName(existingMenu.name);
      setDescription(existingMenu.description);
    }
  }, [existingMenu]);

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!name.trim()) errs.name = "Menu name is required";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);

    try {
      if (isEdit && menuId) {
        const updated = await menuService.updateMenu(menuId, {
          name: name.trim(),
          description: description.trim(),
        });
        dispatch(updateMenuInList(updated));
      } else {
        await menuService.createMenu({
          vendorId,
          name: name.trim(),
          description: description.trim(),
        });
        dispatch(fetchMenusByVendor(vendorId));
      }
      navigate("/vendor/menus");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save menu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={480} mx="auto">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/vendor/menus")}
        sx={{ mb: 2 }}
      >
        Back to Menus
      </Button>
      <Typography variant="h5" fontWeight={700} mb={3}>
        {isEdit ? "Edit Menu" : "New Menu"}
      </Typography>

      <Stack spacing={2} mb={3}>
        <TextField
          label="Menu Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={Boolean(fieldErrors.name)}
          helperText={fieldErrors.name}
          fullWidth
          required
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
        {loading ? "Saving…" : isEdit ? "Update Menu" : "Create Menu"}
      </Button>
    </Box>
  );
}
