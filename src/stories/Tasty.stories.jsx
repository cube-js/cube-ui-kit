import {
  GlobalStyledHeading,
  StyledButton as StyledButtonComponent,
} from './components/StyledButton';

export default {
  title: 'Styling/Global Styles',
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
