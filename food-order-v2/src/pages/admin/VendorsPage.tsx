import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  TextField,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { restaurantService } from "../../services/restaurantService";
import { useAppSelector } from "../../hooks/useAppStore";
import type { Vendor } from "../../types";

export default function VendorsPage() {
  const navigate = useNavigate();
  const isSuperAdmin = useAppSelector((s) => s.auth.isSuperAdmin);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    restaurantService
      .getAllVendors()
      .then(setVendors)
      .catch(() => setError("Failed to load vendors."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = vendors.filter(
    (v) =>
      (v.restaurantName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.user?.name ?? v.name ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (v.user?.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.cuisineType ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" fontWeight={700}>
          Vendors
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/admin/vendors/invite")}
        >
          Invite Vendor
        </Button>
      </Box>

      <TextField
        placeholder="Search vendors…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 3, maxWidth: 320 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && filtered.length === 0 && (
        <Alert severity="info">No vendors found.</Alert>
      )}

      {!loading && filtered.length > 0 && (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Restaurant</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Email</TableCell>
                {isSuperAdmin && <TableCell>Mall</TableCell>}
                <TableCell>Cuisine</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Profile</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((vendor) => {
                const ownerName = vendor.user?.name ?? vendor.name ?? "—";
                const ownerEmail = vendor.user?.email ?? "—";
                const joined = vendor.createdAt
                  ? new Date(vendor.createdAt).toLocaleDateString()
                  : "—";
                return (
                  <TableRow key={vendor.id} hover>
                    <TableCell>
                      <Typography fontWeight={600} variant="body2">
                        {vendor.restaurantName}
                      </Typography>
                      {vendor.description && (
                        <Typography variant="caption" color="text.secondary">
                          {vendor.description.slice(0, 60)}
                          {vendor.description.length > 60 ? "…" : ""}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{ownerName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{ownerEmail}</Typography>
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        <Typography variant="body2">
                          {vendor.mall?.name ?? "—"}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell>
                      <Typography variant="body2">
                        {vendor.cuisineType ?? "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={vendor.vendorType.replace("_", " ")}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={vendor.isActive ? "Open" : "Closed"}
                        color={vendor.isActive ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          vendor.isProfileComplete ? "Complete" : "Incomplete"
                        }
                        color={vendor.isProfileComplete ? "success" : "warning"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {joined}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => navigate(`/admin/vendors/${vendor.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
