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
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import { addItem, setTakeawayContext } from "../../store/slices/cartSlice";
import { fetchActiveMenu } from "../../store/slices/menusSlice";
import { restaurantService } from "../../services/restaurantService";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import type { MenuItem, Vendor } from "../../types";

export default function VendorTakeawayPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { menuItems, isItemsLoading, error } = useAppSelector((s) => s.menus);
  const cart = useAppSelector((s) => s.cart);

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [vendorError, setVendorError] = useState<string | null>(null);
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (!vendorId) return;

    restaurantService
      .getVendorById(vendorId)
      .then((v) => {
        setVendor(v);
        dispatch(
          setTakeawayContext({ vendorId, vendorName: v.restaurantName }),
        );
      })
      .catch(() => setVendorError("Could not load restaurant details."));

    dispatch(fetchActiveMenu(vendorId));
  }, [vendorId, dispatch]);

  const handleAddToCart = (item: MenuItem) => {
    if (cart.vendorId && cart.vendorId !== vendorId && cart.items.length > 0) {
      setPendingItem(item);
      return;
    }
    dispatchAdd(item);
  };

  const dispatchAdd = (item: MenuItem) => {
    if (!vendorId || !vendor) return;
    dispatch(
      addItem({ menuItem: item, vendorId, vendorName: vendor.restaurantName }),
    );
  };

  const availableItems = menuItems.filter((i) => i.isAvailable);

  return (
    <Box>
      {vendorError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {vendorError}
        </Alert>
      )}

      {vendor && (
        <Box mb={3}>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <ShoppingBagIcon color="primary" />
            <Chip label="Takeaway" color="primary" size="small" />
          </Box>
          <Typography variant="h5" fontWeight={700}>
            {vendor.restaurantName}
          </Typography>
          {vendor.cuisineType && (
            <Typography variant="body2" color="text.secondary">
              {vendor.cuisineType}
            </Typography>
          )}
          {vendor.description && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {vendor.description}
            </Typography>
          )}
        </Box>
      )}

      <Divider sx={{ mb: 3 }} />

      {isItemsLoading && (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!isItemsLoading && availableItems.length === 0 && !error && (
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
                  Add to Order
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Confirm switch-restaurant dialog */}
      <ConfirmDialog
        open={!!pendingItem}
        title="Start a new order?"
        message={`Your cart has items from another restaurant. Adding this item will clear your current cart.`}
        onConfirm={() => {
          if (pendingItem) {
            dispatchAdd(pendingItem);
            setPendingItem(null);
          }
        }}
        onCancel={() => setPendingItem(null)}
      />

      {/* Floating cart button */}
      {cart.items.length > 0 && (
        <Box
          position="fixed"
          bottom={24}
          left="50%"
          sx={{ transform: "translateX(-50%)", zIndex: 1200 }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/cart")}
            sx={{ px: 4, borderRadius: 8, boxShadow: 4 }}
          >
            View Order ({cart.items.reduce((s, i) => s + i.quantity, 0)} items)
          </Button>
        </Box>
      )}
    </Box>
  );
}
