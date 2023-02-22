/**
 * Create a function that caches the result up to the limit.
 */
export function cacheWrapper<
  T extends (firstArg: any, secondArg?: string) => any,
>(handler: T, limit = 1000): T {
  let cache: { string?: ReturnType<T> } = {};
  let count = 0;

  return ((firstArg: any, secondArg?: string) => {
    const key =
      typeof firstArg === 'string' && secondArg == null
        ? firstArg
        : JSON.stringify([firstArg, secondArg]);

    if (!cache[key]) {
      if (count > limit) {
        cache = {};
        count = 0;
      }

      count++;

      cache[key] =
        secondArg == null ? handler(firstArg) : handler(firstArg, secondArg);
    }

    return cache[key];
  }) as T;
}
