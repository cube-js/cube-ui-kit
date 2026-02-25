import type { Side } from './LayoutContext';

/**
 * Clamps a size value within min/max constraints.
 * Handles both number and string constraint values (only numbers are applied).
 */
export function clampSize(
  value: number,
  minSize?: number | string,
  maxSize?: number | string,
  naturalMax?: number,
): number {
  let result = value;

  let effectiveMax: number | undefined;

  if (typeof maxSize === 'number') {
    effectiveMax = maxSize;
  }

  if (naturalMax != null && naturalMax >= 0) {
    effectiveMax =
      effectiveMax != null ? Math.min(effectiveMax, naturalMax) : naturalMax;
  }

  if (effectiveMax != null) {
    result = Math.min(effectiveMax, result);
  }

  if (typeof minSize === 'number') {
    result = Math.max(minSize, result);
  }

  return Math.max(result, 0);
}

const OPPOSITE_SIDES: Record<Side, Side> = {
  left: 'right',
  right: 'left',
  top: 'bottom',
  bottom: 'top',
};

export function getOppositeSide(side: Side): Side {
  return OPPOSITE_SIDES[side];
}

/**
 * Resolves a CSS size value (string or number) to pixels.
 * Supports `px` values and percentages (resolved against containerSize).
 * Returns undefined for values that can't be resolved in JS (e.g. `50vw`, `min(...)`, etc.).
 */
export function resolveCssSize(
  value: string | number | undefined,
  containerSize: number,
): number | undefined {
  if (value == null) return undefined;

  if (typeof value === 'number') return value;

  const trimmed = value.trim();

  if (trimmed.endsWith('px')) {
    const num = parseFloat(trimmed);
    return Number.isFinite(num) ? num : undefined;
  }

  if (trimmed.endsWith('%')) {
    const percent = parseFloat(trimmed);
    return Number.isFinite(percent)
      ? (percent / 100) * containerSize
      : undefined;
  }

  const num = parseFloat(trimmed);
  if (String(num) === trimmed && Number.isFinite(num)) return num;

  return undefined;
}
