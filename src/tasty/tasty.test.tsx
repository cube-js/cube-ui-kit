import { cleanup, getByTestId, render } from '@testing-library/react';
import { act } from 'react';

import { Button } from '../components/actions';
import { Block } from '../components/Block';
import { Space } from '../components/layout/Space';

import { configure, resetConfig } from './config';
import { useGlobalStyles } from './hooks';
import { CONTAINER_STYLES } from './styles/list';
import { tasty } from './tasty';

describe('tasty() API', () => {
  it('should handle color fallback syntax', () => {
    const Element = tasty({
      styles: {
        color: '(#placeholder, #dark-04)',
      },
    });

    const { container } = render(<Element />);

    expect(container).toMatchTastySnapshot();
  });

  it('should handle fill fallback syntax', () => {
    const Element = tasty({
      styles: {
        fill: '(#surface, #white)',
      },
    });

    const { container } = render(<Element />);

    expect(container).toMatchTastySnapshot();
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
          'size=medium': '2x top',
          'size=large': '3x top',
        },
      },
    });
    const { container } = render(<StyledBlock />);

    expect(container).toMatchTastySnapshot();

    const StyledBlock2 = tasty(Block, {
      styles: {
        padding: {
          '': '1x top',
          'size=medium & selected': '2x top',
          'size=large': '3x top',
        },
      },
    });
    const { container: container2 } = render(<StyledBlock2 />);

    expect(container2).toMatchTastySnapshot();

    const StyledBlock3 = tasty(Block, {
      styles: {
        padding: {
          '': '1x top',
          'size=medium | selected': '2x top',
          'size=large & selected': '3x top',
        },
      },
    });
    const { container: container3 } = render(<StyledBlock3 />);

    expect(container3).toMatchTastySnapshot();
  });
});

describe('style order consistency', () => {
  // Helper function to extract all tasty class names from rendered components
  // With chunking, elements may have multiple class names (one per chunk)
  function getClassName(container: HTMLElement): string {
    const element = container.firstElementChild as HTMLElement;
    // Get all tasty class names and sort them for consistent comparison
    const classes = element?.className
      ?.split(' ')
      .filter((cls) => /^t\d+$/.test(cls))
      .sort()
      .join(' ');
    return classes || '';
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

describe('tokens prop', () => {
  it('should process $name tokens into CSS custom properties', () => {
    const Element = tasty({});

    const { container } = render(<Element tokens={{ $spacing: '2x' }} />);
    const element = container.firstElementChild as HTMLElement;

    expect(element.style.getPropertyValue('--spacing')).toBe(
      'calc(2 * var(--gap))',
    );
  });

  it('should process #name color tokens into CSS custom properties', () => {
    const Element = tasty({});

    const { container } = render(<Element tokens={{ '#accent': '#purple' }} />);
    const element = container.firstElementChild as HTMLElement;

    expect(element.style.getPropertyValue('--accent-color')).toBe(
      'var(--purple-color)',
    );
    expect(element.style.getPropertyValue('--accent-color-rgb')).toBe(
      'var(--purple-color-rgb)',
    );
  });

  it('should merge default tokens with instance tokens', () => {
    const Card = tasty({
      tokens: { $spacing: '1x', $size: '10x' },
    });

    const { container } = render(<Card tokens={{ $spacing: '4x' }} />);
    const element = container.firstElementChild as HTMLElement;

    // Instance token overrides default
    expect(element.style.getPropertyValue('--spacing')).toBe(
      'calc(4 * var(--gap))',
    );
    // Default token preserved
    expect(element.style.getPropertyValue('--size')).toBe(
      'calc(10 * var(--gap))',
    );
  });

  it('should merge tokens with style prop (style has priority)', () => {
    const Element = tasty({});

    const { container } = render(
      <Element
        tokens={{ $spacing: '2x' }}
        style={{ '--spacing': '100px' } as any}
      />,
    );
    const element = container.firstElementChild as HTMLElement;

    // style prop overrides tokens
    expect(element.style.getPropertyValue('--spacing')).toBe('100px');
  });

  it('should handle number values correctly', () => {
    const Element = tasty({});

    const { container } = render(
      <Element tokens={{ $zero: 0, $number: 42 }} />,
    );
    const element = container.firstElementChild as HTMLElement;

    // 0 should stay as "0"
    expect(element.style.getPropertyValue('--zero')).toBe('0');
    // Other numbers are converted to string
    expect(element.style.getPropertyValue('--number')).toBe('42');
  });

  it('should skip undefined and null token values', () => {
    const Element = tasty({});

    const { container } = render(
      <Element
        tokens={{ $defined: '2x', $undefined: undefined, $null: null } as any}
      />,
    );
    const element = container.firstElementChild as HTMLElement;

    expect(element.style.getPropertyValue('--defined')).toBe(
      'calc(2 * var(--gap))',
    );
    expect(element.style.getPropertyValue('--undefined')).toBe('');
    expect(element.style.getPropertyValue('--null')).toBe('');
  });

  it('should warn on object token values', () => {
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const Element = tasty({});

    render(
      <Element tokens={{ $invalid: { '': '1x', hovered: '2x' } } as any} />,
    );

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Object values are not allowed in tokens prop'),
    );

    consoleWarnSpy.mockRestore();
  });

  it('should work with variants', () => {
    const Card = tasty({
      tokens: { $spacing: '2x' },
      styles: { padding: '$spacing' },
      variants: {
        compact: { padding: '1x' },
        spacious: { padding: '4x' },
      },
    });

    const { container } = render(
      <Card variant="compact" tokens={{ $spacing: '3x' }} />,
    );
    const element = container.firstElementChild as HTMLElement;

    expect(element.style.getPropertyValue('--spacing')).toBe(
      'calc(3 * var(--gap))',
    );
  });

  it('should handle hex color values for RGB extraction', () => {
    const Element = tasty({});

    const { container } = render(<Element tokens={{ '#custom': '#ff8800' }} />);
    const element = container.firstElementChild as HTMLElement;

    // Should have color property
    expect(element.style.getPropertyValue('--custom-color')).toBeTruthy();
    // Should have RGB property
    expect(element.style.getPropertyValue('--custom-color-rgb')).toBeTruthy();
  });
});

describe('useGlobalStyles() hook', () => {
  beforeEach(() => {
    // Reset config for clean tests
    resetConfig();

    // Configure injector for test environment with text injection
    configure({
      forceTextInjection: true,
    });
  });

  afterEach(() => {
    cleanup();
    // Clean up any injected styles
    document.head.querySelectorAll('[data-tasty]').forEach((el) => el.remove());
    resetConfig();
  });

  it('should inject global styles for CSS selector', () => {
    function GlobalHeadingStyles() {
      useGlobalStyles('.test-heading', {
        preset: 'h2',
        color: '#purple',
        padding: '2x',
      });
      return null;
    }

    const { container } = render(
      <div>
        <GlobalHeadingStyles />
        <h1 className="test-heading">Test Heading</h1>
      </div>,
    );

    // Check that styles are injected into the document head
    const styleElements = document.head.querySelectorAll('[data-tasty]');
    expect(styleElements.length).toBeGreaterThan(0);

    // Check that the style content includes our selector
    const styleContent = Array.from(styleElements)
      .map((el) => el.textContent)
      .join('');
    expect(styleContent).toContain('.test-heading');
    expect(styleContent).toContain('color: var(--purple-color)');

    // Check that the heading element exists
    const headingElement = container.querySelector(
      '.test-heading',
    ) as HTMLElement;
    expect(headingElement).toBeTruthy();
  });

  it('should support complex selectors', () => {
    function GlobalButtonStyles() {
      useGlobalStyles('button[data-variant="primary"]', {
        fill: '#blue',
        color: '#white',
        border: 'none',
        radius: '1r',
        padding: '2x 4x',
      });
      return null;
    }

    const { container } = render(
      <div>
        <GlobalButtonStyles />
        <button data-variant="primary">Primary Button</button>
        <button data-variant="secondary">Secondary Button</button>
      </div>,
    );

    // Verify global styles are injected
    const styleElements = document.head.querySelectorAll('[data-tasty]');
    const styleContent = Array.from(styleElements)
      .map((el) => el.textContent)
      .join('');

    expect(styleContent).toContain('button[data-variant="primary"]');
    expect(styleContent).toContain('background-color: var(--blue-color)');
    expect(styleContent).toContain('color: var(--white-color)');
  });

  it('should support state-based global styles', () => {
    function GlobalInteractiveStyles() {
      useGlobalStyles('.interactive-element', {
        fill: {
          '': '#white',
          ':hover': '#gray.05',
          ':focus': '#blue.05',
          '[id]': '#gray.20',
        },
        color: {
          '': '#text',
          ':hover': '#text-hover',
          '[id]': '#text-disabled',
        },
        transition: 'fill 0.2s, color 0.2s',
      });
      return null;
    }

    const { container } = render(
      <div>
        <GlobalInteractiveStyles />
        <div className="interactive-element">Interactive Element</div>
        <div id="test-id" className="interactive-element">
          Element with ID
        </div>
      </div>,
    );

    // Verify state-based global styles are injected
    const styleElements = document.head.querySelectorAll('[data-tasty]');
    const styleContent = Array.from(styleElements)
      .map((el) => el.textContent)
      .join('');

    expect(styleContent).toContain('.interactive-element');
    expect(styleContent).toContain(':hover');
    expect(styleContent).toContain('[id]');
    expect(styleContent).toContain('background-color: var(--white-color)');
  });

  it('should cleanup styles when component unmounts', () => {
    function GlobalTemporaryStyles() {
      useGlobalStyles('.temporary-element', {
        fill: '#red',
        color: '#white',
        padding: '2x',
      });
      return null;
    }

    const TestComponent = ({ showGlobal }: { showGlobal: boolean }) => (
      <div>
        {showGlobal && <GlobalTemporaryStyles />}
        <div className="temporary-element">Temporary Element</div>
      </div>
    );

    const { container, rerender } = render(<TestComponent showGlobal={true} />);

    // Verify styles are injected when component is mounted
    let styleElements = document.head.querySelectorAll('[data-tasty]');
    let styleContent = Array.from(styleElements)
      .map((el) => el.textContent)
      .join('');
    expect(styleContent).toContain('.temporary-element');

    const initialStyleCount = styleElements.length;

    // Remove the global style component
    rerender(<TestComponent showGlobal={false} />);

    // Verify styles are cleaned up
    styleElements = document.head.querySelectorAll('[data-tasty]');
    styleContent = Array.from(styleElements)
      .map((el) => el.textContent)
      .join('');

    // Either the style element is removed or the content no longer contains our selector
    const finalStyleCount = styleElements.length;
    expect(finalStyleCount).toBeLessThanOrEqual(initialStyleCount);

    // The element should still exist but without the global styles
    expect(container.querySelector('.temporary-element')).toBeTruthy();
  });

  it('should handle empty styles', () => {
    function EmptyGlobalStyles() {
      useGlobalStyles('.empty-styles', undefined);
      return null;
    }

    const { container } = render(
      <div>
        <EmptyGlobalStyles />
        <div className="empty-styles">Element with no styles</div>
      </div>,
    );

    // Empty styles should not inject anything
    const styleElements = document.head.querySelectorAll('[data-tasty]');
    const styleContent = Array.from(styleElements)
      .map((el) => el.textContent)
      .join('');

    // Should not contain our selector since there are no styles
    expect(styleContent).not.toContain('.empty-styles');

    // Element should still exist
    expect(container.querySelector('.empty-styles')).toBeTruthy();
  });

  it('should support sub-element styling in global styles', () => {
    function GlobalCardStyles() {
      useGlobalStyles('.global-card', {
        padding: '4x',
        fill: '#surface',
        border: '1bw solid #border',
        radius: '1r',

        // Sub-element styles
        Title: {
          preset: 'h3',
          color: '#primary',
          margin: '0 0 2x 0',
        },
        Content: {
          color: '#text',
          padding: '2x 0',
        },
        Footer: {
          display: 'flex',
          justify: 'space-between',
          padding: '2x 0 0 0',
          border: '1bw solid #border top',
        },
      });
      return null;
    }

    const { container } = render(
      <div>
        <GlobalCardStyles />
        <div className="global-card">
          <div data-element="Title">Card Title</div>
          <div data-element="Content">Card content here</div>
          <div data-element="Footer">
            <span>Footer left</span>
            <span>Footer right</span>
          </div>
        </div>
      </div>,
    );

    // Verify sub-element global styles are injected
    const styleElements = document.head.querySelectorAll('[data-tasty]');
    const styleContent = Array.from(styleElements)
      .map((el) => el.textContent)
      .join('');

    expect(styleContent).toContain('.global-card');
    expect(styleContent).toContain('[data-element="Title"]');
    expect(styleContent).toContain('[data-element="Content"]');
    expect(styleContent).toContain('[data-element="Footer"]');
    expect(styleContent).toContain('background-color: var(--surface-color)');
  });

  it('should support direct child selector for sub-elements with $: ">"', () => {
    const Card = tasty({
      styles: {
        padding: '2x',
        Actions: {
          $: '>',
          display: 'flex',
          gap: '1x',
        },
        Content: {
          color: '#text',
        },
      },
    });

    const { container } = render(
      <Card>
        <div data-element="Actions">
          <button>Action 1</button>
        </div>
        <div data-element="Content">Content text</div>
      </Card>,
    );

    // Verify direct child selector is used for Actions
    const styleElements = document.head.querySelectorAll('[data-tasty]');
    const styleContent = Array.from(styleElements)
      .map((el) => el.textContent)
      .join('');

    // Should have direct child selector for Actions
    expect(styleContent).toMatch(/>\s*\[data-element="Actions"\]/);
    // Should have descendant selector for Content (backward compatibility)
    expect(styleContent).toMatch(/\s+\[data-element="Content"\]/);
    // Should not match "> [data-element="Content"]"
    expect(styleContent).not.toMatch(/>\s*\[data-element="Content"\]/);
  });

  it('should support empty affix for sub-elements with $: ""', () => {
    const Card = tasty({
      styles: {
        padding: '2x',
        Content: {
          $: '',
          color: '#primary',
        },
      },
    });

    render(
      <Card>
        <div data-element="Content">Content text</div>
      </Card>,
    );

    const styleElements = document.head.querySelectorAll('[data-tasty]');
    const styleContent = Array.from(styleElements)
      .map((el) => el.textContent)
      .join('');

    // Empty affix should result in descendant selector (space only)
    expect(styleContent).toMatch(/\s+\[data-element="Content"\]/);
    expect(styleContent).not.toMatch(/>\s*\[data-element="Content"\]/);
  });

  it('should support complex selector chain with $: "> Body > Row >"', () => {
    const Table = tasty({
      styles: {
        display: 'table',
        Cell: {
          $: '> Body > Row >',
          padding: '1x',
          border: '1px solid #border',
        },
      },
    });

    render(
      <Table>
        <div data-element="Body">
          <div data-element="Row">
            <div data-element="Cell">Cell content</div>
          </div>
        </div>
      </Table>,
    );

    const styleElements = document.head.querySelectorAll('[data-tasty]');
    const styleContent = Array.from(styleElements)
      .map((el) => el.textContent)
      .join('');

    // Should transform to: > [data-element="Body"] > [data-element="Row"] > [data-element="Cell"]
    expect(styleContent).toMatch(
      />\s*\[data-element="Body"\]\s*>\s*\[data-element="Row"\]\s*>\s*\[data-element="Cell"\]/,
    );
  });

  it('should warn when combinator lacks spaces in selector affix ($)', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const Component = tasty({
      styles: {
        Item: {
          $: '>Body>Row',
          color: '#primary',
        },
      },
    });

    render(<Component />);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Tasty] Invalid selector affix ($) syntax'),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('>Body>Row'),
    );

    consoleErrorSpy.mockRestore();
  });

  it('should not warn when combinator has proper spaces in selector affix ($)', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const Component = tasty({
      styles: {
        Item: {
          $: '> Body > Row',
          color: '#primary',
        },
      },
    });

    render(<Component />);

    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should support multiple useGlobalStyles calls with different selectors', () => {
    function GlobalHeadingStyles() {
      useGlobalStyles('h1.special', {
        preset: 'h1',
        color: '#primary',
        margin: '0 0 2x 0',
      });
      return null;
    }

    function GlobalParagraphStyles() {
      useGlobalStyles('p.special', {
        preset: 'p1',
        color: '#text',
        margin: '1x 0',
      });
      return null;
    }

    function GlobalLinkStyles() {
      useGlobalStyles('a.special', {
        color: '#link',
        textDecoration: 'underline',
        transition: 'color 0.2s',
        ':hover': {
          color: '#link-hover',
        },
      });
      return null;
    }

    const { container } = render(
      <div>
        <GlobalHeadingStyles />
        <GlobalParagraphStyles />
        <GlobalLinkStyles />
        <h1 className="special">Special Heading</h1>
        <p className="special">Special paragraph text.</p>
        <a href="#" className="special">
          Special Link
        </a>
      </div>,
    );

    // Verify multiple global styles are injected
    const styleElements = document.head.querySelectorAll('[data-tasty]');
    const styleContent = Array.from(styleElements)
      .map((el) => el.textContent)
      .join('');

    expect(styleContent).toContain('h1.special');
    expect(styleContent).toContain('p.special');
    expect(styleContent).toContain('a.special');
    expect(styleContent).toContain('color: var(--primary-color)');
    expect(styleContent).toContain('color: var(--text-color)');
    expect(styleContent).toContain('color: var(--link-color)');
  });

  it('should support pseudo-classes and pseudo-elements', () => {
    function GlobalWithPseudoStyles() {
      useGlobalStyles('.pseudo-test', {
        color: '#dark',
        ':hover': {
          color: '#purple',
        },
        ':focus': {
          color: '#blue',
          outline: '2px solid #blue',
        },
        '::before': {
          content: '"→ "',
          color: '#gray',
        },
      });
      return null;
    }

    const { container } = render(
      <div>
        <GlobalWithPseudoStyles />
        <div className="pseudo-test" tabIndex={0}>
          Element with pseudo styles
        </div>
      </div>,
    );

    // Verify pseudo-class and pseudo-element styles are injected
    const styleElements = document.head.querySelectorAll('[data-tasty]');
    const styleContent = Array.from(styleElements)
      .map((el) => el.textContent)
      .join('');

    expect(styleContent).toContain('.pseudo-test');
    expect(styleContent).toContain(':hover');
    expect(styleContent).toContain(':focus');
    expect(styleContent).toContain('::before');
    expect(styleContent).toContain('color: var(--dark-color)');
  });

  it('should support attribute selectors', () => {
    function GlobalAttributeSelectorStyles() {
      useGlobalStyles('[data-testid="global-attr"]', {
        fill: '#yellow',
        color: '#dark',
        padding: '2x',
        border: '1bw solid #orange',
      });
      return null;
    }

    const { container } = render(
      <div>
        <GlobalAttributeSelectorStyles />
        <div data-testid="global-attr">Element with attribute selector</div>
        <div data-testid="other-attr">Other element</div>
      </div>,
    );

    // Verify attribute selector styles are injected
    const styleElements = document.head.querySelectorAll('[data-tasty]');
    const styleContent = Array.from(styleElements)
      .map((el) => el.textContent)
      .join('');

    expect(styleContent).toContain('[data-testid="global-attr"]');
    expect(styleContent).toContain('background-color: var(--yellow-color)');
    expect(styleContent).toContain('color: var(--dark-color)');
  });

  it('should support complex selectors with combinators', () => {
    function GlobalComplexStyles() {
      useGlobalStyles('.parent > .child', {
        fill: '#green',
        padding: '1x',
        margin: '0.5x',
      });
      return null;
    }

    function GlobalDescendantStyles() {
      useGlobalStyles('.container .nested', {
        color: '#blue',
        fontWeight: 'bold',
      });
      return null;
    }

    const { container } = render(
      <div>
        <GlobalComplexStyles />
        <GlobalDescendantStyles />
        <div className="parent">
          <div className="child">Direct child</div>
          <div>
            <div className="child">Nested child (not direct)</div>
          </div>
        </div>
        <div className="container">
          <div className="nested">Descendant element</div>
          <div>
            <div className="nested">Deeply nested element</div>
          </div>
        </div>
      </div>,
    );

    // Verify complex selector styles are injected
    const styleElements = document.head.querySelectorAll('[data-tasty]');
    const styleContent = Array.from(styleElements)
      .map((el) => el.textContent)
      .join('');

    expect(styleContent).toContain('.parent > .child');
    expect(styleContent).toContain('.container .nested');
    expect(styleContent).toContain('background-color: var(--green-color)');
    expect(styleContent).toContain('color: var(--blue-color)');
  });

  it('should handle style updates when styles change', () => {
    function DynamicGlobalStyles1() {
      useGlobalStyles('.dynamic-selector', {
        fill: '#blue',
        color: '#white',
        padding: '2x',
      });
      return null;
    }

    function DynamicGlobalStyles2() {
      useGlobalStyles('.dynamic-selector', {
        fill: '#red',
        color: '#white',
        padding: '4x',
        border: '1bw solid #dark',
      });
      return null;
    }

    const { container, rerender } = render(
      <div>
        <DynamicGlobalStyles1 />
        <div className="dynamic-selector">Dynamic content</div>
      </div>,
    );

    // Verify initial styles
    let styleElements = document.head.querySelectorAll('[data-tasty]');
    let styleContent = Array.from(styleElements)
      .map((el) => el.textContent)
      .join('');
    expect(styleContent).toContain('.dynamic-selector');
    expect(styleContent).toContain('background-color: var(--blue-color)');

    // Update to different global component with different styles
    act(() => {
      rerender(
        <div>
          <DynamicGlobalStyles2 />
          <div className="dynamic-selector">Dynamic content</div>
        </div>,
      );
    });

    // Verify updated styles
    styleElements = document.head.querySelectorAll('[data-tasty]');
    styleContent = Array.from(styleElements)
      .map((el) => el.textContent)
      .join('');
    expect(styleContent).toContain('background-color: var(--red-color)');
    expect(styleContent).toContain(
      'border: var(--border-width) solid var(--dark-color)',
    );
  });
});
