import { ForwardedRef, forwardRef } from 'react';
import THEMES from '../../../data/themes';
import { CubeAlertProps } from './types';
import { useAlert } from './use-alert';
import { tasty } from '../../../tasty';

const AlertElement = tasty({
  name: 'Alert',
  role: 'alert',
  qa: 'Alert',
  styles: {
    display: 'block',
    flow: 'column',
    radius: '1r',
    padding: '1.5x',
    preset: 't3',
    color: {
      '': '#dark',
      '[data-type="disabled"]': THEMES.disabled.color,
    },
    fill: {
      '': '#clear',
      ...Object.keys(THEMES).reduce((map, type) => {
        map[`[data-type="${type}"]`] = THEMES[type].fill;

        return map;
      }, {}),
    },
    border: {
      '': '#clear',
      ...Object.keys(THEMES).reduce((map, type) => {
        map[`[data-type="${type}"]`] = THEMES[type].border;

        return map;
      }, {}),
    },
  },
});

export const Alert = forwardRef(function Alert(
  props: CubeAlertProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { styles, theme, filteredProps } = useAlert(props);

  return (
    <AlertElement
      {...filteredProps}
      data-type={theme}
      styles={styles}
      ref={ref}
    />
  );
});
