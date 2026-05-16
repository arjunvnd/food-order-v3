import { useState, useEffect } from "react";
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
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider as MuiDivider,
  Chip,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import { selectCartItemCount } from "../../store/slices/cartSlice";
import {
  addNotification,
  markAllRead,
} from "../../store/slices/notificationsSlice";
import { superAdminService } from "../../services/superAdminService";
import { orderService } from "../../services/orderService";

interface Props {
  variant: "customer" | "vendor" | "admin" | "super_admin";
}

export default function Navbar({ variant }: Props) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, logout } = useAuth0();
  const cartItems = useAppSelector((s) => s.cart.items);
  const cartCount = selectCartItemCount(cartItems);
  const isSuperAdmin = useAppSelector((s) => s.auth.isSuperAdmin);
  const notifications = useAppSelector((s) => s.notifications.items);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const vendorId = useAppSelector((s) => s.auth.vendorId);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [bellAnchor, setBellAnchor] = useState<null | HTMLElement>(null);

  // Super admin: load pending access request count once on mount
  useEffect(() => {
    if (variant !== "super_admin") return;
    superAdminService.getAccessRequests().then((requests) => {
      if (requests.length > 0) {
        dispatch(
          addNotification({
            message: `${requests.length} user${requests.length > 1 ? "s" : ""} waiting for access approval`,
            severity: "warning",
            link: "/super-admin/access-requests",
          }),
        );
      }
    }).catch(() => {/* ignore — navbar shouldn't crash */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  // Vendor: load pending order count once on mount so the bell shows a badge
  // even before a real-time order arrives.
  useEffect(() => {
    if (variant !== "vendor" || !vendorId) return;
    orderService.getVendorOrders(vendorId, "PENDING").then((orders) => {
      if (orders.length > 0) {
        dispatch(
          addNotification({
            message: `${orders.length} pending order${orders.length > 1 ? "s" : ""} waiting for your decision`,
            severity: "warning",
            link: "/vendor/orders",
          }),
        );
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, vendorId]);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleBellOpen = (e: React.MouseEvent<HTMLElement>) => {
    setBellAnchor(e.currentTarget);
    dispatch(markAllRead());
  };
  const handleBellClose = () => setBellAnchor(null);

  const handleNotificationClick = (link?: string) => {
    handleBellClose();
    if (link) navigate(link);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout({ logoutParams: { returnTo: window.location.origin + "/login" } });
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        {variant === "customer" ? (
          // Customer logo is non-navigable — the root path redirects to /login
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, color: "inherit" }}
          >
            MallBite
          </Typography>
        ) : (
          <Typography
            variant="h6"
            component={RouterLink}
            to={
              variant === "vendor"
                ? "/vendor"
                : variant === "admin"
                  ? "/admin"
                  : "/super-admin"
            }
            sx={{ flexGrow: 1, textDecoration: "none", color: "inherit" }}
          >
            MallBite
          </Typography>
        )}

        {variant === "vendor" && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button color="inherit" component={RouterLink} to="/vendor/orders">
              Orders
            </Button>
            <Button color="inherit" component={RouterLink} to="/vendor/menus">
              Menus
            </Button>
            <Button color="inherit" component={RouterLink} to="/vendor/tables">
              QR Codes
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
            <Button color="inherit" component={RouterLink} to="/admin/tables">
              Tables
            </Button>
            {isSuperAdmin && (
              <Button color="inherit" component={RouterLink} to="/super-admin">
                Super Admin
              </Button>
            )}
          </Box>
        )}

        {variant === "super_admin" && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              color="inherit"
              component={RouterLink}
              to="/super-admin/users"
            >
              Users
            </Button>
            <Button color="inherit" component={RouterLink} to="/admin">
              Admin Panel
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

        {(variant === "vendor" ||
          variant === "admin" ||
          variant === "super_admin") && (
          <>
            {/* Notification bell */}
            <IconButton color="inherit" onClick={handleBellOpen} sx={{ ml: 1 }}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Popover
              open={Boolean(bellAnchor)}
              anchorEl={bellAnchor}
              onClose={handleBellClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <Box sx={{ width: 320, maxHeight: 380, overflow: "auto" }}>
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700}>
                    Notifications
                  </Typography>
                  {notifications.length > 0 && (
                    <Chip
                      label={`${notifications.length}`}
                      size="small"
                      color="default"
                    />
                  )}
                </Box>
                <MuiDivider />
                {notifications.length === 0 ? (
                  <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      No notifications yet
                    </Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {notifications.map((n, i) => (
                      <Box key={n.id}>
                        <ListItem disablePadding>
                          <ListItemButton
                            onClick={() => handleNotificationClick(n.link)}
                            sx={{ py: 1 }}
                          >
                            <ListItemText
                              primary={n.message}
                              secondary={new Date(n.createdAt).toLocaleTimeString()}
                              primaryTypographyProps={{
                                variant: "body2",
                                color:
                                  n.severity === "error"
                                    ? "error.main"
                                    : n.severity === "warning"
                                      ? "warning.main"
                                      : n.severity === "success"
                                        ? "success.main"
                                        : "text.primary",
                              }}
                              secondaryTypographyProps={{ variant: "caption" }}
                            />
                          </ListItemButton>
                        </ListItem>
                        {i < notifications.length - 1 && (
                          <MuiDivider component="li" />
                        )}
                      </Box>
                    ))}
                  </List>
                )}
              </Box>
            </Popover>

            {/* Account menu */}
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
