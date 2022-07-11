export function wait(timeout = 100) {
  return new Promise<void>((res) => setTimeout(res, timeout));
}
