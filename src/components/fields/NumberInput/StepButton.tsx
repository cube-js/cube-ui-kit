import { CaretDownIcon, CaretUpIcon, DirectionIcon } from '../../../icons';
import { Styles, tasty } from '../../../tasty';
import { Button } from '../../actions';

const StepButtonElement = tasty(Button, {
  preventDefault: true,
  type: 'neutral',
  styles: {
    width: '2.5x',
    height: 'auto',
    radius: {
      '': '0 (1r - 1bw) 0 0',
      down: '0 0 (1r - 1bw) 0',
    },
    fontSize: '12px',
    lineHeight: '12px',
    fill: {
      '': '#dark.0',
      hovered: '#dark.04',
      pressed: '#purple.10',
      disabled: '#dark.0',
    },

    '$icon-size': '1fs',
  },
});

/**
 * Buttons for NumberField.
 */
export function StepButton(props) {
  return (
    <StepButtonElement
      preventDefault
      type="neutral"
      icon={<DirectionIcon to={props.direction} />}
      mods={{
        up: props.direction === 'up',
        down: props.direction === 'down',
      }}
      label={`Step ${props.direction}`}
      {...props}
    />
  );
}
