import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  TableContainer,
} from "@mui/material";
import {
  superAdminService,
  type PlatformUser,
  type RoleDefinition,
} from "../../services/superAdminService";

const ROLE_COLORS: Record<string, "error" | "warning" | "default"> = {
  SUPER_ADMIN: "error",
  ADMIN: "warning",
  VENDOR: "default",
};

export default function UsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null); // userId being updated

  useEffect(() => {
    Promise.all([superAdminService.getUsers(), superAdminService.getRoles()])
      .then(([u, r]) => {
        setUsers(u);
        setRoles(r);
      })
      .catch(() => setError("Failed to load users or roles. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId);
    setError(null);
    try {
      const updated = await superAdminService.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update role.";
      setError(msg);
    } finally {
      setUpdating(null);
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
      <Typography variant="h5" fontWeight={700} mb={3}>
        User Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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
                <strong>Current Role</strong>
              </TableCell>
              <TableCell>
                <strong>Change Role</strong>
              </TableCell>
              <TableCell>
                <strong>Joined</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>{user.name ?? "—"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={ROLE_COLORS[user.role] ?? "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {user.role === "SUPER_ADMIN" ? (
                    <Typography variant="caption" color="text.secondary">
                      Cannot change
                    </Typography>
                  ) : (
                    <Select
                      size="small"
                      value={user.role}
                      disabled={updating === user.id}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value)
                      }
                      sx={{ minWidth: 140 }}
                    >
                      {roles
                        .filter((r) => r.value !== "SUPER_ADMIN")
                        .map((r) => (
                          <MenuItem key={r.value} value={r.value}>
                            {r.label}
                          </MenuItem>
                        ))}
                    </Select>
                  )}
                  {updating === user.id && (
                    <CircularProgress size={16} sx={{ ml: 1 }} />
                  )}
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary" py={2}>
                    No users found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
