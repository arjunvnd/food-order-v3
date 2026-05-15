import { useEffect, useRef, useState } from "react";
import {
  Alert,
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
import QrCode2Icon from "@mui/icons-material/QrCode2";
import { QRCodeCanvas } from "qrcode.react";
import { tableService } from "../../services/tableService";
import { restaurantService } from "../../services/restaurantService";
import type { Table, Vendor } from "../../types";

export default function VendorTablesPage() {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add-table dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Rotate table QR confirm dialog
  const [rotateTarget, setRotateTarget] = useState<Table | null>(null);
  const [rotateLoading, setRotateLoading] = useState(false);

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Rotate counter QR
  const [counterRotateOpen, setCounterRotateOpen] = useState(false);
  const [counterRotateLoading, setCounterRotateLoading] = useState(false);

  const tableCanvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const counterCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      restaurantService.getVendorProfile(),
      tableService.getVendorTables(),
    ])
      .then(([v, t]) => {
        if (cancelled) return;
        setVendor(v);
        setTables(t);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const qrUrl = (token: string) => `${window.location.origin}/scan/${token}`;

  const handleDownload = (
    canvas: HTMLCanvasElement | null,
    filename: string,
  ) => {
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleAddTable = async () => {
    if (!newTableNumber.trim()) return;
    setAddLoading(true);
    try {
      const created = await tableService.createVendorTable(
        newTableNumber.trim(),
      );
      setTables((prev) => [...prev, created]);
      setNewTableNumber("");
      setAddOpen(false);
    } catch {
      // leave dialog open
    } finally {
      setAddLoading(false);
    }
  };

  const handleRotateTableQr = async () => {
    if (!rotateTarget) return;
    setRotateLoading(true);
    try {
      const updated = await tableService.rotateVendorTableQr(rotateTarget.id);
      setTables((prev) =>
        prev.map((t) =>
          t.id === updated.id ? { ...t, qrToken: updated.qrToken } : t,
        ),
      );
      setRotateTarget(null);
    } catch {
      // ignore
    } finally {
      setRotateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await tableService.deleteVendorTable(deleteTarget.id);
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

  const handleRotateCounterQr = async () => {
    setCounterRotateLoading(true);
    try {
      const updated = await tableService.rotateVendorCounterQr();
      setVendor((prev) =>
        prev ? { ...prev, qrToken: updated.qrToken } : prev,
      );
      setCounterRotateOpen(false);
    } catch {
      // ignore
    } finally {
      setCounterRotateLoading(false);
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

  const isTakeaway = vendor?.vendorType === "TAKEAWAY";
  const isStandalone = vendor?.vendorType === "STANDALONE";

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        QR Codes
      </Typography>

      {/* ── Counter QR (TAKEAWAY vendors) ─────────────────────────────────── */}
      {isTakeaway && (
        <Box mb={5}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Counter QR
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Customers scan this QR at your counter to place a takeaway order.
          </Alert>

          {vendor?.qrToken ? (
            <Card variant="outlined" sx={{ maxWidth: 320 }}>
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <QRCodeCanvas
                  ref={(el) => {
                    counterCanvasRef.current = el;
                  }}
                  value={qrUrl(vendor.qrToken)}
                  size={200}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ wordBreak: "break-all", textAlign: "center" }}
                >
                  {qrUrl(vendor.qrToken)}
                </Typography>
                <Divider flexItem />
                <Box display="flex" gap={1}>
                  <Tooltip title="Download QR as PNG">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() =>
                        handleDownload(
                          counterCanvasRef.current,
                          `${vendor?.restaurantName ?? "counter"}-qr.png`,
                        )
                      }
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Rotate QR token (invalidates current QR)">
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => setCounterRotateOpen(true)}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Box>
              <Typography color="text.secondary" mb={2}>
                No counter QR yet. Generate one to get started.
              </Typography>
              <Button
                variant="contained"
                startIcon={<QrCode2Icon />}
                onClick={handleRotateCounterQr}
                disabled={counterRotateLoading}
              >
                {counterRotateLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  "Generate Counter QR"
                )}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* ── Table QR codes (STANDALONE vendors) ─────────────────────────── */}
      {isStandalone && (
        <Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6" fontWeight={600}>
              Table QR Codes
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
                          tableCanvasRefs.current[table.id] = el;
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
                            onClick={() =>
                              handleDownload(
                                tableCanvasRefs.current[table.id],
                                `table-${table.tableNumber}-qr.png`,
                              )
                            }
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
        </Box>
      )}

      {/* Fallback for MALL_VENDOR — their QRs are managed by the mall admin */}
      {vendor?.vendorType === "MALL_VENDOR" && (
        <Alert severity="info">
          You are part of a mall or food court. QR codes for your tables are
          managed by the mall admin.
        </Alert>
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

      {/* Rotate table QR confirm */}
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
            onClick={handleRotateTableQr}
            disabled={rotateLoading}
          >
            {rotateLoading ? <CircularProgress size={20} /> : "Rotate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
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

      {/* Rotate counter QR confirm */}
      <Dialog
        open={counterRotateOpen}
        onClose={() => setCounterRotateOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Rotate Counter QR?</DialogTitle>
        <DialogContent>
          <Typography>
            This generates a new counter QR token. Any currently printed codes
            will stop working.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCounterRotateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleRotateCounterQr}
            disabled={counterRotateLoading}
          >
            {counterRotateLoading ? <CircularProgress size={20} /> : "Rotate"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
