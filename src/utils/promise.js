export function timeout(ms = 30) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
