import { useAuth0 } from "@auth0/auth0-react";
import { Box, Button, Typography, Paper } from "@mui/material";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";

export default function LoginPage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="grey.100"
    >
      <Paper
        elevation={3}
        sx={{ p: 5, textAlign: "center", maxWidth: 400, width: "100%" }}
      >
        <RestaurantMenuIcon
          sx={{ fontSize: 56, color: "primary.main", mb: 2 }}
        />
        <Typography variant="h4" gutterBottom fontWeight={700}>
          MallBite
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          Sign in to access the vendor or admin portal.
        </Typography>
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={() => loginWithRedirect()}
        >
          Sign In
        </Button>
      </Paper>
    </Box>
  );
}
