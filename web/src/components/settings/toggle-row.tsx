import type { ReactNode } from "react";

function RequiredBadge() {
  return (
    <span
      className="ml-2 rounded-full px-2 py-0.5 align-middle uppercase"
      style={{
        fontSize: "var(--text-overline)",
        letterSpacing: "0.06em",
        background: "var(--color-warning-badge)",
        color: "var(--color-warning)",
        fontWeight: "var(--weight-medium)",
      }}
    >
      Required
    </span>
  );
}

export default function ToggleRow({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  checked,
  onChange,
  disabled,
  required,
}: {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5"
      style={{ borderBottom: "1px solid var(--color-border)" }}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)" }}>
          {title}
          {required && <RequiredBadge />}
        </p>
        <p className="text-muted mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="toggle"
        title={disabled ? "This notification type can't be turned off" : undefined}
      />
    </div>
  );
}
