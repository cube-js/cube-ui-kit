export function wait(timeout = 500) {
  return new Promise<void>((res) => setTimeout(res, timeout));
}
