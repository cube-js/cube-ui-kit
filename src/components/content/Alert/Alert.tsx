import { tasty } from '@tenphi/tasty';
import { ForwardedRef, forwardRef } from 'react';

import THEMES from '../../../data/themes';

import { CubeAlertProps } from './types';
import { useAlert } from './use-alert';

const AlertElement = tasty({
  name: 'Alert',
  role: 'alert',
  qa: 'Alert',
  styles: {
    display: 'block',
    flow: 'column',
    radius: {
      '': '1cr',
      'shape=sharp': '0',
    },
    padding: {
      '': '1.5x',
      'size=small': '1x',
    },
    preset: {
      '': 't3',
      'size=small': 't4',
    },
    // Only on request, as on `Card`: an alert sized by its content would
    // shrink to its padding.
    container: { '': false, 'query-container': 'alert / inline-size' },
    color: {
      '': '#dark-02',
      // `color` in THEMES is Badge's fill for the status themes, so only these
      // two read it as a label.
      'type=special': THEMES.special.color,
      'type=disabled': THEMES.disabled.color,
      // `disabled`'s gray card with the regular text, for a note that is
      // neither a status nor switched off
      'type=neutral': '#surface-text',
    },
    fill: {
      '': '#clear',
      // eslint-disable-next-line tasty/no-style-spread -- per-theme fill states generated from THEMES, not a shared base; the plugin can't lint the generated map either way, so it stays in one place
      ...Object.keys(THEMES).reduce((map, type) => {
        map[`type=${type}`] = THEMES[type].fill;

        return map;
      }, {}),
      'type=neutral': THEMES.disabled.fill,
    },
    border: {
      '': '#clear',
      // eslint-disable-next-line tasty/no-style-spread -- per-theme border states generated from THEMES must precede 'shape=sharp'; mergeStyles would append them after it and flip its priority
      ...Object.keys(THEMES).reduce((map, type) => {
        map[`type=${type}`] = THEMES[type].border;

        return map;
      }, {}),
      'type=neutral': THEMES.disabled.border,
      'shape=sharp': '0',
    },
  },
});

export const Alert = forwardRef(function Alert(
  props: CubeAlertProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { styles, mods, filteredProps } = useAlert(props);

  return (
    <AlertElement {...filteredProps} ref={ref} mods={mods} styles={styles} />
  );
});
