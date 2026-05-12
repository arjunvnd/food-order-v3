import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import { setTableContext } from "../../store/slices/cartSlice";
import { fetchVendorsByMall } from "../../store/slices/restaurantsSlice";

export default function TablePage() {
  const { mallId, tableId } = useParams<{ mallId: string; tableId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { vendors, isLoading, error } = useAppSelector((s) => s.restaurants);

  useEffect(() => {
    if (mallId && tableId) {
      dispatch(setTableContext({ mallId, tableId }));
      dispatch(fetchVendorsByMall(mallId));
    }
  }, [mallId, tableId, dispatch]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error}
      </Alert>
    );
  }

  const activeVendors = vendors.filter((v) => v.isActive);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={1}>
        Welcome to the Food Court
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Table {tableId} — Choose a restaurant to get started
      </Typography>

      {activeVendors.length === 0 ? (
        <Alert severity="info">
          No restaurants are available right now. Please check back later.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {activeVendors.map((vendor) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={vendor.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
                elevation={2}
              >
                <CardActionArea
                  onClick={() =>
                    navigate(
                      `/mall/${mallId}/table/${tableId}/restaurant/${vendor.id}`,
                    )
                  }
                  sx={{ flex: 1 }}
                >
                  {vendor.logoUrl ? (
                    <CardMedia
                      component="img"
                      height="160"
                      image={vendor.logoUrl}
                      alt={vendor.name}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 160,
                        bgcolor: "grey.200",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="h3">🍽️</Typography>
                    </Box>
                  )}
                  <CardContent>
                    <Typography variant="h6" fontWeight={600}>
                      {vendor.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {vendor.cuisineType}
                    </Typography>
                    {vendor.description && (
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
                        {vendor.description}
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
