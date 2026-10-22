// Compact "5m", "3h", "2d", "3w", then a short date. Hand-rolled so server and browser render identical text.
export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "now";
  if (s < 5 * 604800) {
    for (const [suffix, size] of [["w", 604800], ["d", 86400], ["h", 3600], ["m", 60]] as const) {
      if (s >= size) return `${Math.floor(s / size)}${suffix}`;
    }
  }
  const d = new Date(iso);
  return `${d.getUTCDate()} ${"Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")[d.getUTCMonth()]}`;
}
