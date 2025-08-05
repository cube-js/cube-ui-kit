export function random(min: number, max: number) {
  const realMin = min < max ? min : max;
  const realMax = min < max ? max : min;

  return realMin + Math.random() * (realMax - realMin);
}

/**
 * Generates a unique random ID using current timestamp and random number
 */
export function generateRandomId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
