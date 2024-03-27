import { StyledButton as StyledButtonComponent } from './components/StyledButton';

export default {
  title: 'Tasty API',
};

export const StyledButton = {
  render: () => <StyledButtonComponent>Styled Button</StyledButtonComponent>,
};

export const GloballyStyledButton = {
  render: () => <div className="myButton">Styled Button</div>,
};
