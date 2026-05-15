import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import { QRCodeCanvas } from "qrcode.react";
import { tableService } from "../../services/tableService";
import type { Table } from "../../types";

export default function AdminTablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add-table dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Rotate-QR confirm dialog
  const [rotateTarget, setRotateTarget] = useState<Table | null>(null);
  const [rotateLoading, setRotateLoading] = useState(false);

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  useEffect(() => {
    tableService
      .getAdminTables()
      .then(setTables)
      .catch(() => setError("Failed to load tables"))
      .finally(() => setLoading(false));
  }, []);

  const qrUrl = (token: string) => `${window.location.origin}/scan/${token}`;

  const handleDownload = (table: Table) => {
    const canvas = canvasRefs.current[table.id];
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `table-${table.tableNumber}-qr.png`;
    a.click();
  };

  const handleAddTable = async () => {
    if (!newTableNumber.trim()) return;
    setAddLoading(true);
    try {
      const created = await tableService.createAdminTable(
        newTableNumber.trim(),
      );
      setTables((prev) => [...prev, created]);
      setNewTableNumber("");
      setAddOpen(false);
    } catch {
      // leave dialog open with error visible via snackbar or inline — keep simple for now
    } finally {
      setAddLoading(false);
    }
  };

  const handleRotateQr = async () => {
    if (!rotateTarget) return;
    setRotateLoading(true);
    try {
      const updated = await tableService.rotateAdminQr(rotateTarget.id);
      setTables((prev) =>
        prev.map((t) =>
          t.id === updated.id ? { ...t, qrToken: updated.qrToken } : t,
        ),
      );
      setRotateTarget(null);
    } catch {
      // ignore — user can retry
    } finally {
      setRotateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await tableService.deleteAdminTable(deleteTarget.id);
      setTables((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Cannot delete this table";
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" mt={4}>
        {error}
      </Typography>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" fontWeight={700}>
          Tables &amp; QR Codes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddOpen(true)}
        >
          Add Table
        </Button>
      </Box>

      {tables.length === 0 ? (
        <Typography color="text.secondary">
          No tables yet. Add a table to generate its QR code.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {tables.map((table) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={table.id}>
              <Card variant="outlined">
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Box
                    display="flex"
                    width="100%"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="subtitle1" fontWeight={700}>
                      Table {table.tableNumber}
                    </Typography>
                    <Chip
                      label={table.isActive ? "Active" : "Inactive"}
                      color={table.isActive ? "success" : "default"}
                      size="small"
                    />
                  </Box>

                  <QRCodeCanvas
                    ref={(el) => {
                      canvasRefs.current[table.id] = el;
                    }}
                    value={qrUrl(table.qrToken)}
                    size={180}
                  />

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ wordBreak: "break-all", textAlign: "center" }}
                  >
                    {qrUrl(table.qrToken)}
                  </Typography>

                  <Divider flexItem />

                  <Box display="flex" gap={1}>
                    <Tooltip title="Download QR as PNG">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleDownload(table)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Rotate QR token (invalidates current QR)">
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => setRotateTarget(table)}
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete table">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(table);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add table dialog */}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Table</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Table number"
            fullWidth
            margin="dense"
            value={newTableNumber}
            onChange={(e) => setNewTableNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTable()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddTable}
            disabled={addLoading || !newTableNumber.trim()}
          >
            {addLoading ? <CircularProgress size={20} /> : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rotate QR confirm dialog */}
      <Dialog
        open={Boolean(rotateTarget)}
        onClose={() => setRotateTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Rotate QR Code?</DialogTitle>
        <DialogContent>
          <Typography>
            This will generate a new QR token for Table{" "}
            <strong>{rotateTarget?.tableNumber}</strong>. Any printed QR codes
            will stop working immediately.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRotateTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleRotateQr}
            disabled={rotateLoading}
          >
            {rotateLoading ? <CircularProgress size={20} /> : "Rotate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Table?</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>Table {deleteTarget?.tableNumber}</strong>? This
            cannot be undone.
          </Typography>
          {deleteError && (
            <Typography color="error" variant="body2" mt={1}>
              {deleteError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={20} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
