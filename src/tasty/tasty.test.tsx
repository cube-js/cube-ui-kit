import { getByTestId, render } from '@testing-library/react';

import { Button } from '../components/actions';
import { Block } from '../components/Block';

import { BreakpointsProvider } from './providers/BreakpointsProvider';
import { CONTAINER_STYLES } from './styles/list';
import { tasty } from './tasty';

import { configure } from './index';

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

    expect(container).toMatchTastySnapshot();
  });

  it('should support modifiers', () => {
    const StyledBlock = tasty(Block, {
      styles: { color: { '': '#dark', modified: '#purple' } },
    });
    const { container } = render(<StyledBlock mods={{ modified: true }} />);

    expect(container).toMatchTastySnapshot();
  });

  it('should support kebab-case modifiers', () => {
    const StyledBlock = tasty(Block, {
      styles: { color: { '': '#dark', 'somehow-modified': '#purple' } },
    });
    const { container } = render(
      <StyledBlock mods={{ 'somehow-modified': true }} />,
    );

    expect(container).toMatchTastySnapshot();
  });

  it('should support camelCase modifiers', () => {
    const StyledBlock = tasty(Block, {
      styles: { color: { '': '#dark', somehowModified: '#purple' } },
    });
    const { container } = render(
      <StyledBlock mods={{ somehowModified: true }} />,
    );

    expect(container).toMatchTastySnapshot();
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

    expect(container).toMatchTastySnapshot();
  });

  it('should merge styles in custom prop', () => {
    const Block = tasty({});

    function BlockWithInput(props) {
      return <Block styles={props.inputStyles} />;
    }

    const StyledOnceBlock = tasty(BlockWithInput, {
      inputStyles: {
        color: { '': '#dark', modified: '#purple' },
        fill: '#white',
      },
    });

    const StyledTwiceBlock = tasty(StyledOnceBlock, {
      inputStyles: { fill: '#black' },
    });
    const { container } = render(<StyledTwiceBlock />);

    expect(container).toMatchTastySnapshot();
  });

  it('should be able to override styles', () => {
    const StyledBlock = tasty(Block, { styles: { color: '#clear.1' } });
    const { container } = render(
      <StyledBlock styles={{ color: '#black.1' }} />,
    );

    expect(container).toMatchTastySnapshot();
  });

  it('should support variants', () => {
    const StyledBlock = tasty({
      styles: { color: '#clear' },
      variants: {
        custom: {
          color: '#black',
        },
      },
    });
    const { container } = render(<StyledBlock variant="custom" />);

    expect(container).toMatchTastySnapshot();
  });

  it('should fallback to default variant', () => {
    const StyledBlock = tasty({
      styles: { color: '#clear' },
      variants: {
        default: {
          color: '#white',
        },
        custom: {
          color: '#black',
        },
      },
    });
    const { container } = render(<StyledBlock />);

    expect(container).toMatchTastySnapshot();
  });

  it('should pass qa prop', () => {
    const StyledBlock = tasty({ qa: 'Field' });
    const { container } = render(<StyledBlock />);

    expect(getByTestId(container, 'Field', {})).toBeDefined();
  });

  it('should create responsive styles', () => {
    const StyledBlock = tasty(Block, { styles: { display: ['grid', 'flex'] } });
    const { container } = render(<StyledBlock />);

    expect(container).toMatchTastySnapshot();
  });

  it('should create element styles', () => {
    const Block = tasty({
      styles: { Element: { color: { '': '#dark', modified: '#purple' } } },
    });
    const { container } = render(<Block />);

    expect(container).toMatchTastySnapshot();
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

    expect(container).toMatchTastySnapshot();
  });

  it('should define style props', () => {
    const Block = tasty({
      styles: {
        border: '2bw',
      },
      styleProps: CONTAINER_STYLES,
    });

    const { container } = render(<Block border={true} />);

    expect(container).toMatchTastySnapshot();
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

    expect(container).toMatchTastySnapshot();
  });

  it('should allow nested modifiers', () => {
    const StyledBlock = tasty(Block, {
      styles: { color: { '': '#clear', ':not(:first-child)': '#black' } },
    });
    const { container } = render(<StyledBlock />);

    expect(container).toMatchTastySnapshot();
  });

  it('should optimize attribute selectors', () => {
    const StyledBlock = tasty(Block, {
      styles: {
        padding: {
          '': '1x top',
          '[data-size="medium"]': '2x top',
          '[data-size="large"]': '3x top',
        },
      },
    });
    const { container } = render(<StyledBlock />);

    expect(container).toMatchTastySnapshot();

    const StyledBlock2 = tasty(Block, {
      styles: {
        padding: {
          '': '1x top',
          '[data-size="medium"] & selected': '2x top',
          '[data-size="large"]': '3x top',
        },
      },
    });
    const { container: container2 } = render(<StyledBlock2 />);

    expect(container2).toMatchTastySnapshot();

    const StyledBlock3 = tasty(Block, {
      styles: {
        padding: {
          '': '1x top',
          '[data-size="medium"] | selected': '2x top',
          '[data-size="large"] & selected': '3x top',
        },
      },
    });
    const { container: container3 } = render(<StyledBlock3 />);

    expect(container3).toMatchTastySnapshot();
  });

  it('should handle complex responsive styles with state binding', () => {
    const ComplexCard = tasty({
      styles: {
        // Responsive layout that changes between flex and grid
        display: ['grid', 'flex', 'block'],

        // Responsive gap with different values per breakpoint
        gap: ['3x', '2x', '1x'],

        // Complex responsive padding with state modifiers
        padding: {
          '': ['4x', '3x', '2x'],
          hovered: ['5x', '4x', '3x'],
          'pressed & !disabled': ['3x', '2x', '1x'],
          '[data-variant="compact"]': ['2x', '1x', '0.5x'],
        },

        // Responsive width with complex logic
        width: {
          '': ['max 1200px', 'max 800px', 'max 100%'],
          'expanded | [data-size="large"]': [
            'max 1400px',
            'max 1000px',
            'max 100%',
          ],
          '(hovered | focused) & !disabled': [
            'max 1300px',
            'max 900px',
            'max 100%',
          ],
        },

        // Color changes based on state with fallback
        fill: {
          '': '#surface',
          hovered: '#surface-hover',
          pressed: '#surface-pressed',
          '[disabled]': '#surface-disabled',
          '[data-variant="danger"] & hovered': '#danger-hover',
          '[data-variant="success"] & !disabled': '#success',
        },

        // Responsive border with state combinations
        border: {
          '': ['2bw solid #border', '1bw solid #border', 'none'],
          focused: [
            '3bw solid #primary',
            '2bw solid #primary',
            '1bw solid #primary',
          ],
          'error & focused': [
            '3bw solid #danger',
            '2bw solid #danger',
            '1bw solid #danger',
          ],
          '![data-variant="borderless"] & hovered': [
            '2bw solid #border-hover',
            '1bw solid #border-hover',
            '1bw solid #border-hover',
          ],
        },

        // Responsive radius
        radius: ['2r', '1r', '0.5r'],

        // Sub-element styling with responsive behavior
        Header: {
          preset: ['h2', 'h3', 'h4'],
          color: {
            '': '#text-primary',
            '[data-variant="danger"]': '#danger',
            hovered: '#text-primary-hover',
          },
          margin: ['0 0 2x 0', '0 0 1x 0', '0 0 0.5x 0'],
        },

        Content: {
          padding: ['2x', '1x', '0.5x'],
          color: {
            '': '#text',
            '[disabled]': '#text-disabled',
            'highlighted & !disabled': '#text-highlighted',
          },
        },

        Footer: {
          display: {
            '': ['flex', 'flex', 'none'],
            expanded: ['flex', 'flex', 'flex'],
          },
          gap: ['2x', '1x', '0.5x'],
          padding: {
            '': ['2x top', '1x top', '0.5x top'],
            compact: ['1x top', '0.5x top', '0'],
          },
        },
      },
    });

    // Test with various state combinations - wrap with custom breakpoints for 3-value arrays
    const { container } = render(
      <BreakpointsProvider value={[1200, 768]}>
        <ComplexCard
          mods={{
            hovered: true,
            expanded: false,
            highlighted: true,
          }}
          data-variant="success"
          data-size="large"
        >
          <div data-element="Header">Complex Header</div>
          <div data-element="Content">Dynamic content</div>
          <div data-element="Footer">Footer content</div>
        </ComplexCard>
      </BreakpointsProvider>,
    );

    expect(container).toMatchTastySnapshot();
  });
});
