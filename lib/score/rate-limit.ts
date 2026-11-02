import "server-only";

/**
 * Sliding-window limit per key, in memory. Good enough for one BFF instance and the demo; with several instances,
 * move it to a shared store (Redis) so the limit holds across them.
 */
const hits = new Map<string, number[]>();

export function allow(key: string, max = 10, windowMs = 60_000, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
