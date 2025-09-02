import { getByTestId, render } from '@testing-library/react';

import { Button } from '../components/actions';
import { Block } from '../components/Block';
import { Space } from '../components/layout/Space';

import { tastyDebug } from './debug';
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

  it('should handle arrays containing state maps', () => {
    // Test the new syntax: padding: ['1x', { '': '1x', large: '2x' }]
    const StyledBlock = tasty(Block, {
      styles: {
        // Simple array with state map at specific breakpoint
        padding: ['2x', { '': '1x', hovered: '3x' }],

        // Array with multiple state maps
        margin: [
          '1x',
          { '': '2x', pressed: '1x', disabled: '0' },
          { '': '0.5x', focused: '1x' },
        ],

        // Mixed responsive and state syntax
        fill: {
          '': ['#white', '#gray.05'],
          hovered: ['#blue.05', '#blue.10'],
        },
      },
    });

    const { container } = render(
      <BreakpointsProvider value={[1200, 768]}>
        <StyledBlock mods={{ hovered: true, pressed: false }} />
      </BreakpointsProvider>,
    );

    expect(container).toMatchTastySnapshot();
  });

  it('should handle state-map-of-arrays pattern', () => {
    // Test conversion from state-map-of-arrays to arrays-of-state-maps
    const StyledBlock = tasty(Block, {
      styles: {
        // State map where values are responsive arrays
        padding: {
          '': ['4x', '2x', '1x'],
          hovered: ['6x', '3x', '1.5x'],
          '[data-variant="compact"]': ['2x', '1x', '0.5x'],
        },

        // Border with responsive arrays in state map
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
        },
      },
    });

    const { container } = render(
      <BreakpointsProvider value={[1200, 768]}>
        <StyledBlock
          mods={{ hovered: false, focused: true, error: false }}
          data-variant="normal"
        />
      </BreakpointsProvider>,
    );

    expect(container).toMatchTastySnapshot();
  });

  it('should preserve null values in state-map-of-arrays conversion', () => {
    // Test that null values in arrays are preserved across all breakpoints
    // This is important for state logic - missing state !== falsy state
    const StyledBlock = tasty(Block, {
      styles: {
        // Test case: { '': ['1x', '2x'], large: [null, '3x'] }
        // Should convert to: [ { '': '1x', large: null }, { '': '2x', large: '3x' } ]
        padding: {
          '': ['4x', '2x'], // All breakpoints get values
          hovered: [null, '3x'], // First breakpoint gets null, second gets '3x'
          disabled: ['1x', null], // First breakpoint gets '1x', second gets null
        },

        // Color to visualize the states are working
        fill: {
          '': '#white',
          hovered: '#blue',
          disabled: '#gray',
        },
      },
    });

    // Test with hovered=true (should use null for first breakpoint, '3x' for second)
    const { container: hoveredContainer } = render(
      <BreakpointsProvider value={[768]}>
        <StyledBlock mods={{ hovered: true, disabled: false }} />
      </BreakpointsProvider>,
    );

    expect(hoveredContainer).toMatchTastySnapshot();

    // Test with disabled=true (should use '1x' for first breakpoint, null for second)
    const { container: disabledContainer } = render(
      <BreakpointsProvider value={[768]}>
        <StyledBlock mods={{ hovered: false, disabled: true }} />
      </BreakpointsProvider>,
    );

    expect(disabledContainer).toMatchTastySnapshot();
  });

  it('should handle complex responsive styles with state binding', () => {
    const ComplexCard = tasty(Block, {
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

  it('should handle complex gridAreas with responsive arrays and state modifiers', () => {
    const Header = tasty({
      as: 'header',
      styles: {
        position: { '': 'static', sticky: 'sticky' },
        top: { sticky: '0' },
        fill: { '': 'transparent', sticky: '#white' },
        zIndex: { '': 'auto', sticky: 10 },
        shadow: { '': 'none', sticky: '0 0.5x 0.5x #white' },
        display: 'grid',
        padding: '1x 2x',
        height: 'min 6x',
        gridAreas: [
          {
            '': `
              "breadcrumbs breadcrumbs breadcrumbs breadcrumbs breadcrumbs breadcrumbs"
              "back        title       .           subtitle    spacer      extra"
              "back        title       .           subtitle    spacer      extra"
              "content     content     content     content     content     content"
              "footer      footer      footer      footer      footer      footer"`,

            'back-button-top': `
                "back        back        back        back        back        back"
                "breadcrumbs breadcrumbs breadcrumbs breadcrumbs breadcrumbs breadcrumbs"
                ".           title       .           subtitle    spacer      extra"
                ".           title       .           subtitle    spacer      extra"
                "content     content     content     content     content     content"
                "footer      footer      footer      footer      footer      footer"`,
          },
          {
            '': `
                "breadcrumbs breadcrumbs breadcrumbs breadcrumbs"
                "back        title       spacer      extra"
                "back        subtitle    subtitle    extra"
                "back        .           .           extra"
                "content     content     content     content"
                "footer      footer      footer      footer"`,

            'back-button-top': `
                "back        back        back        back"
                "breadcrumbs breadcrumbs breadcrumbs breadcrumbs"
                ".           title       spacer      extra"
                ".           subtitle    subtitle    extra"
                ".           .           .           extra"
                "content     content     content     content"
                "footer      footer      footer      footer"`,
          },
        ],
        gridColumns: [
          'max-content minmax(2x, auto) 2x minmax(0, auto) minmax(2x, 1fr) minmax(min-content, max-content)',
          'max-content minmax(2x, auto) minmax(2x, 1fr) minmax(min-content, max-content)',
        ],
        placeItems: 'center stretch',
        placeContent: 'stretch',
      },
    });

    // Test with default state
    const { container: defaultContainer } = render(
      <BreakpointsProvider value={[1200]}>
        <Header qa="default-grid" />
      </BreakpointsProvider>,
    );

    // Demonstrate debug utilities usage
    const headerElement = defaultContainer.querySelector(
      '[data-qa="default-grid"]',
    ) as Element;

    // Example: Get CSS for specific element
    const cssForElement = tastyDebug.inspectDOMElement(headerElement);
    expect(cssForElement).toContain('grid-template-areas');

    // Example: Get CSS for specific class
    const className = headerElement.className
      .split(' ')
      .find((cls) => /^t\d+$/.test(cls));
    if (className) {
      const cssForClass = tastyDebug.getCSSForClass(className);
      expect(cssForClass).toContain('display: grid');
    }

    expect(defaultContainer).toMatchTastySnapshot();
  });
});

describe('style order consistency', () => {
  // Helper function to extract class names from rendered components
  function getClassName(container: HTMLElement): string {
    const element = container.firstElementChild as HTMLElement;
    return (
      element?.className?.split(' ').find((cls) => /^t\d+$/.test(cls)) || ''
    );
  }

  it('should generate same class for two components made with tasty having same styles but different order', () => {
    const Component1 = tasty({
      styles: {
        padding: '2x',
        margin: '1x',
        fill: '#blue',
        color: '#white',
        radius: '1r',
      },
    });

    const Component2 = tasty({
      styles: {
        color: '#white',
        radius: '1r',
        fill: '#blue',
        margin: '1x',
        padding: '2x',
      },
    });

    const { container: container1 } = render(<Component1 />);
    const { container: container2 } = render(<Component2 />);

    const className1 = getClassName(container1);
    const className2 = getClassName(container2);

    expect(className1).toBe(className2);
    expect(className1).toBeTruthy(); // Ensure we actually got a class name
  });

  it('should generate same class for two components extending Space with tasty having same styles but different order', () => {
    const ExtendedSpace1 = tasty(Space, {
      styles: {
        padding: '3x',
        fill: '#purple',
        border: '1bw solid #dark',
        gap: '2x',
        radius: '2r',
      },
    });

    const ExtendedSpace2 = tasty(Space, {
      styles: {
        border: '1bw solid #dark',
        radius: '2r',
        gap: '2x',
        fill: '#purple',
        padding: '3x',
      },
    });

    const { container: container1 } = render(<ExtendedSpace1 />);
    const { container: container2 } = render(<ExtendedSpace2 />);

    const className1 = getClassName(container1);
    const className2 = getClassName(container2);

    expect(className1).toBe(className2);
    expect(className1).toBeTruthy();
  });

  it('should generate same class for two Space components with styles prop in different order', () => {
    const styles1 = {
      padding: '4x',
      margin: '2x',
      fill: '#green',
      border: '2bw solid #black',
      width: '200px',
    };

    const styles2 = {
      width: '200px',
      border: '2bw solid #black',
      fill: '#green',
      margin: '2x',
      padding: '4x',
    };

    const { container: container1 } = render(<Space styles={styles1} />);
    const { container: container2 } = render(<Space styles={styles2} />);

    const className1 = getClassName(container1);
    const className2 = getClassName(container2);

    expect(className1).toBe(className2);
    expect(className1).toBeTruthy();
  });

  it('should generate same class for two Space components with styles prop for sub-element Test in different order', () => {
    const styles1 = {
      display: 'block',
      Test: {
        color: '#red',
        padding: '1x',
        fill: '#yellow',
        margin: '0.5x',
        border: '1bw solid #gray',
      },
    };

    const styles2 = {
      display: 'block',
      Test: {
        border: '1bw solid #gray',
        margin: '0.5x',
        fill: '#yellow',
        padding: '1x',
        color: '#red',
      },
    };

    const { container: container1 } = render(<Space styles={styles1} />);
    const { container: container2 } = render(<Space styles={styles2} />);

    const className1 = getClassName(container1);
    const className2 = getClassName(container2);

    expect(className1).toBe(className2);
    expect(className1).toBeTruthy();
  });

  it('should generate same class for two Space components with different order of style props radius and padding', () => {
    const StyledSpace1 = tasty({
      as: 'div',
      styleProps: ['radius', 'padding', 'fill', 'margin'] as const,
    });

    const StyledSpace2 = tasty({
      as: 'div',
      styleProps: ['margin', 'fill', 'padding', 'radius'] as const,
    });

    const commonProps = {
      radius: '2r',
      padding: '3x',
      fill: '#orange',
      margin: '1x',
    };

    const { container: container1 } = render(<StyledSpace1 {...commonProps} />);
    const { container: container2 } = render(<StyledSpace2 {...commonProps} />);

    const className1 = getClassName(container1);
    const className2 = getClassName(container2);

    expect(className1).toBe(className2);
    expect(className1).toBeTruthy();
  });

  it('should generate same class for mixed components with same styles but different ordering', () => {
    const spaceStyles = {
      display: 'flex',
      gap: true,
      flow: {
        '': 'row',
        vertical: 'column',
      },
      placeItems: {
        '': 'center stretch',
        vertical: 'stretch',
      },
    };

    // Common styles in different orders
    const commonStyles1 = {
      padding: '2x',
      fill: '#cyan',
      border: '1bw solid #navy',
      radius: '1r',
      margin: '1x',
      color: '#dark',
    };

    const commonStyles2 = {
      color: '#dark',
      margin: '1x',
      radius: '1r',
      border: '1bw solid #navy',
      fill: '#cyan',
      padding: '2x',
    };

    // Sub-element styles in different orders
    const subElementStyles1 = {
      Content: {
        preset: 'h3',
        color: '#white',
        padding: '1x',
        fill: '#black',
      },
    };

    const subElementStyles2 = {
      Content: {
        fill: '#black',
        padding: '1x',
        color: '#white',
        preset: 'h3',
      },
    };

    // Test 1: tasty() with different style order
    const TastyComponent1 = tasty({
      styles: { ...spaceStyles, ...commonStyles1, ...subElementStyles1 },
    });

    const TastyComponent2 = tasty({
      styles: { ...spaceStyles, ...commonStyles2, ...subElementStyles2 },
    });

    const { container: tastyContainer1 } = render(<TastyComponent1 />);
    const { container: tastyContainer2 } = render(<TastyComponent2 />);

    expect(getClassName(tastyContainer1)).toBe(getClassName(tastyContainer2));

    // Test 2: Extended Space with different style order
    const ExtendedSpace1 = tasty(Space, {
      styles: { ...commonStyles1, ...subElementStyles1 },
    });

    const ExtendedSpace2 = tasty(Space, {
      styles: { ...commonStyles2, ...subElementStyles2 },
    });

    const { container: extendedContainer1 } = render(<ExtendedSpace1 />);
    const { container: extendedContainer2 } = render(<ExtendedSpace2 />);

    expect(getClassName(extendedContainer1)).toBe(
      getClassName(extendedContainer2),
    );

    // Test 3: Space with styles prop in different order
    const { container: spaceContainer1 } = render(
      <Space styles={{ ...commonStyles1, ...subElementStyles1 }} />,
    );
    const { container: spaceContainer2 } = render(
      <Space styles={{ ...commonStyles2, ...subElementStyles2 }} />,
    );

    expect(getClassName(spaceContainer1)).toBe(getClassName(spaceContainer2));

    // Test 4: All should have the same class (same styles, different ordering methods)
    const tastyClass = getClassName(tastyContainer1);
    const extendedClass = getClassName(extendedContainer1);
    const spaceClass = getClassName(spaceContainer1);

    expect(tastyClass).toBe(extendedClass);
    expect(extendedClass).toBe(spaceClass);
    expect(tastyClass).toBeTruthy();
  });
});
