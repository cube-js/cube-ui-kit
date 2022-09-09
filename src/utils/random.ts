export function random(min: number, max: number) {
  const realMin = min < max ? min : max;
  const realMax = min < max ? max : min;

  return realMin + Math.random() * (realMax - realMin);
}
