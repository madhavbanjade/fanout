import type { ReactNode } from "react";

export default function StatCard({
  label,
  value,
  deltaLabel,
  deltaPositive,
  accent,
  iconBg,
  iconColor,
  icon,
}: {
  label: string;
  value: string;
  deltaLabel: string;
  deltaPositive: boolean;
  accent: string;
  iconBg: string;
  iconColor: string;
  icon: ReactNode;
}) {
  return (
    <article className="card p-5" style={{ borderLeft: `3px solid ${accent}` }}>
      <div className="flex items-center justify-between">
        <span className="text-muted">{label}</span>
        <span className="grid h-7 w-7 place-items-center rounded-full" style={{ background: iconBg, color: iconColor }}>
          {icon}
        </span>
      </div>
      <p
        className="mt-3"
        style={{
          fontSize: "var(--text-2xl)",
          fontWeight: "var(--weight-semibold)",
          color: "var(--color-text-primary)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </p>
      <p
        className="mt-1"
        style={{ fontSize: "var(--text-xs)", color: deltaPositive ? "var(--color-success)" : "var(--color-danger)" }}
      >
        {deltaLabel}
      </p>
    </article>
  );
}
