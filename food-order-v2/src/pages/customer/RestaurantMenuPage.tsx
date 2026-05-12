import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import { addItem } from "../../store/slices/cartSlice";
import { fetchActiveMenu, fetchMenuItems } from "../../store/slices/menusSlice";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import type { MenuItem } from "../../types";

export default function RestaurantMenuPage() {
  const { mallId, tableId, restaurantId } = useParams<{
    mallId: string;
    tableId: string;
    restaurantId: string;
  }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { menuItems, isItemsLoading, error } = useAppSelector((s) => s.menus);
  const { vendors } = useAppSelector((s) => s.restaurants);
  const cart = useAppSelector((s) => s.cart);

  const vendor = vendors.find((v) => v.id === restaurantId);

  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchActiveMenu(restaurantId)).then((action) => {
        if (fetchActiveMenu.fulfilled.match(action) && action.payload) {
          dispatch(fetchMenuItems(action.payload.id));
        }
      });
    }
  }, [restaurantId, dispatch]);

  const handleAddToCart = (item: MenuItem) => {
    if (
      cart.vendorId &&
      cart.vendorId !== restaurantId &&
      cart.items.length > 0
    ) {
      setPendingItem(item);
      return;
    }
    dispatchAdd(item);
  };

  const dispatchAdd = (item: MenuItem) => {
    if (!restaurantId || !vendor) return;
    dispatch(
      addItem({
        menuItem: item,
        vendorId: restaurantId,
        vendorName: vendor.name,
      }),
    );
  };

  const availableItems = menuItems.filter((i) => i.isAvailable);

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/mall/${mallId}/table/${tableId}`)}
        sx={{ mb: 2 }}
      >
        All Restaurants
      </Button>

      {vendor && (
        <Box mb={3}>
          <Typography variant="h5" fontWeight={700}>
            {vendor.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {vendor.cuisineType}
          </Typography>
        </Box>
      )}

      <Divider sx={{ mb: 3 }} />

      {isItemsLoading && (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!isItemsLoading && availableItems.length === 0 && (
        <Alert severity="info">
          This restaurant has no available items right now.
        </Alert>
      )}

      <Grid container spacing={2}>
        {availableItems.map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
            <Card
              elevation={2}
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
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
                <Typography variant="h6" fontWeight={600}>
                  {item.name}
                </Typography>
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
                  color="primary"
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddShoppingCartIcon />}
                  onClick={() => handleAddToCart(item)}
                >
                  Add to Cart
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <ConfirmDialog
        open={Boolean(pendingItem)}
        title="Replace Cart?"
        message={`Your cart has items from ${cart.vendorName}. Adding this item will clear your current cart. Continue?`}
        confirmLabel="Clear & Add"
        onConfirm={() => {
          if (pendingItem) dispatchAdd(pendingItem);
          setPendingItem(null);
        }}
        onCancel={() => setPendingItem(null)}
      />
    </Box>
  );
}
