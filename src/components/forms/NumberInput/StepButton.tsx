import { Button } from '../../actions';
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import { Styles } from '../../../tasty';

const STEP_BUTTON_STYLES: Styles = {
  padding: '0 .5x',
  radius: {
    '': '0 (1r - 1bw) 0 0',
    down: '0 0 (1r - 1bw) 0',
  },
  preset: 't4',
  lineHeight: '1em',
  height: 'auto',
};

/**
 * Buttons for NumberField.
 */
export function StepButton(props) {
  return (
    <Button
      type="neutral"
      styles={STEP_BUTTON_STYLES}
      preventDefault
      icon={
        props.direction === 'up' ? <CaretUpOutlined /> : <CaretDownOutlined />
      }
      mods={{
        up: props.direction === 'up',
        down: props.direction === 'down',
      }}
      label={`Step ${props.direction}`}
      {...props}
    />
  );
}
