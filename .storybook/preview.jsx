import isChromatic from 'chromatic/isChromatic';
import { config } from 'react-transition-group';
import { configure } from 'storybook/test';

import { Root } from '../src/components/Root';

configure({ testIdAttribute: 'data-qa', asyncUtilTimeout: 10000 });

// Load tasty debug utilities in local Storybook only (exclude Chromatic)
if (!isChromatic() && import.meta.env.DEV) {
  import('@tenphi/tasty').then(({ tastyDebug }) => {
    try {
      tastyDebug.install();
    } catch (e) {
      console.warn('tastyDebug installation failed:', e);
    }
  });
}

if (isChromatic()) {
  // disabling transitions
  config.disabled = true;
}

export const parameters = {
  options: {
    storySort: {
      order: [
        'Getting Started',
        [
          'Overview',
          'Usage',
          'Create Component',
          'Utilities',
          'Base Properties',
          'Field Properties',
          'Complex Layout',
          'Advanced States',
          'Playground',
        ],
        'Actions',
        'Content',
        'Forms',
        'Helpers',
        'Layout',
        'Navigation',
        'Overlays',
        'Status',
        'Components',
        'Other',
        '*',
      ],
    },
  },
  docs: {},
  backgrounds: {
    options: {
      transparent: { name: 'transparent', value: 'transparent' },
      gray: { name: 'gray', value: 'rgba(243,243,250, 1)' },
    },
  },
  actions: {
    // Disable only while the test runner is active
    disable: isChromatic() || process.env.NODE_ENV === 'test',
  },
};

export const decorators = [
  (Story) => (
    <Root fontDisplay="auto">
      <Story />
    </Root>
  ),
];
export const tags = ['autodocs'];

export const initialGlobals = {
  backgrounds: {
    value: 'transparent',
  },
};
