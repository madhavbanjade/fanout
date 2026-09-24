import type { NotificationStatus } from "@/src/types";

const STATUS_CLASS: Record<NotificationStatus, string> = {
  DELIVERED: "status-delivered",
  PENDING: "status-pending",
  FAILED: "status-failed",
  DEAD_LETTER: "status-failed",
};

const STATUS_LABEL: Record<NotificationStatus, string> = {
  DELIVERED: "Delivered",
  PENDING: "Pending",
  FAILED: "Failed",
  DEAD_LETTER: "Dead letter",
};

export default function StatusBadge({ status }: { status: NotificationStatus }) {
  return (
    <span className={`status-badge ${STATUS_CLASS[status]}`}>
      <span aria-hidden="true">●</span>
      {STATUS_LABEL[status]}
    </span>
  );
}
