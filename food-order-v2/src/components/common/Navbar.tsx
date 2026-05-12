import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Button,
  Box,
  Menu,
  MenuItem,
  Avatar,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppSelector } from "../../hooks/useAppStore";
import { selectCartItemCount } from "../../store/slices/cartSlice";

interface Props {
  variant: "customer" | "vendor" | "admin";
}

export default function Navbar({ variant }: Props) {
  const navigate = useNavigate();
  const { user, logout } = useAuth0();
  const cartItems = useAppSelector((s) => s.cart.items);
  const cartCount = selectCartItemCount(cartItems);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    logout({ logoutParams: { returnTo: window.location.origin + "/login" } });
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to={
            variant === "vendor"
              ? "/vendor"
              : variant === "admin"
                ? "/admin"
                : "/"
          }
          sx={{ flexGrow: 1, textDecoration: "none", color: "inherit" }}
        >
          MallBite
        </Typography>

        {variant === "vendor" && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button color="inherit" component={RouterLink} to="/vendor/orders">
              Orders
            </Button>
            <Button color="inherit" component={RouterLink} to="/vendor/menus">
              Menus
            </Button>
            <Button color="inherit" component={RouterLink} to="/vendor/profile">
              Profile
            </Button>
          </Box>
        )}

        {variant === "admin" && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button color="inherit" component={RouterLink} to="/admin/vendors">
              Vendors
            </Button>
          </Box>
        )}

        {variant === "customer" && (
          <IconButton color="inherit" onClick={() => navigate("/cart")}>
            <Badge badgeContent={cartCount} color="error">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
        )}

        {(variant === "vendor" || variant === "admin") && (
          <>
            <IconButton color="inherit" onClick={handleMenuOpen} sx={{ ml: 1 }}>
              {user?.picture ? (
                <Avatar src={user.picture} sx={{ width: 32, height: 32 }} />
              ) : (
                <AccountCircleIcon />
              )}
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem disabled>
                <Typography variant="body2">{user?.email}</Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
