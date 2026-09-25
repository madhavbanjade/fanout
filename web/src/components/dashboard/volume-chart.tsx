"use client";

import { useId, useMemo } from "react";
import type { VolumePoint } from "@/src/types";

const WIDTH = 720;
const HEIGHT = 240;
const PADDING_X = 36;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;
const GRID_LINES = 4;

type Point = readonly [number, number];

function scaleY(value: number, max: number) {
  if (max === 0) return HEIGHT - PADDING_BOTTOM;
  const usable = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  return HEIGHT - PADDING_BOTTOM - (value / max) * usable;
}

function toPoints(values: number[], max: number): Point[] {
  const step = (WIDTH - PADDING_X * 2) / Math.max(values.length - 1, 1);
  return values.map((value, index) => [PADDING_X + step * index, scaleY(value, max)] as const);
}

// Catmull-Rom -> cubic Bezier conversion for a gently smoothed line instead
// of sharp straight-line segments between daily data points.
function smoothPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0][0]},${points[0][1]}`;

  let path = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;

    path += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return path;
}

function niceTicks(max: number, count: number) {
  return Array.from({ length: count + 1 }, (_, i) => Math.round((max / count) * i)).reverse();
}

function formatDayLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

export default function VolumeChart({ data }: { data: VolumePoint[] }) {
  const gradientId = useId();

  const countMax = Math.max(1, ...data.map((point) => Math.max(point.sent, point.delivered, point.failed)));
  const latencyMax = Math.max(1, ...data.map((point) => point.avgLatencyMs));

  const { sentLine, deliveredLine, deliveredArea, failedLine, latencyLine, sentPoints, deliveredPoints, failedPoints, latencyPoints } =
    useMemo(() => {
      const sentPts = toPoints(
        data.map((point) => point.sent),
        countMax,
      );
      const deliveredPts = toPoints(
        data.map((point) => point.delivered),
        countMax,
      );
      const failedPts = toPoints(
        data.map((point) => point.failed),
        countMax,
      );
      const latencyPts = toPoints(
        data.map((point) => point.avgLatencyMs),
        latencyMax,
      );

      const deliveredPathLine = smoothPath(deliveredPts);
      const floorY = HEIGHT - PADDING_BOTTOM;
      const deliveredPathArea =
        deliveredPts.length > 0
          ? `${deliveredPathLine} L${deliveredPts[deliveredPts.length - 1][0]},${floorY} L${deliveredPts[0][0]},${floorY} Z`
          : "";

      return {
        sentLine: smoothPath(sentPts),
        deliveredLine: deliveredPathLine,
        deliveredArea: deliveredPathArea,
        failedLine: smoothPath(failedPts),
        latencyLine: smoothPath(latencyPts),
        sentPoints: sentPts,
        deliveredPoints: deliveredPts,
        failedPoints: failedPts,
        latencyPoints: latencyPts,
      };
    }, [data, countMax, latencyMax]);

  const countTicks = niceTicks(countMax, GRID_LINES);
  const latencyTicks = niceTicks(latencyMax, GRID_LINES);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full min-w-[480px]"
        role="img"
        aria-label="Sent, delivered, failed volume and average latency over the last 7 days"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-success)" stopOpacity="0.24" />
            <stop offset="100%" stopColor="var(--color-success)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines + left (count) / right (latency) axis labels */}
        {countTicks.map((tick, index) => {
          const y = scaleY(tick, countMax);
          return (
            <g key={tick + index}>
              <line
                x1={PADDING_X}
                x2={WIDTH - PADDING_X}
                y1={y}
                y2={y}
                stroke="var(--color-border)"
                strokeWidth={1}
                strokeDasharray={index === countTicks.length - 1 ? undefined : "3,4"}
                opacity={0.6}
              />
              <text x={0} y={y + 3} fontSize="9" fill="var(--color-text-muted)">
                {tick}
              </text>
              <text x={WIDTH - PADDING_X + 6} y={y + 3} fontSize="9" fill="var(--color-text-muted)">
                {latencyTicks[index]}ms
              </text>
            </g>
          );
        })}

        {deliveredArea && <path d={deliveredArea} fill={`url(#${gradientId})`} />}

        {sentLine && <path d={sentLine} fill="none" stroke="var(--color-primary)" strokeWidth={2} strokeLinecap="round" />}
        {deliveredLine && (
          <path d={deliveredLine} fill="none" stroke="var(--color-success)" strokeWidth={2.25} strokeLinecap="round" />
        )}
        {failedLine && (
          <path d={failedLine} fill="none" stroke="var(--color-danger)" strokeWidth={2} strokeLinecap="round" opacity={0.85} />
        )}
        {latencyLine && (
          <path
            d={latencyLine}
            fill="none"
            stroke="var(--color-warning)"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeDasharray="5,4"
            opacity={0.9}
          />
        )}

        {/* Data point markers, with the latest day emphasized */}
        {[
          { points: sentPoints, color: "var(--color-primary)" },
          { points: deliveredPoints, color: "var(--color-success)" },
          { points: failedPoints, color: "var(--color-danger)" },
          { points: latencyPoints, color: "var(--color-warning)" },
        ].map(({ points, color }, seriesIndex) =>
          points.map(([x, y], index) => (
            <circle
              key={`${seriesIndex}-${index}`}
              cx={x}
              cy={y}
              r={index === points.length - 1 ? 3.5 : 2}
              fill="var(--color-card-bg)"
              stroke={color}
              strokeWidth={index === points.length - 1 ? 2 : 1.5}
            />
          )),
        )}
      </svg>

      <div className="mt-2 flex justify-between px-1" style={{ minWidth: 480 }}>
        {data.map((point) => (
          <span key={point.date} style={{ fontSize: "var(--text-chart-axis)", color: "var(--color-text-muted)" }}>
            {formatDayLabel(point.date)}
          </span>
        ))}
      </div>
    </div>
  );
}
