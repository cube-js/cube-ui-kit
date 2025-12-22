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
    padding: 0,

    '$icon-size': '1fs',

    Icon: {
      width: 'auto',
      height: 'auto',
    },
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
      mods={{
        up: props.direction === 'up',
        down: props.direction === 'down',
      }}
      label={`Step ${props.direction}`}
      {...props}
    >
      <DirectionIcon to={props.direction} />
    </StepButtonElement>
  );
}
