import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CircularProgress,
  Alert,
  Paper,
  TableContainer,
  Chip,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import {
  superAdminService,
  type AccessRequest,
} from "../../services/superAdminService";

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    superAdminService
      .getAccessRequests()
      .then(setRequests)
      .catch(() => setError("Failed to load access requests."))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (userId: string) => {
    setActioning(userId);
    setError(null);
    try {
      await superAdminService.approveRequest(userId);
      setRequests((prev) => prev.filter((r) => r.id !== userId));
    } catch {
      setError("Failed to approve request.");
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (userId: string) => {
    setActioning(userId);
    setError(null);
    try {
      await superAdminService.rejectRequest(userId);
      // Keep them in the list but clear their note so the UI reflects the action
      setRequests((prev) =>
        prev.map((r) => (r.id === userId ? { ...r, requestNote: null } : r)),
      );
    } catch {
      setError("Failed to reject request.");
    } finally {
      setActioning(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={1}>
        Access Requests
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Users who signed up without an invitation. Approve to grant access or
        reject to dismiss their request.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {requests.length === 0 ? (
        <Alert severity="info">No pending access requests.</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Name</strong>
                </TableCell>
                <TableCell>
                  <strong>Email</strong>
                </TableCell>
                <TableCell>
                  <strong>Role</strong>
                </TableCell>
                <TableCell>
                  <strong>Request note</strong>
                </TableCell>
                <TableCell>
                  <strong>Signed up</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((r) => {
                const isBusy = actioning === r.id;
                return (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.name ?? "—"}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>
                      <Chip label={r.role} size="small" />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      {r.requestNote ? (
                        <Typography variant="body2" noWrap title={r.requestNote}>
                          {r.requestNote}
                        </Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.disabled"
                          fontStyle="italic"
                        >
                          No note
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                          disabled={isBusy}
                          onClick={() => handleApprove(r.id)}
                        >
                          {isBusy ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : (
                            "Approve"
                          )}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CloseIcon />}
                          disabled={isBusy}
                          onClick={() => handleReject(r.id)}
                        >
                          Reject
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
