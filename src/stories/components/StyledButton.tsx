import { styled } from '../../styled';
import { Button } from '../../components/actions';

export const StyledButton = styled(Button, {
  styles: {
    padding: '3x 6x',
    preset: 't1',
  },
});

export const GlobalStyledHeading = styled('div.myButton', {
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

export function Block() {
  return (
    <>
      <StyledButton>123</StyledButton>
      <GlobalStyledHeading />
    </>
  );
}
