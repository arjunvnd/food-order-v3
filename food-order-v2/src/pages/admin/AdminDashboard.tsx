import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
} from "@mui/material";
import StoreIcon from "@mui/icons-material/Store";
import { restaurantService } from "../../services/restaurantService";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [vendorCount, setVendorCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restaurantService
      .getAllVendors()
      .then((v) => setVendorCount(v.length))
      .catch(() => setVendorCount(0))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Admin Dashboard
      </Typography>

      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <StoreIcon sx={{ fontSize: 40, color: "primary.main" }} />
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {loading ? <CircularProgress size={28} /> : vendorCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Vendors
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Button variant="contained" onClick={() => navigate("/admin/vendors")}>
        Manage Vendors
      </Button>
    </Box>
  );
}
