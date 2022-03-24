import { render } from '@testing-library/react';
import { styled } from './styled';
import { Button } from '../components/actions/Button/Button';
import { Block } from '../components/Block';

describe('styled() API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should warn about deprecated API', () => {
    const spiedWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'group').mockImplementation(() => {});

    styled({ props: { test: 123 } });

    expect(spiedWarn).toBeCalledTimes(1);
    expect(spiedWarn.mock.calls).toMatchSnapshot();
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

  it('should render raw', () => {
    const Smth = styled({});

    const { container } = render(<Smth />);

    expect(container).toMatchSnapshot();
  });
});
