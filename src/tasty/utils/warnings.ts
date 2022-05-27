const PREFIX = 'Tasty';

export function warn(...args) {
  console.warn(`${PREFIX}:`, ...args);
}

export function deprecationWarning(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  condition: any,
  {
    property,
    name,
    betterAlternative,
    reason,
  }: {
    property: string;
    name: string;
    betterAlternative: (() => string) | string;
    reason?: (() => string) | string;
  },
) {
  if (condition) return;

  if (process.env.NODE_ENV === 'production') {
    return warn(
      `DEPRECATION ${name} "${property}" -> ${
        typeof betterAlternative === 'function'
          ? betterAlternative()
          : betterAlternative
      }`,
    );
  }

  // we can make deprecations even better if we add the md syntax in the console.
  // anyway, everything down below will be stripped in the production build
  console.group(`⚠️ ${PREFIX}: Deprecation in ${name}`);
  warn(
    `"${property}" is deprecated, consider better alternative: ${
      typeof betterAlternative === 'function'
        ? betterAlternative()
        : betterAlternative
    }`,
  );
  reason && warn(`Reason: ${typeof reason === 'function' ? reason() : reason}`);
  console.groupEnd();
}
