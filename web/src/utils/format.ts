export function formatDeltaPct(deltaPct: number, invert = false) {
  const positive = invert ? deltaPct <= 0 : deltaPct >= 0;
  const arrow = deltaPct >= 0 ? "↑" : "↓";
  return { text: `${arrow} ${Math.abs(deltaPct)}% vs yesterday`, positive };
}

export function formatDeltaMs(deltaMs: number) {
  const positive = deltaMs <= 0;
  const arrow = deltaMs >= 0 ? "↑" : "↓";
  return { text: `${arrow} ${Math.abs(deltaMs)}ms vs yesterday`, positive };
}

export function capitalize(value: string) {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}

export function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export function greetingForHour(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
