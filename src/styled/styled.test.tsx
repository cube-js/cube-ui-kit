import { render } from '@testing-library/react';
import { styled } from './styled';
import { Button } from '../components/actions';
import { Block } from '../components/Block';

describe('styled() API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should warn about deprecated API', () => {
    const spiedConsole = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    styled(Button, { props: { type: 'primary' } });

    expect(spiedConsole).toBeCalledTimes(1);
    expect(spiedConsole.mock.calls).toMatchSnapshot();
  });

  it('should provide defaults and give ability to override', () => {
    const SButton = styled(Button, { type: 'primary' });

    const { getByTestId, rerender } = render(<SButton data-testid="button" />);
    expect(getByTestId('button').dataset.type).toBe('primary');

    rerender(<SButton type="secondary" data-testid="button" />);
    expect(getByTestId('button').dataset.type).toBe('secondary');
  });

  it('should pass styles from styled', () => {
    const StyledBlock = styled(Block, { styles: { color: '#clear.1' } });
    const { container } = render(<StyledBlock />);

    expect(container).toMatchSnapshot();
  });

  it('should be able to override styles', () => {
    const StyledBlock = styled(Block, { styles: { color: '#clear.1' } });
    const { container } = render(
      <StyledBlock styles={{ color: '#black.1000' }} />,
    );

    expect(container).toMatchSnapshot();
  });
});
