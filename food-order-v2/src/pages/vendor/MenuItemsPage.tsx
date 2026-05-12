import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Switch,
  FormControlLabel,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import {
  fetchMenuItems,
  updateMenuItemInList,
  removeMenuItem,
} from "../../store/slices/menusSlice";
import { menuService } from "../../services/menuService";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function MenuItemsPage() {
  const { menuId } = useParams<{ menuId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { menuItems, isItemsLoading, error } = useAppSelector((s) => s.menus);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (menuId) dispatch(fetchMenuItems(menuId));
  }, [menuId, dispatch]);

  const handleToggleAvailable = async (itemId: string, current: boolean) => {
    try {
      const formData = new FormData();
      formData.append("isAvailable", String(!current));
      const updated = await menuService.updateMenuItem(itemId, formData);
      dispatch(updateMenuItemInList(updated));
    } catch {
      /* show toast */
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await menuService.deleteMenuItem(deleteTarget);
      dispatch(removeMenuItem(deleteTarget));
    } catch {
      /* show toast */
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/vendor/menus")}
        sx={{ mb: 2 }}
      >
        Back to Menus
      </Button>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" fontWeight={700}>
          Menu Items
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate(`/vendor/menus/${menuId}/items/new`)}
        >
          Add Item
        </Button>
      </Box>

      {isItemsLoading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!isItemsLoading && menuItems.length === 0 && (
        <Alert severity="info">
          No items in this menu yet. Add your first item.
        </Alert>
      )}

      <Grid container spacing={2}>
        {menuItems.map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                opacity: item.isAvailable ? 1 : 0.6,
              }}
            >
              {item.imageUrl ? (
                <CardMedia
                  component="img"
                  height="140"
                  image={item.imageUrl}
                  alt={item.name}
                />
              ) : (
                <Box
                  sx={{
                    height: 140,
                    bgcolor: "grey.100",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="h4">🍴</Typography>
                </Box>
              )}
              <CardContent sx={{ flex: 1 }}>
                <Typography fontWeight={600}>{item.name}</Typography>
                {item.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mt={0.5}
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.description}
                  </Typography>
                )}
                <Chip
                  label={`$${item.price.toFixed(2)}`}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>
              <CardActions sx={{ flexWrap: "wrap", gap: 0.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={item.isAvailable}
                      onChange={() =>
                        handleToggleAvailable(item.id, item.isAvailable)
                      }
                      color="success"
                    />
                  }
                  label={
                    <Typography variant="caption">
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </Typography>
                  }
                />
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() =>
                    navigate(`/vendor/menus/${menuId}/items/${item.id}/edit`)
                  }
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteTarget(item.id)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Item?"
        message="This will permanently remove the menu item."
        confirmLabel={deleteLoading ? "Deleting…" : "Delete"}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
