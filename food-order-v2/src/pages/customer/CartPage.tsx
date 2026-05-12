import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Divider,
  Button,
  IconButton,
  Stack,
  Alert,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import {
  removeItem,
  updateQuantity,
  selectCartTotal,
} from "../../store/slices/cartSlice";

export default function CartPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, vendorName, mallId, tableId } = useAppSelector((s) => s.cart);
  const total = selectCartTotal(items);

  if (items.length === 0) {
    return (
      <Box textAlign="center" mt={8}>
        <Typography variant="h6" color="text.secondary" mb={2}>
          Your cart is empty.
        </Typography>
        {mallId && tableId && (
          <Button
            variant="contained"
            onClick={() => navigate(`/mall/${mallId}/table/${tableId}`)}
          >
            Browse Restaurants
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box maxWidth={600} mx="auto">
      <Typography variant="h5" fontWeight={700} mb={1}>
        Your Cart
      </Typography>
      {vendorName && (
        <Typography variant="body2" color="text.secondary" mb={3}>
          From: {vendorName}
        </Typography>
      )}

      <Stack spacing={2} mb={3}>
        {items.map((ci) => (
          <Paper key={ci.menuItem.id} variant="outlined" sx={{ p: 2 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box flex={1}>
                <Typography fontWeight={600}>{ci.menuItem.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  ${ci.menuItem.price.toFixed(2)} each
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <IconButton
                  size="small"
                  onClick={() =>
                    dispatch(
                      updateQuantity({
                        menuItemId: ci.menuItem.id,
                        quantity: ci.quantity - 1,
                      }),
                    )
                  }
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography minWidth={24} textAlign="center">
                  {ci.quantity}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() =>
                    dispatch(
                      updateQuantity({
                        menuItemId: ci.menuItem.id,
                        quantity: ci.quantity + 1,
                      }),
                    )
                  }
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => dispatch(removeItem(ci.menuItem.id))}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography
                fontWeight={600}
                ml={2}
                minWidth={64}
                textAlign="right"
              >
                ${(ci.menuItem.price * ci.quantity).toFixed(2)}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Stack>

      <Divider sx={{ mb: 2 }} />
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h6">Total</Typography>
        <Typography variant="h6" fontWeight={700}>
          ${total.toFixed(2)}
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        You can only order from one restaurant at a time.
      </Alert>

      <Button
        variant="contained"
        fullWidth
        size="large"
        startIcon={<ShoppingCartCheckoutIcon />}
        onClick={() => navigate("/checkout")}
      >
        Proceed to Checkout
      </Button>
    </Box>
  );
}
