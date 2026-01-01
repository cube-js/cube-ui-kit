import { Button } from '../../components/actions';
import { tasty, useGlobalStyles } from '../../tasty';

export const StyledButton = tasty(Button, {
  styles: {
    padding: '3x 6x',
    preset: 't1',
  },
});

export function GlobalStyledHeading() {
  useGlobalStyles('.myButton', {
    display: 'inline-block',
    padding: '1x 2x',
    preset: 't2',
    border: true,
    radius: true,
    fill: {
      '': '#white',
      ':hover': '#purple.20',
    },
    color: '#dark',
  });
  return null;
}

export function Block() {
  return (
    <>
      <StyledButton>123</StyledButton>
      <GlobalStyledHeading />
    </>
  );
}
