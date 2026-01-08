import {
  DEFAULT_OUTLINE_STYLES,
  DEFAULT_PRIMARY_STYLES,
} from '../../data/item-themes';
import { Styles } from '../../tasty/styles/types';

export interface PlaygroundExample {
  name: string;
  component: 'card' | 'button' | 'raw' | 'scroll-progress';
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
          '@supports(animation-timeline: scroll())': '0 1',
        },
        // Animation properties only when supported
        animation: {
          '': 'none',
          '@supports(animation-timeline: scroll())':
            'grow-progress linear both',
        },
        animationTimeline: {
          '': 'auto',
          '@supports(animation-timeline: scroll())': 'scroll(nearest block)',
        },
      },

      // Scrollable content area
      Content: {
        display: 'block',
        padding: '2x',
      },
    },
  },
];
