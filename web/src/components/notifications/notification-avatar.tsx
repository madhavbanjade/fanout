const TYPE_COLOR: Record<string, string> = {
  mention: "var(--color-notif-mention)",
  order: "var(--color-notif-order)",
  task: "var(--color-notif-task)",
  system: "var(--color-notif-system)",
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
    case "order":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "task":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 13l4 4L19 7" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
