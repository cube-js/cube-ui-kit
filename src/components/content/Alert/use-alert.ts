import { CONTAINER_STYLES, filterBaseProps, TEXT_STYLES } from '@tenphi/tasty';

import { useDeprecationWarning } from '../../../_internal';
import { extractStyles } from '../../../utils/styles';

import { CubeAlertProps } from './types';

const STYLE_LIST = [...CONTAINER_STYLES, ...TEXT_STYLES] as const;

export function useAlert(props: CubeAlertProps) {
  const { type, isDisabled = false, theme, shape = 'card', mods } = props;

  const styles = extractStyles(props, STYLE_LIST);

  useDeprecationWarning(typeof type === 'undefined', {
    property: 'type',
    name: 'Alert',
    betterAlternative: 'theme',
  });

  const _theme = isDisabled ? 'disabled' : (theme ?? type ?? 'note');

  // `theme` is the kit's status theme, rendered through the `type` mod. Tasty's
  // `filterBaseProps` keeps its own `theme` prop and renders it as
  // `data-theme`, so it comes out before filtering.
  const { theme: _statusTheme, ...domProps } = props;

  return {
    styles,
    mods: {
      shape,
      type: _theme,
      ...mods,
    },
    filteredProps: filterBaseProps(domProps, { eventProps: true }),
  };
}
