import { Chip } from "@mui/material";
import type { OrderStatus } from "../../types";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "../../utils/constants";

interface Props {
  status: OrderStatus;
}

export default function OrderStatusChip({ status }: Props) {
  return (
    <Chip
      label={ORDER_STATUS_LABELS[status] ?? status}
      color={ORDER_STATUS_COLORS[status] ?? "default"}
      size="small"
    />
  );
}
