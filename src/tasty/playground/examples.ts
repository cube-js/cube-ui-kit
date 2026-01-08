import {
  DEFAULT_OUTLINE_STYLES,
  DEFAULT_PRIMARY_STYLES,
} from '../../data/item-themes';
import { Styles } from '../styles/types';

export interface PlaygroundExample {
  name: string;
  component: 'card' | 'button';
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
        '@media(w < 768px)': '2x',
      },
      fill: '#white',
      radius: '2r',
      border: true,
      width: {
        '': '400px',
        '@media(w < 768px)': '100%',
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
];
