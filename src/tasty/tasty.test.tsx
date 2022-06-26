import { getByTestId, render } from '@testing-library/react';
import { tasty } from './tasty';
import { Button } from '../components/actions';
import { Block } from '../components/Block';
import { CONTAINER_STYLES } from './styles/list';
import { Card } from '../components/content/Card/Card';

describe('tasty() API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should provide defaults and give ability to override', () => {
    const SButton = tasty(Button, { type: 'primary' });

    const { getByTestId, rerender } = render(
      <SButton qa="button" label="Button" />,
    );
    expect(getByTestId('button').dataset.type).toBe('primary');

    rerender(<SButton type="secondary" qa="button" label="Button" />);
    expect(getByTestId('button').dataset.type).toBe('secondary');
  });

  it('should pass styles from tasty', () => {
    const StyledBlock = tasty(Block, { styles: { color: '#clear.1' } });
    const { container } = render(<StyledBlock />);

    expect(container).toMatchSnapshot();
  });

  it('should merge styles', () => {
    const Block = tasty({
      styles: {
        color: { '': '#dark', modified: '#purple' },
        fill: '#white',
      },
    });
    const StyledBlock = tasty(Block, {
      styles: { fill: '#black' },
    });
    const { container } = render(<StyledBlock />);

    expect(container).toMatchSnapshot();
  });

  it('should merge styles in custom prop', () => {
    const Block = tasty({
      inputStyles: {
        color: { '': '#dark', modified: '#purple' },
        fill: '#white',
      },
    });
    const StyledBlock = tasty(Block, {
      inputStyles: { fill: '#black' },
    });
    const { container } = render(<StyledBlock />);

    expect(container).toMatchSnapshot();
  });

  it('should be able to override styles', () => {
    const StyledBlock = tasty(Block, { styles: { color: '#clear.1' } });
    const { container } = render(
      <StyledBlock styles={{ color: '#black.1' }} />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should pass qa prop', () => {
    const StyledBlock = tasty({ qa: 'Field' });
    const { container } = render(<StyledBlock />);

    expect(getByTestId(container, 'Field', {})).toBeDefined();
  });

  it('should create responsive styles', () => {
    const StyledBlock = tasty(Block, { styles: { display: ['grid', 'flex'] } });
    const { container } = render(<StyledBlock />);

    expect(container).toMatchSnapshot();
  });

  it('should create element styles', () => {
    const Block = tasty({
      styles: { Element: { color: { '': '#dark', modified: '#purple' } } },
    });
    const { container } = render(<Block />);

    expect(container).toMatchSnapshot();
  });

  it('should merge element styles', () => {
    const Block = tasty({
      styles: {
        Element: {
          color: { '': '#dark', modified: '#purple' },
          fill: '#white',
        },
      },
    });
    const StyledBlock = tasty(Block, {
      styles: { Element: { fill: '#black' } },
    });
    const { container } = render(<StyledBlock />);

    expect(container).toMatchSnapshot();
  });

  it('should define style props', () => {
    const Block = tasty({
      styles: {
        border: '2bw',
      },
      styleProps: CONTAINER_STYLES,
    });

    const { container } = render(<Block border={true} />);

    expect(container).toMatchSnapshot();
  });
});
