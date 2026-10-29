import { tasty } from '@tenphi/tasty';

import { DirectionIcon } from '../../../icons/DirectionIcon';
import { Button } from '../../actions/Button/Button';

const StepButtonElement = tasty(Button, {
  type: 'clear',
  styles: {
    width: '($local-size * 1.25)',
    height: 'auto',
    radius: {
      '': '0 (1r - 1bw) 0 0',
      down: '0 0 (1r - 1bw) 0',
      // A plain field box is square.
      plain: 0,
    },
    padding: 0,

    $size: 'inherit',
    '$local-size': '(($size - 2bw) / 2)',

    Icon: {
      width: 'auto',
      height: 'auto',
    },
  },
});

/**
 * Buttons for NumberField. Their names come from `useNumberField`, which
 * `NumberInput` gives the translated labels.
 */
export function StepButton({ isPlain, ...props }) {
  return (
    <StepButtonElement
      type="clear"
      mods={{
        up: props.direction === 'up',
        down: props.direction === 'down',
        plain: !!isPlain,
      }}
      // Stepping is an edit, not a choice: a press must not close a popover
      // the field sits in.
      data-popover-keep-on-press
      {...props}
    >
      <DirectionIcon
        to={props.direction}
        styles={{ fontSize: '$local-size' }}
      />
    </StepButtonElement>
  );
}
