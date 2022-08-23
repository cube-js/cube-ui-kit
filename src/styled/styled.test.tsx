import { getByTestId, render } from '@testing-library/react';

import { Button } from '../components/actions';
import { Block } from '../components/Block';

import { styled } from './styled';

describe('styled() API', () => {
  beforeAll(() => {
    jest.spyOn(console, 'group').mockImplementation(() => {});
  });

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

    const { getByTestId, rerender } = render(<SButton qa="button" />);
    expect(getByTestId('button').dataset.type).toBe('primary');

    rerender(<SButton type="secondary" qa="button" />);
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
      <StyledBlock styles={{ color: '#black.1' }} />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should pass qa prop', () => {
    const StyledBlock = styled({ props: { qa: 'Field' } });
    const { container } = render(<StyledBlock />);

    expect(getByTestId(container, 'Field', {})).toBeDefined();
  });
});
