import { Styles } from '@tenphi/tasty';

import {
  DEFAULT_OUTLINE_STYLES,
  DEFAULT_PRIMARY_STYLES,
} from '../../data/item-themes';

export interface PlaygroundExample {
  name: string;
  component: 'card' | 'button' | 'raw' | 'scroll-progress' | 'structured-card';
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
];
