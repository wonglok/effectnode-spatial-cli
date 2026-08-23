export type Vec3 = [number, number, number];

/** Coerce an unknown value into a 3-number tuple, falling back when invalid. */
export function readVec3(value: unknown, fallback: Vec3): Vec3 {
  if (Array.isArray(value) && value.length === 3) {
    const arr = value.map((v) => (typeof v === "number" ? v : Number(v)));
    if (arr.every((v) => Number.isFinite(v))) {
      return [arr[0], arr[1], arr[2]];
    }
  }
  return fallback;
}
