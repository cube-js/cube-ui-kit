const SUGGESTED_PROP_MAP = {
  disabled: 'isDisabled',
  loading: 'isLoading',
  selected: 'isSelected',
  onClick: 'onPress',
};

export function propDeprecationWarning(name, props, propList) {
  propList.forEach((prop) => {
    if (prop in props) {
      const suggestion = SUGGESTED_PROP_MAP[prop];

      console.warn(
        `UI Kit: "${prop}" property of "${name}" component is deprecated.${
          suggestion ? ` Use "${suggestion}" property instead.` : ''
        }`,
      );
    }
  });
}
