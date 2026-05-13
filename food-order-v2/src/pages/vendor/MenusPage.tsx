import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Card,
  CardContent,
  CardActions,
  Switch,
  FormControlLabel,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import {
  fetchMenusByVendor,
  updateMenuInList,
  removeMenu,
} from "../../store/slices/menusSlice";
import { menuService } from "../../services/menuService";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function MenusPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const vendorId = useAppSelector((s) => s.auth.user?.sub ?? "");
  const { menus, isLoading, error } = useAppSelector((s) => s.menus);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (vendorId) dispatch(fetchMenusByVendor(vendorId));
  }, [vendorId, dispatch]);

  const handleToggleActive = async (
    menuId: string,
    currentlyActive: boolean,
  ) => {
    if (currentlyActive) return; // prevent deactivating the current active menu directly
    try {
      // Backend atomically deactivates all other menus and activates this one
      const updated = await menuService.activateMenu(menuId);
      menus.forEach((m) => {
        if (m.id !== menuId && m.isActive) {
          dispatch(updateMenuInList({ ...m, isActive: false }));
        }
      });
      dispatch(updateMenuInList(updated));
    } catch {
      /* show toast in production */
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await menuService.deleteMenu(deleteTarget);
      dispatch(removeMenu(deleteTarget));
    } catch {
      /* show toast */
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" fontWeight={700}>
          Menus
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/vendor/menus/new")}
        >
          New Menu
        </Button>
      </Box>

      {isLoading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!isLoading && menus.length === 0 && (
        <Alert severity="info">
          No menus yet. Create your first menu to get started.
        </Alert>
      )}

      <Stack spacing={2}>
        {menus.map((menu) => (
          <Card key={menu.id} variant="outlined">
            <CardContent sx={{ pb: 1 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {menu.name}
                    {menu.isActive && (
                      <Chip
                        label="Active"
                        color="success"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                  {menu.description && (
                    <Typography variant="body2" color="text.secondary">
                      {menu.description}
                    </Typography>
                  )}
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={menu.isActive}
                      onChange={() =>
                        handleToggleActive(menu.id, menu.isActive)
                      }
                      color="success"
                      disabled={menu.isActive}
                    />
                  }
                  label="Set Active"
                />
              </Box>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                startIcon={<ListAltIcon />}
                onClick={() => navigate(`/vendor/menus/${menu.id}/items`)}
              >
                Items
              </Button>
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/vendor/menus/${menu.id}/edit`)}
              >
                Edit
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteTarget(menu.id)}
                disabled={menu.isActive}
              >
                Delete
              </Button>
            </CardActions>
          </Card>
        ))}
      </Stack>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Menu?"
        message="This will permanently delete the menu and all its items. This cannot be undone."
        confirmLabel={deleteLoading ? "Deleting…" : "Delete"}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
