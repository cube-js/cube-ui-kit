import { tasty } from '../tasty';

export const HiddenInput = tasty({
  as: 'input',
  styles: {
    display: 'block',
    fontFamily: 'inherit',
    fontSize: '100%',
    lineHeight: '1.15',
    margin: '0',
    overflow: 'visible',
    boxSizing: 'border-box',
    padding: '0',
    position: 'absolute',
    inset: '0',
    opacity: '0.0001',
    zIndex: '1',
    width: '100%',
    height: '100%',
    cursor: {
      '': 'default',
      button: 'pointer',
      disabled: 'not-allowed',
    },
  },
});
