const SUGGESTED_PROP_MAP = {
  disabled: 'isDisabled',
  loading: 'isLoading',
  selected: 'isSelected',
};

const PREFIX = 'CubeUIKit';
const devMode = process.env.NODE_ENV === 'development';

export function propDeprecationWarning(name, props, propList) {
  propList.forEach((prop) => {
    if (prop in props) {
      const suggestion = SUGGESTED_PROP_MAP[prop];

      warn(
        `"${prop}" property of "${name}" component is deprecated.${
          suggestion ? ` Use "${suggestion}" property instead.` : ''
        }`,
      );
    }
  });
}

export function accessibilityWarning(...args) {
  if (devMode) {
    console.warn(`${PREFIX} accessibility issue:`, ...args);
  }
}

export function warn(...args) {
  if (devMode) {
    console.warn(`${PREFIX}:`, ...args);
  }
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

  if (!devMode) return;

  // we can make deprecations even better if we add the md syntax in the console.
  // anyway, everything down below will be stripped in the production build
  console.group(`⚠️ ${PREFIX}: Deprecation in ${name}`);
  warn(
    `"${property}" is deprecated, consider better alternative: ${
      typeof betterAlternative === 'function'
        ? (betterAlternative as () => string)()
        : betterAlternative
    }`,
  );
  reason &&
    warn(
      `Reason: ${
        typeof reason === 'function' ? (reason as () => string)() : reason
      }`,
    );
  console.groupEnd();
}
