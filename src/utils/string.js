export function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, (s) => `-${s.toLowerCase()}`);
}
