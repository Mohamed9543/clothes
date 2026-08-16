// Simple visual approximation, not an anatomical simulation: scales the whole
// avatar vertically from height (relative to a neutral 170cm) and horizontally
// from weight (relative to a neutral 70kg), so measurements entered in the
// profile visibly affect the 3D body.
const NEUTRAL_HEIGHT_CM = 170;
const NEUTRAL_WEIGHT_KG = 70;
const MIN_SCALE = 0.8;
const MAX_SCALE = 1.25;

function clampScale(value: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

export function computeAvatarScale(
  heightCm?: number | null,
  weightKg?: number | null,
): [number, number, number] {
  const scaleY = heightCm ? clampScale(heightCm / NEUTRAL_HEIGHT_CM) : 1;
  const scaleXZ = weightKg ? clampScale(weightKg / NEUTRAL_WEIGHT_KG) : 1;
  return [scaleXZ, scaleY, scaleXZ];
}
