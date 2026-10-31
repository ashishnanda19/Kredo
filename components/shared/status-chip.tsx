import { CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TxStatus } from "@/lib/mock-data";

export function StatusChip({ status }: { status: TxStatus }) {
  return status === "paid" ? (
    <Badge tone="success">
      <CheckCircle2 className="size-3.5" aria-hidden /> Paid
    </Badge>
  ) : (
    <Badge tone="warning">
      <Clock className="size-3.5" aria-hidden /> Due
    </Badge>
  );
}
