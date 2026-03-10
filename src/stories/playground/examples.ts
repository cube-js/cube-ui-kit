import { Styles } from '@tenphi/tasty';

import {
  DEFAULT_OUTLINE_STYLES,
  DEFAULT_PRIMARY_STYLES,
} from '../../data/item-themes';

export interface PlaygroundExample {
  name: string;
  component:
    | 'card'
    | 'button'
    | 'raw'
    | 'scroll-progress'
    | 'structured-card'
    | 'list-card';
  styles: Styles;
}

// Common button layout styles
const BUTTON_BASE_STYLES: Styles = {
  display: 'inline-flex',
  placeItems: 'center',
  gap: '1x',
  padding: '(1.25x - 1bw) (2x - 1bw)',
  radius: '1r',
  preset: 't3',
  cursor: {
    '': 'pointer',
    disabled: 'not-allowed',
  },
  transition: 'theme',
};

export const PLAYGROUND_EXAMPLES: PlaygroundExample[] = [
  {
    name: 'Raw (No preview)',
    component: 'raw',
    styles: {
      display: 'flex',
      flow: 'column',
      gap: '2x',
      padding: '3x',
      fill: '#white',
      radius: '2r',
      border: true,
    },
  },
  {
    name: 'Card - Basic',
    component: 'card',
    styles: {
      display: 'flex',
      flow: 'column',
      gap: '2x',
      padding: '3x',
      fill: '#white',
      radius: '2r',
      border: true,
      shadow: '0 2px 8px #dark.10',
    },
  },
  {
    name: 'Card - Purple',
    component: 'card',
    styles: {
      display: 'flex',
      flow: 'column',
      gap: '2x',
      padding: '4x',
      fill: '#purple',
      color: '#white',
      radius: '2r',
    },
  },
  {
    name: 'Card - Responsive',
    component: 'card',
    styles: {
      display: 'flex',
      flow: 'column',
      gap: '2x',
      padding: {
        '': '4x',
        '@(w < 768px)': '2x',
      },
      fill: '#white',
      radius: '2r',
      border: true,
      width: {
        '': '400px',
        '@(w < 768px)': '100%',
      },
    },
  },
  {
    name: 'Button - Primary',
    component: 'button',
    styles: {
      ...BUTTON_BASE_STYLES,
      ...DEFAULT_PRIMARY_STYLES,
    },
  },
  {
    name: 'Button - Outline',
    component: 'button',
    styles: {
      ...BUTTON_BASE_STYLES,
      ...DEFAULT_OUTLINE_STYLES,
    },
  },
  {
    name: 'Scroll Progress (@supports)',
    component: 'scroll-progress',
    styles: {
      // Container styles
      display: 'flex',
      flow: 'column',
      width: '300px',
      height: '200px',
      radius: '2r',
      border: true,
      overflow: 'auto',
      fill: '#white',

      // Predefined state for @supports(animation-timeline: scroll())
      '@supports-timeline': '@supports(animation-timeline: scroll())',

      // Define keyframes for the progress animation
      '@keyframes': {
        'grow-progress': {
          from: 'scale: 0 1',
          to: 'scale: 1 1',
        },
      },

      // Progress bar element
      ProgressBar: {
        position: 'sticky',
        top: 0,
        left: 0,
        zIndex: 1,
        height: 'min .5x',
        margin: '-.5x bottom',
        fill: '#purple',
        radius: 'round',
        transformOrigin: 'left center',
        // Fallback for browsers without animation-timeline
        scale: {
          '': '1 1',
          // When animation-timeline is supported, use scale: 0 1 as starting point
          '@supports-timeline': '0 1',
        },
        // Animation properties only when supported
        animation: {
          '': 'none',
          '@supports-timeline': 'grow-progress linear both',
        },
        animationTimeline: {
          '': 'auto',
          '@supports-timeline': 'scroll(nearest block)',
        },
      },

      // Scrollable content area
      Content: {
        display: 'block',
        padding: '2x',
      },
    },
  },
  {
    name: 'Card - Sub-elements',
    component: 'structured-card',
    styles: {
      display: 'flex',
      flow: 'column',
      padding: '3x',
      fill: '#white',
      radius: '2r',
      border: true,

      Header: {
        $: '>',
        display: 'flex',
        flow: 'column',
        gap: '.5x',
      },
      Title: {
        $: '>Header>',
        preset: 'h5',
      },
      Subtitle: {
        $: '>Header>',
        preset: 't4',
        color: '#dark-04',
      },
      Body: {
        $: '>',
        preset: 't3',
        color: '#dark-02',
        padding: '1.5x top',
      },
      Footer: {
        $: '>',
        display: 'flex',
        gap: '1x',
        padding: '1.5x top',
        borderTop: true,
        preset: 't4',
        color: '#dark-03',
      },
    },
  },
  {
    name: 'Card - Shimmer',
    component: 'card',
    styles: {
      display: 'flex',
      flow: 'column',
      gap: '2x',
      padding: '3x',
      fill: '#dark.04',
      radius: '2r',
      overflow: 'hidden',
      position: 'relative',
      color: 'transparent',

      '@keyframes': {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },

      Shimmer: {
        $: '::after',
        content: '""',
        position: 'absolute',
        inset: true,
        image: 'linear-gradient(90deg, transparent, #white.4, transparent)',
        animation: 'shimmer 1.5s infinite',
      },
    },
  },
  {
    name: 'Card - Shapes & Shadows',
    component: 'card',
    styles: {
      display: 'flex',
      flow: 'column',
      gap: '2x',
      padding: '4x',
      fill: '#white',
      radius: 'leaf',
      border: true,
      shadow: '0 2px 8px #dark.10, inset 0 1px 0 #white.50',
    },
  },
  {
    name: 'Raw - Grid Layout',
    component: 'raw',
    styles: {
      display: 'grid',
      gridColumns: '1fr 2fr 1fr',
      gridRows: 'auto 1fr auto',
      gridAreas:
        '"header header header" "nav main aside" "footer footer footer"',
      gap: '2x',
      padding: '3x',
      fill: '#white',
      radius: '1r',
      width: 'max 960px',
      height: 'min 400px',
    },
  },
  {
    name: 'Raw - Directional Modifiers',
    component: 'raw',
    styles: {
      display: 'flex',
      flow: 'column',
      padding: '2x, 3x left right',
      border: '1bw #border, 2bw #purple bottom',
      radius: '2r top',
      fill: '#white',
      margin: 'auto left right, 2x top bottom',
      width: 'min 200px',
    },
  },
  {
    name: 'Raw - Text Truncation',
    component: 'raw',
    styles: {
      display: 'block',
      width: '200px 300px',
      padding: '2x',
      fill: '#white',
      radius: '1r',
      border: true,
      preset: 't3',
      textOverflow: 'ellipsis / 3',
    },
  },
  {
    name: 'Raw - @parent States',
    component: 'raw',
    styles: {
      display: 'block',
      padding: '2x',
      radius: '1r',
      preset: 't3',
      fill: {
        '': '#white',
        '@parent(hovered)': '#purple.05',
        '@parent(theme=dark)': '#dark-02',
        '@parent(theme=dark, >)': '#dark-03',
        '@parent(disabled)': '#dark.04',
      },
      color: {
        '': '#dark',
        '@parent(theme=dark)': '#white',
        '@parent(disabled)': '#dark-04',
      },
      border: {
        '': true,
        '@parent(theme=dark)': '#white.2',
      },
    },
  },
  {
    name: 'Raw - @root & @media (Dark Mode)',
    component: 'raw',
    styles: {
      display: 'flex',
      flow: 'column',
      gap: '1x',
      padding: '2x',
      radius: '1r',
      preset: 't3',

      '@dark':
        '@root(schema=dark) | (!@root(schema) & @media(prefers-color-scheme: dark))',

      fill: {
        '': '#white',
        '@dark': '#dark-02',
      },
      color: {
        '': '#dark',
        '@dark': '#white',
      },
      border: {
        '': true,
        '@dark': '#white.15',
      },
    },
  },
  {
    name: 'List - @own Pseudo-classes',
    component: 'list-card',
    styles: {
      display: 'flex',
      flow: 'column',
      fill: '#white',
      radius: '2r',
      border: true,
      overflow: 'hidden',

      Title: {
        $: '>',
        preset: 'h6',
        padding: '1.5x 2x',
        borderBottom: true,
      },
      Item: {
        $: '>@',
        display: 'flex',
        placeItems: 'center',
        gap: '1x',
        padding: '1x 2x',
        preset: 't3',
        cursor: 'pointer',
        transition: 'fill 0.15s',
        fill: {
          '': 'transparent',
          '@own(:hover)': '#purple.05',
        },
        color: {
          '': '#dark-02',
          '@own(:hover)': '#dark',
        },
        borderTop: {
          '': '#dark.06',
          '@own(:first-of-type)': 0,
        },
        radius: {
          '': 0,
          '@own(:last-child)': '0 0 (2r - 1bw) (2r - 1bw)',
        },
      },
      Icon: {
        $: '>Item>',
        color: '#purple',
        preset: 't4',
      },
    },
  },
  {
    name: 'Raw - :has & :is',
    component: 'raw',
    styles: {
      display: {
        '': 'block',
        ':has(> Icon)': 'grid',
      },
      gridColumns: {
        ':has(> Icon)': 'auto 1fr',
      },
      gap: {
        '': '1x',
        ':has(> Icon)': '2x',
      },
      placeItems: {
        ':has(> Icon)': 'center start',
      },
      padding: '2x',
      fill: '#white',
      radius: '1r',
      preset: 't3',
      border: {
        '': true,
        ':is(:first-child)': '2bw #purple',
        ':is(:last-child)': '2bw #danger',
        '!:has(> Icon)': 'dashed',
      },
    },
  },
  {
    name: 'Raw - Boolean Combinators',
    component: 'raw',
    styles: {
      display: 'inline-flex',
      placeItems: 'center',
      padding: '(1.25x - 1bw) (2x - 1bw)',
      radius: '1r',
      preset: 't3',
      cursor: {
        '': 'pointer',
        disabled: 'not-allowed',
      },
      transition: 'theme',
      fill: {
        '': '#white',
        'hovered & !disabled': '#purple.05',
        'pressed & !disabled': '#purple.10',
        'selected & !disabled': '#purple.08',
        'selected & hovered & !disabled': '#purple.14',
        disabled: '#dark.04',
      },
      color: {
        '': '#dark-02',
        'hovered | focused': '#dark',
        'pressed | (selected & !hovered)': '#purple',
        disabled: '#dark-04',
      },
      border: {
        '': true,
        'focused & !disabled': '#purple',
        'invalid & !focused': '#danger',
      },
      outline: {
        '': '0 #purple.0',
        'focused & !disabled': '1bw #purple',
      },
    },
  },
  {
    name: 'Card - Fade Edges',
    component: 'card',
    styles: {
      display: 'block',
      width: '260px',
      height: '160px',
      overflow: 'auto',
      padding: '2x',
      fill: '#white',
      radius: '1r',
      border: true,
      preset: 't3',
      color: '#dark-02',
      fade: '2x top bottom',
    },
  },
  {
    name: 'Card - Scrollbar',
    component: 'card',
    styles: {
      display: 'block',
      width: '260px',
      height: '160px',
      overflow: 'auto',
      padding: '2x',
      fill: '#white',
      radius: '1r',
      border: true,
      preset: 't3',
      color: '#dark-02',
      scrollbar: 'styled 1x #purple.40 #dark.04',
    },
  },
];
