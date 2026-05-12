import { useNavigate } from "react-router";
import { Box, Button, Typography } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      gap={2}
      p={3}
    >
      <LockIcon sx={{ fontSize: 64, color: "error.main" }} />
      <Typography variant="h5" fontWeight={700}>
        Access Denied
      </Typography>
      <Typography color="text.secondary" textAlign="center">
        You do not have permission to view this page.
      </Typography>
      <Button variant="contained" onClick={() => navigate("/login")}>
        Back to Login
      </Button>
    </Box>
  );
}
