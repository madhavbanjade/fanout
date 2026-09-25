export const TYPE_COLOR: Record<string, string> = {
  mention: "var(--color-notif-mention)",
  task: "var(--color-notif-task)",
  leave: "var(--color-success)",
  meeting: "var(--color-primary)",
  announcement: "var(--color-notif-system)",
  system: "var(--color-notif-system)",
  warning: "var(--color-warning)",
  termination: "var(--color-danger)",
  resignation: "var(--color-text-muted)",
};

function Glyph({ type }: { type: string }) {
  const stroke = "white";
  switch (type) {
    case "mention":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4" stroke={stroke} strokeWidth="1.8" />
          <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-4 7.5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "task":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 13l4 4L19 7" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "warning":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 4 3 20h18L12 4Z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 10v4M12 17v.01" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "termination":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 7l10 10M17 7 7 17" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 9v4M12 16.5v.01" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.8" />
        </svg>
      );
  }
}

export default function NotificationAvatar({ type }: { type: string }) {
  return (
    <span
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
      style={{ background: TYPE_COLOR[type] ?? "var(--color-text-muted)" }}
    >
      <Glyph type={type} />
    </span>
  );
}
