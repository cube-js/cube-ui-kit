/**
 * Clamps a size value within min/max constraints.
 * Handles both number and string constraint values (only numbers are applied).
 */
export function clampSize(
  value: number,
  minSize?: number | string,
  maxSize?: number | string,
): number {
  let result = value;

  if (typeof maxSize === 'number') {
    result = Math.min(maxSize, result);
  }

  if (typeof minSize === 'number') {
    result = Math.max(minSize, result);
  }

  return Math.max(result, 0);
}
