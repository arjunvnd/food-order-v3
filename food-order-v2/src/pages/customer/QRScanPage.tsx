import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  Alert,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import { restaurantService } from "../../services/restaurantService";

export default function QRScanPage() {
  const { qrToken } = useParams<{ qrToken: string }>();
  const navigate = useNavigate();
  // qrToken is always present (required URL param), guard is only a safety net
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!qrToken) return;

    restaurantService
      .resolveScanToken(qrToken)
      .then((result) => {
        switch (result.type) {
          case "MALL_TABLE":
            navigate(`/mall/${result.mallId}/table/${result.tableId}`, {
              replace: true,
            });
            break;
          case "VENDOR_TABLE":
            navigate(`/restaurant/${result.vendorId}/table/${result.tableId}`, {
              replace: true,
            });
            break;
          case "VENDOR_COUNTER":
            navigate(`/restaurant/${result.vendorId}/takeaway`, {
              replace: true,
            });
            break;
        }
      })
      .catch(() => {
        setError(
          "This QR code is invalid or has expired. Please ask for a new one.",
        );
      });
  }, [qrToken, navigate]);

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
        gap={3}
        px={2}
      >
        <QrCodeScannerIcon sx={{ fontSize: 64, color: "text.disabled" }} />
        <Typography variant="h6" fontWeight={600} textAlign="center">
          QR Code Not Found
        </Typography>
        <Alert severity="error" sx={{ maxWidth: 400, width: "100%" }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
      gap={2}
    >
      <CircularProgress size={48} />
      <Typography variant="body1" color="text.secondary">
        Loading your table…
      </Typography>
    </Box>
  );
}
