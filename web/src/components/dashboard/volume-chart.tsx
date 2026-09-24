"use client";

import { useId, useMemo } from "react";
import type { VolumePoint } from "@/src/types";

const WIDTH = 720;
const HEIGHT = 220;
const PADDING_X = 8;
const PADDING_Y = 16;

function buildPath(values: number[], max: number) {
  if (values.length === 0) return { line: "", area: "" };

  const step = (WIDTH - PADDING_X * 2) / Math.max(values.length - 1, 1);
  const points = values.map((value, index) => {
    const x = PADDING_X + step * index;
    const y = HEIGHT - PADDING_Y - (max === 0 ? 0 : (value / max) * (HEIGHT - PADDING_Y * 2));
    return [x, y] as const;
  });

  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${line} L${points[points.length - 1][0]},${HEIGHT} L${points[0][0]},${HEIGHT} Z`;

  return { line, area };
}

function formatDayLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

export default function VolumeChart({ data }: { data: VolumePoint[] }) {
  const gradientId = useId();
  const max = Math.max(1, ...data.map((point) => Math.max(point.sent, point.delivered)));

  const { deliveredLine, deliveredArea, sentLine } = useMemo(() => {
    const delivered = buildPath(
      data.map((point) => point.delivered),
      max,
    );
    const sent = buildPath(
      data.map((point) => point.sent),
      max,
    );
    return { deliveredLine: delivered.line, deliveredArea: delivered.area, sentLine: sent.line };
  }, [data, max]);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full min-w-[420px]"
        role="img"
        aria-label="Delivery volume over the last 7 days"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-success)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-success)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {deliveredArea && <path d={deliveredArea} fill={`url(#${gradientId})`} />}
        {sentLine && (
          <path d={sentLine} fill="none" stroke="var(--color-primary)" strokeWidth={1.5} opacity={0.55} />
        )}
        {deliveredLine && (
          <path d={deliveredLine} fill="none" stroke="var(--color-success)" strokeWidth={2} />
        )}
      </svg>

      <div className="mt-2 flex justify-between px-1" style={{ minWidth: 420 }}>
        {data.map((point) => (
          <span key={point.date} style={{ fontSize: "var(--text-chart-axis)", color: "var(--color-text-muted)" }}>
            {formatDayLabel(point.date)}
          </span>
        ))}
      </div>
    </div>
  );
}
