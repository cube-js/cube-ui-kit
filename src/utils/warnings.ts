const SUGGESTED_PROP_MAP = {
  disabled: 'isDisabled',
  loading: 'isLoading',
  selected: 'isSelected',
};

export function propDeprecationWarning(name, props, propList) {
  propList.forEach((prop) => {
    if (prop in props) {
      const suggestion = SUGGESTED_PROP_MAP[prop];

      console.warn(
        `CubeUIKit: "${prop}" property of "${name}" component is deprecated.${
          suggestion ? ` Use "${suggestion}" property instead.` : ''
        }`,
      );
    }
  });
}
