/**
 * Frame-rate independent exponential smoothing of `obj[key]` toward `target` (stand-in for maath's easing.damp).
 * `smoothTime` is roughly the seconds to cover most of the distance. Returns true while still moving.
 */
export function damp<K extends string>(obj: Record<K, number>, key: K, target: number, smoothTime = 0.25, delta = 1 / 60): boolean {
  const k = 1 - Math.exp(-(4 / Math.max(1e-4, smoothTime)) * Math.min(delta, 0.1));
  obj[key] += (target - obj[key]) * k;
  if (Math.abs(target - obj[key]) < 1e-4) {
    obj[key] = target;
    return false;
  }
  return true;
}
