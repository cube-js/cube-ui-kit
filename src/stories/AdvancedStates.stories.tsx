import { useState } from 'react';

import {
  Block,
  Button,
  Flex,
  Layout,
  setGlobalPredefinedStates,
  tasty,
  Text,
} from '../index';

import type { Meta, StoryObj } from '@storybook/react-vite';

// Set up global predefined states for the stories
setGlobalPredefinedStates({
  '@mobile': '@media(w < 768px)',
  '@tablet': '@media(768px <= w < 1024px)',
  '@desktop': '@media(w >= 1024px)',
  '@dark': '@media(prefers-color-scheme: dark)',
  '@light': '@media(prefers-color-scheme: light)',
  '@print': '@media:print',
});

const meta: Meta = {
  title: 'Styling/Advanced States',
  parameters: {
    docs: {
      description: {
        component: `
Advanced state mappings allow you to define styles based on complex conditions:

- **@media queries**: Responsive styles based on viewport dimensions
- **@container queries**: Styles based on container element dimensions
- **@supports queries**: Styles based on browser feature/selector support
- **@root states**: Styles based on root element attributes (themes, modes)
- **@own states**: Styles based on the element's own state (for sub-elements)
- **@starting-style**: Initial styles for CSS transitions
- **Predefined states**: Reusable state aliases (local and global)
- **Boolean operators**: Combine states with \`&\` (AND), \`|\` (OR), \`!\` (NOT)
        `,
      },
    },
  },
};

export default meta;

// =============================================================================
// Media Query Examples
// =============================================================================

const ResponsiveBox = tasty({
  styles: {
    padding: {
      '': '4x',
      '@media(w < 768px)': '2x',
      '@media(w < 480px)': '1x',
    },
    fill: '#purple',
    color: '#white',
    radius: '2r',
  },
});

export const MediaQueries: StoryObj = {
  render: () => (
    <Flex flow="column" gap="2x">
      <Text preset="t2">Resize the viewport to see padding change</Text>
      <ResponsiveBox>
        <Text>
          Desktop: 4x padding | Tablet: 2x padding | Mobile: 1x padding
        </Text>
      </ResponsiveBox>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Use \`@media()\` to apply styles based on viewport dimensions.

\`\`\`tsx
const ResponsiveBox = tasty({
  styles: {
    padding: {
      '': '4x',                    // Default (desktop)
      '@media(w < 768px)': '2x',   // Tablet
      '@media(w < 480px)': '1x',   // Mobile
    },
  },
});
\`\`\`
        `,
      },
    },
  },
};

// =============================================================================
// Predefined States (Global)
// =============================================================================

const PredefinedBox = tasty({
  styles: {
    padding: {
      '': '4x',
      '@mobile': '2x',
      '@tablet': '3x',
    },
    fill: '#success',
    color: '#white',
    radius: '2r',
  },
});

export const PredefinedStates: StoryObj = {
  render: () => (
    <Flex flow="column" gap="2x">
      <Text preset="t2">Uses global predefined @mobile and @tablet states</Text>
      <PredefinedBox>
        <Text>Desktop: 4x | Tablet: 3x | Mobile: 2x</Text>
      </PredefinedBox>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Define global predefined states once, use them everywhere:

\`\`\`tsx
// Set up once at app initialization
setGlobalPredefinedStates({
  '@mobile': '@media(w < 768px)',
  '@tablet': '@media(768px <= w < 1024px)',
  '@desktop': '@media(w >= 1024px)',
});

// Use anywhere
const Box = tasty({
  styles: {
    padding: {
      '': '4x',
      '@mobile': '2x',
      '@tablet': '3x',
    },
  },
});
\`\`\`
        `,
      },
    },
  },
};

// =============================================================================
// Local Predefined States
// =============================================================================

const LocalPredefinedBox = tasty({
  tabIndex: 0,
  role: 'button',
  styles: {
    // Local predefined states (component-specific)
    '@compact': '@media(w < 600px)',
    '@expanded': ':hover | :focus',

    padding: {
      '': '3x',
      '@compact': '1x',
    },
    fill: {
      '': '#warning-bg',
      '@expanded': '#warning',
    },
    color: '#dark',
    radius: '2r',
    transition: 'fill 0.2s',
  },
});

export const LocalPredefinedStates: StoryObj = {
  render: () => (
    <Flex flow="column" gap="2x">
      <Text preset="t2">Component-local predefined states</Text>
      <LocalPredefinedBox>
        <Text>Hover me! @expanded = hovered | focused</Text>
      </LocalPredefinedBox>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Define predefined states locally within a component:

\`\`\`tsx
const Box = tasty({
  styles: {
    // Define local aliases
    '@compact': '@media(w < 600px)',
    '@expanded': 'hovered | focused',

    padding: {
      '': '3x',
      '@compact': '1x',
    },
    fill: {
      '': '#purple-04',
      '@expanded': '#purple-03',
    },
  },
});
\`\`\`

Local definitions take precedence over global ones.
        `,
      },
    },
  },
};

// =============================================================================
// Color Scheme (Light/Dark Mode)
// =============================================================================

const ColorSchemeBox = tasty({
  styles: {
    padding: '3x',
    radius: '2r',
    fill: {
      '': '#white',
      '@media(prefers-color-scheme: dark)': '#dark',
    },
    color: {
      '': '#dark',
      '@media(prefers-color-scheme: dark)': '#white',
    },
    border: {
      '': '1bw solid #border',
      '@media(prefers-color-scheme: dark)': '1bw solid #dark-03',
    },
  },
});

export const ColorScheme: StoryObj = {
  render: () => (
    <Flex flow="column" gap="2x">
      <Text preset="t2">
        Adapts to system color scheme (prefers-color-scheme)
      </Text>
      <ColorSchemeBox>
        <Text>
          Light mode: white background, dark text
          <br />
          Dark mode: dark background, white text
        </Text>
      </ColorSchemeBox>
      <Text preset="c1" color="#warning">
        Change your system appearance settings to see the effect
      </Text>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Use \`@media(prefers-color-scheme: dark)\` to style based on system color preference:

\`\`\`tsx
const ColorSchemeBox = tasty({
  styles: {
    fill: {
      '': '#white',
      '@media(prefers-color-scheme: dark)': '#dark-02',
    },
    color: {
      '': '#dark',
      '@media(prefers-color-scheme: dark)': '#white',
    },
  },
});
\`\`\`

Or use predefined states:

\`\`\`tsx
setGlobalPredefinedStates({
  '@dark': '@media(prefers-color-scheme: dark)',
  '@light': '@media(prefers-color-scheme: light)',
});

const Box = tasty({
  styles: {
    fill: {
      '': '#white',
      '@dark': '#dark-02',
    },
  },
});
\`\`\`
        `,
      },
    },
  },
};

// =============================================================================
// Root States (Data Attributes)
// =============================================================================

const RootStateBox = tasty({
  styles: {
    padding: '3x',
    radius: '2r',
    fill: {
      '': '#light',
      '@root(mode=compact)': '#purple',
    },
    color: {
      '': '#dark',
      '@root(mode=compact)': '#white',
    },
  },
});

export const RootStates: StoryObj = {
  render: function RootStatesRender() {
    const [isCompact, setIsCompact] = useState(false);

    // Set data-mode on the html element
    const toggleCompactMode = () => {
      const html = document.documentElement;
      if (isCompact) {
        html.removeAttribute('data-mode');
      } else {
        html.setAttribute('data-mode', 'compact');
      }
      setIsCompact(!isCompact);
    };

    return (
      <Flex flow="column" gap="4x">
        <Flex gap="2x" placeItems="center">
          <Button onPress={toggleCompactMode}>
            {isCompact ? 'Disable' : 'Enable'} Compact Mode
          </Button>
          <Text preset="t3" color="#dark-03">
            Sets <code>data-mode="compact"</code> on <code>&lt;html&gt;</code>
          </Text>
        </Flex>

        <RootStateBox>
          <Text>
            {isCompact ? 'Compact mode active (purple)' : 'Default mode (gray)'}
          </Text>
        </RootStateBox>
      </Flex>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
Use \`@root()\` to style based on ancestor data attributes:

\`\`\`tsx
const RootStateBox = tasty({
  styles: {
    fill: {
      '': '#gray-02',
      '@root(mode=compact)': '#purple-04',
    },
  },
});

// Usage - set data attribute on ancestor
<div data-mode="compact">
  <RootStateBox>...</RootStateBox>
</div>
\`\`\`

This is useful for theme modes, layout variants, or any app-level state.
        `,
      },
    },
  },
};

// =============================================================================
// Combined States with AND/OR/NOT
// =============================================================================

const CombinedStatesBox = tasty({
  styles: {
    padding: '3x',
    radius: '2r',
    fill: {
      '': '#light',
      ':hover': '#purple',
      ':hover & :active': '#purple-text',
      '[disabled]': '#dark-05',
    },
    color: {
      '': '#dark',
      ':hover': '#white',
      '[disabled]': '#dark-04',
    },
    cursor: {
      '': 'pointer',
      '[disabled]': 'not-allowed',
    },
    transition: 'fill 0.15s, color 0.15s',
  },
});

export const CombinedStates: StoryObj = {
  render: () => (
    <Flex flow="column" gap="2x">
      <Text preset="t2">Combined states with AND operator</Text>
      <Flex gap="2x">
        <CombinedStatesBox>
          <Text>Hover me! (hover → purple, hover+press → darker)</Text>
        </CombinedStatesBox>
        <CombinedStatesBox data-disabled>
          <Text>Disabled state</Text>
        </CombinedStatesBox>
      </Flex>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Combine states using boolean operators:

- \`&\` (AND): Both conditions must be true
- \`|\` (OR): Either condition can be true
- \`!\` (NOT): Condition must be false

\`\`\`tsx
const Box = tasty({
  styles: {
    fill: {
      '': '#light',
      ':hover': '#purple',
      ':hover & :active': '#purple-text',  // AND
      ':hover | :focus': '#purple',        // OR
      '!disabled': '#success',             // NOT
    },
  },
});
\`\`\`
        `,
      },
    },
  },
};

// =============================================================================
// Media + Modifier Combination
// =============================================================================

const ResponsiveInteractiveBox = tasty({
  styles: {
    padding: {
      '': '4x',
      '@media(w < 600px)': '2x',
      ':hover': '5x',
      '@media(w < 600px) & :hover': '3x',
    },
    fill: '#danger',
    color: '#white',
    radius: '2r',
    transition: 'padding 0.2s',
  },
});

export const MediaWithModifiers: StoryObj = {
  render: () => (
    <Flex flow="column" gap="2x">
      <Text preset="t2">Media queries combined with interaction states</Text>
      <ResponsiveInteractiveBox>
        <Text>Hover changes padding differently on mobile vs desktop</Text>
      </ResponsiveInteractiveBox>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Combine media queries with interaction modifiers:

\`\`\`tsx
const Box = tasty({
  styles: {
    padding: {
      '': '4x',                            // Desktop default
      '@media(w < 600px)': '2x',           // Mobile default
      ':hover': '5x',                      // Desktop hover
      '@media(w < 600px) & :hover': '3x', // Mobile hover
    },
  },
});
\`\`\`
        `,
      },
    },
  },
};

// =============================================================================
// Sub-Element Styles with @own
// =============================================================================

const Card = tasty({
  styles: {
    padding: '3x',
    fill: '#white',
    border: '1bw solid #border',
    radius: '2r',

    // Sub-element that responds to its own hover
    Label: {
      color: {
        '': '#dark',
        '@own(:hover)': '#purple-text',
      },
      cursor: 'pointer',
      transition: 'color 0.15s',
    },

    // Sub-element that responds to parent hover
    Icon: {
      color: {
        '': '#dark-04',
        ':hover': '#purple-text', // Parent's hover state
      },
      transition: 'color 0.15s',
    },
  },
});

export const OwnStates: StoryObj = {
  render: () => (
    <Flex flow="column" gap="2x">
      <Text preset="t2">@own() for sub-element independent states</Text>
      <Card>
        <Flex gap="2x" placeItems="center">
          <Block data-element="Icon">📦</Block>
          <Block data-element="Label">
            <Text>Hover the label (independent) or the card (shared)</Text>
          </Block>
        </Flex>
      </Card>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Use \`@own()\` for sub-element states independent of parent:

\`\`\`tsx
const Card = tasty({
  styles: {
    // Sub-element with its own hover state
    Label: {
      color: {
        '': '#dark',
        '@own(:hover)': '#purple-text',  // Label's own hover
      },
    },

    // Sub-element responding to parent's state
    Icon: {
      color: {
        '': '#dark-04',
        ':hover': '#purple-text',  // Card's hover (no @own)
      },
    },
  },
});
\`\`\`
        `,
      },
    },
  },
};

// =============================================================================
// Container Queries
// =============================================================================

const ContainerQueryBox = tasty({
  styles: {
    padding: {
      '': '4x',
      '@(w < 500px)': '2x',
      '@(w < 300px)': '1x',
    },
    fill: '#warning',
    color: '#white',
    radius: '2r',
  },
});

export const ContainerQueries: StoryObj = {
  render: function ContainerQueriesRender() {
    const [size, setSize] = useState(400);

    return (
      <Flex flow="column" gap="2x" height="300px">
        <Text preset="t2">
          Drag the panel edge to resize and see padding change
        </Text>
        <Layout height="200px">
          <Layout.Panel
            isResizable
            side="left"
            size={size}
            minSize={150}
            maxSize={600}
            contentPadding="2x"
            onSizeChange={setSize}
          >
            <ContainerQueryBox>
              <Text>
                Width: {size}px
                <br />
                {size < 300
                  ? 'Padding: 1x (< 300px)'
                  : size < 500
                    ? 'Padding: 2x (< 500px)'
                    : 'Padding: 4x (default)'}
              </Text>
            </ContainerQueryBox>
          </Layout.Panel>
          <Layout.Content fill="#light" padding="2x">
            <Text color="#dark-03">Main content area</Text>
          </Layout.Content>
        </Layout>
      </Flex>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
Use \`@()\` for container queries:

\`\`\`tsx
const Box = tasty({
  styles: {
    padding: {
      '': '4x',
      '@(w < 300px)': '1x',       // Container < 300px
      '@(w < 500px)': '2x',       // Container < 500px
    },
  },
});

// Named container
const Box = tasty({
  styles: {
    padding: {
      '': '4x',
      '@(card, w < 300px)': '1x', // Named container query
    },
  },
});
\`\`\`

Note: Requires browser support for CSS Container Queries.
        `,
      },
    },
  },
};

// =============================================================================
// Supports Queries
// =============================================================================

const SupportsQueryBox = tasty({
  styles: {
    // The point of @supports is to check and then use.
    // Default to grid; if masonry lands, opt into it.
    display: {
      '': 'grid',
      '@supports(display: grid-lanes)': 'grid-lanes',
    },
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2x',
    padding: '3x',
    fill: {
      '': '#warning',
      '@supports(display: grid-lanes)': '#success',
    },
    color: '#white',
    radius: '2r',
    transition: 'fill 0.2s',
  },
});

export const SupportsQueries: StoryObj = {
  render: () => (
    <Flex flow="column" gap="2x">
      <Text preset="t2">@supports queries</Text>
      <SupportsQueryBox>
        <Block
          fill="#dark.10"
          radius="1r"
          padding="2x"
          styles={{ gridColumn: '1 / -1' }}
        >
          <Text>
            Uses <code>@supports(display: grid-lanes)</code> and sets{' '}
            <code>display: grid-lanes</code> when supported.
          </Text>
          <Text preset="c1" color="#white.80">
            See:{' '}
            <a href="https://css-tricks.com/masonry-layout-is-now-grid-lanes/">
              CSS-Tricks article
            </a>
          </Text>
        </Block>

        {Array.from({ length: 9 }).map((_, i) => (
          <Block
            // varying heights to make the layout difference visible
            key={i}
            fill="#dark.12"
            radius="1r"
            padding="2x"
            height={i % 3 === 0 ? '14x' : i % 3 === 1 ? '10x' : '18x'}
          >
            <Text preset="t3 strong">Item {i + 1}</Text>
          </Block>
        ))}
      </SupportsQueryBox>
      <Text preset="c1" color="#warning">
        Tip: selector support checks use <code>@supports($, :has(*))</code>.
      </Text>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Use \`@supports(...)\` to apply styles only if the browser supports a given feature:

\`\`\`tsx
const Box = tasty({
  styles: {
    display: {
      '': 'grid',
      '@supports(display: grid-lanes)': 'grid-lanes',
    },
  },
});
\`\`\`

To check selector support (e.g. \`:has()\`), use:

\`\`\`tsx
styles: {
  border: {
    '': '1bw solid #border',
    '@supports($, :has(*))': '2bw solid #purple',
  },
}
\`\`\`
        `,
      },
    },
  },
};

// =============================================================================
// Container Style Queries
// =============================================================================

const StyleQueryBox = tasty({
  styles: {
    padding: '3x',
    radius: '2r',
    fill: {
      '': '#light',
      '@($variant)': '#purple', // When --variant exists
      '@($variant=danger)': '#danger', // When --variant equals 'danger'
      '@($variant=success)': '#success', // When --variant equals 'success'
    },
    color: {
      '': '#dark',
      '@($variant)': '#white',
    },
  },
});

const StyleQueryContainer = tasty({
  styles: {
    padding: '2x',
    radius: '2r',
    border: '1bw solid #border',
    containerType: 'inline-size',
  },
});

export const ContainerStyleQueries: StoryObj = {
  render: function ContainerStyleQueriesRender() {
    const [variant, setVariant] = useState<string | null>(null);

    return (
      <Flex flow="column" gap="4x">
        <Text preset="t2">
          Container style queries based on CSS custom properties
        </Text>

        <Flex gap="2x">
          <Button
            type={variant === null ? 'primary' : 'outline'}
            onPress={() => setVariant(null)}
          >
            No variant
          </Button>
          <Button
            type={variant === 'default' ? 'primary' : 'outline'}
            onPress={() => setVariant('default')}
          >
            --variant (exists)
          </Button>
          <Button
            type={variant === 'danger' ? 'primary' : 'outline'}
            onPress={() => setVariant('danger')}
          >
            --variant: danger
          </Button>
          <Button
            type={variant === 'success' ? 'primary' : 'outline'}
            onPress={() => setVariant('success')}
          >
            --variant: success
          </Button>
        </Flex>

        <StyleQueryContainer
          style={variant ? { '--variant': variant } : undefined}
        >
          <StyleQueryBox>
            <Text>
              {variant === null
                ? 'No --variant set (gray)'
                : variant === 'danger'
                  ? '--variant: danger (red)'
                  : variant === 'success'
                    ? '--variant: success (green)'
                    : '--variant exists (purple)'}
            </Text>
          </StyleQueryBox>
        </StyleQueryContainer>
      </Flex>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
Use \`@($property)\` to check if a CSS custom property exists, or \`@($property=value)\` to match a specific value:

\`\`\`tsx
const Box = tasty({
  styles: {
    fill: {
      '': '#light',
      '@($variant)': '#purple',         // --variant exists
      '@($variant=danger)': '#danger',  // --variant equals 'danger'
      '@($variant=success)': '#success', // --variant equals 'success'
    },
  },
});

// Usage - set the custom property on container
<div style={{ '--variant': 'danger' }}>
  <Box>...</Box>
</div>
\`\`\`

Note: Requires browser support for CSS Container Style Queries.
        `,
      },
    },
  },
};

// =============================================================================
// Complex OR Conditions
// =============================================================================

const OrConditionBox = tasty({
  styles: {
    padding: '3x',
    radius: '2r',
    fill: {
      '': '#light',
      ':hover | :focus': '#purple',
    },
    color: {
      '': '#dark',
      ':hover | :focus': '#white',
    },
    outline: {
      '': 'none',
      ':focus': '2px solid #focus',
    },
    transition: 'fill 0.15s, color 0.15s',
  },
  role: 'button',
  tabIndex: 0,
});

export const OrConditions: StoryObj = {
  render: () => (
    <Flex flow="column" gap="2x">
      <Text preset="t2">OR conditions: hover OR focus triggers the style</Text>
      <OrConditionBox>
        <Text>Hover or focus me (Tab key)</Text>
      </OrConditionBox>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: `
OR conditions allow styles to apply when any condition is true:

\`\`\`tsx
const Box = tasty({
  styles: {
    fill: {
      '': '#light',
      ':hover | :focus': '#purple',  // Either works
    },
  },
});
\`\`\`

The pipeline generates exclusive CSS rules to avoid conflicts.
        `,
      },
    },
  },
};

// =============================================================================
// Starting Style Transitions
// =============================================================================

const FadeInBox = tasty({
  styles: {
    padding: '3x',
    radius: '2r',
    fill: '#purple',
    color: '#white',
    opacity: {
      '': 1,
      '@starting': 0,
    },
    transform: {
      '': 'translateY(0)',
      '@starting': 'translateY(-20px)',
    },
    transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
  },
});

const SlideInCard = tasty({
  styles: {
    padding: '4x',
    radius: '2r',
    fill: '#success',
    color: '#white',
    opacity: {
      '': 1,
      '@starting': 0,
    },
    transform: {
      '': 'scale(1)',
      '@starting': 'scale(0.8)',
    },
    transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
  },
});

export const StartingStyleTransitions: StoryObj = {
  render: () => {
    const [key, setKey] = useState(0);

    return (
      <Flex flow="column" gap="4x">
        <Text preset="t2">@starting for entry animations</Text>
        <Button onPress={() => setKey((k) => k + 1)}>Remount Elements</Button>

        <Flex key={key} gap="4x">
          <FadeInBox>
            <Text>Fade + Slide In</Text>
          </FadeInBox>

          <SlideInCard>
            <Text>Scale In</Text>
          </SlideInCard>
        </Flex>
      </Flex>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
Use \`@starting\` (shorthand for \`@starting-style\`) to define initial styles for CSS transitions when an element first appears:

\`\`\`tsx
const FadeInBox = tasty({
  styles: {
    opacity: {
      '': 1,           // Final state
      '@starting': 0,  // Initial state (before transition)
    },
    transform: {
      '': 'translateY(0)',
      '@starting': 'translateY(-20px)',
    },
    transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
  },
});
\`\`\`

This enables smooth entry animations when elements mount or become visible.

**Note**: Requires browser support for \`@starting-style\` CSS rule.
        `,
      },
    },
  },
};

// =============================================================================
// Exclusive Conditions Demo
// =============================================================================

const PriorityBox = tasty({
  styles: {
    padding: '3x',
    radius: '2r',
    fill: {
      '': '#light',
      'size=small': '#success',
      'size=medium': '#warning',
      'size=large': '#danger',
    },
    color: {
      '': '#dark',
      'size=small | size=medium | size=large': '#white',
    },
  },
});

export const ExclusiveConditions: StoryObj = {
  render: () => (
    <Flex flow="column" gap="2x">
      <Text preset="t2">
        Exclusive conditions: each state applies to exactly one scenario
      </Text>
      <Flex gap="2x">
        <PriorityBox data-size="small">
          <Text>Small (green)</Text>
        </PriorityBox>
        <PriorityBox data-size="medium">
          <Text>Medium (orange)</Text>
        </PriorityBox>
        <PriorityBox data-size="large">
          <Text>Large (red)</Text>
        </PriorityBox>
        <PriorityBox>
          <Text>Default (gray)</Text>
        </PriorityBox>
      </Flex>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: `
The pipeline generates exclusive CSS rules where each rule matches exactly one scenario:

\`\`\`css
/* Generated CSS (simplified) */
.box[data-size="large"] { fill: red; }
.box:not([data-size="large"])[data-size="medium"] { fill: orange; }
.box:not([data-size="large"]):not([data-size="medium"])[data-size="small"] { fill: green; }
.box:not([data-size="large"]):not([data-size="medium"]):not([data-size="small"]) { fill: gray; }
\`\`\`

This eliminates CSS specificity conflicts.
        `,
      },
    },
  },
};
