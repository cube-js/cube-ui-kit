import { getByTestId, render } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { expect } from '@storybook/jest';

import { Button } from '../components/actions';
import { Block } from '../components/Block';

import { tasty } from './tasty';
import { CONTAINER_STYLES } from './styles/list';

describe('tasty() API', () => {
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

  it('should allow multiple wrapping', () => {
    const Block = tasty({
      styles: {
        position: 'relative',
        padding: '1x top',
        border: true,
      },
      styleProps: CONTAINER_STYLES,
    });
    const SecondBlock = tasty(Block, {
      styles: {
        border: false,
      },
    });
    const ThirdBlock = tasty(SecondBlock, {
      styles: {
        position: 'static',
        padding: '2x top',
        color: '#white',
        border: '#black',
      },
    });

    const { container } = render(<ThirdBlock display="flex" />);

    expect(container).toMatchSnapshot();
  });

  it('should not loose border-radius', () => {
    const Component = tasty({
      qa: 'Component',
      styles: {
        fill: {
          '': '#purple-04',
          '[data-variant="waiting"]': '#purple-04.1',
          '[data-variant="processing"] & [data-theme="purple"]':
            '#purple-highlight',
          '[data-variant="processing"] & [data-theme="purple"] & hover':
            '#purple-highlight-hover',
          '[data-variant="processing"] & [data-theme="green"]':
            '#green-highlight',
          '[data-variant="processing"] & [data-theme="green"] & hover':
            '#green-highlight-hover',
          '[data-variant="processing"] & [data-theme="pink"]':
            '#pink-highlight',
          '[data-variant="processing"] & [data-theme="pink"] & hover':
            '#pink-highlight-hover',
          '[data-variant="processing"] & [data-theme="ocean"]':
            '#ocean-highlight',
          '[data-variant="processing"] & [data-theme="ocean"] & hover':
            '#ocean-highlight-hover',
        },

        border: {
          '': '1px left #purple.0',
          '[data-variant="waiting"] & [data-theme="purple"]':
            '1px left #purple-highlight-hover',
          '[data-variant="waiting"] & [data-theme="green"]':
            '1px left #green-highlight-hover',
          '[data-variant="waiting"] & [data-theme="pink]':
            '1px left #pink-highlight-hover',
          '[data-variant="waiting"] & [data-theme="ocean"]':
            '1px left #ocean-highlight-hover',
        },

        radius: {
          '': '0',
          '[data-variant="processing"]': '0.5x right',
        },
      },
    });

    const { container, getByTestId } = render(
      <Component data-theme="purple" data-variant="processing" />,
    );

    expect(container).toMatchSnapshot();
  });
});
