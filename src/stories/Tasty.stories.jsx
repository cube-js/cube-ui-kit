import {
  StyledButton as StyledButtonComponent,
  GlobalStyledHeading,
} from './components/StyledButton';

export default {
  title: 'Tasty API',
};

export const StyledButton = {
  render: () => <StyledButtonComponent>Styled Button</StyledButtonComponent>,
};

export const GloballyStyledButton = {
  render: () => (
    <>
      <GlobalStyledHeading />
      <div className="myButton">Styled Button</div>
    </>
  ),
};
