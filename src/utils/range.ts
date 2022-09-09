export function range<Length extends number>(count: Length): Array<number> {
  return Array.from({ length: count }, (_, i) => i);
}
