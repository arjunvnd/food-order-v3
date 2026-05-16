import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import StoreIcon from "@mui/icons-material/Store";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import { useNavigate } from "react-router";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={1}>
        Super Admin Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Manage all platform users, malls, and roles from here.
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 1,
              }}
            >
              <PeopleIcon sx={{ fontSize: 40, color: "primary.main" }} />
              <Typography variant="h6" fontWeight={600}>
                User Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View all users and change their roles (Vendor, Mall Admin).
              </Typography>
              <Button
                variant="contained"
                size="small"
                sx={{ mt: 1 }}
                onClick={() => navigate("/super-admin/users")}
              >
                Manage Users
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 1,
              }}
            >
              <StoreIcon sx={{ fontSize: 40, color: "secondary.main" }} />
              <Typography variant="h6" fontWeight={600}>
                Mall Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create malls and assign mall admins.
              </Typography>
              <Button
                variant="contained"
                size="small"
                color="secondary"
                sx={{ mt: 1 }}
                onClick={() => navigate("/admin")}
              >
                Go to Admin Panel
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 1,
              }}
            >
              <PendingActionsIcon sx={{ fontSize: 40, color: "warning.main" }} />
              <Typography variant="h6" fontWeight={600}>
                Access Requests
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review and approve users who signed up without an invitation.
              </Typography>
              <Button
                variant="contained"
                size="small"
                color="warning"
                sx={{ mt: 1 }}
                onClick={() => navigate("/super-admin/access-requests")}
              >
                Review Requests
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
