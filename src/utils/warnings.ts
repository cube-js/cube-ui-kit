const SUGGESTED_PROP_MAP = {
  disabled: 'isDisabled',
  loading: 'isLoading',
  selected: 'isSelected',
};

const PREFIX = 'CubeUIKit';

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
  console.warn(`${PREFIX} accessibility issue:`, ...args);
}

export function warn(...args) {
  console.warn(`${PREFIX}:`, ...args);
}
