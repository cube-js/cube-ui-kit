import isChromatic from 'chromatic/isChromatic';
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
  // Storybook's `addon-backgrounds` injects `.sb-show-main { background: … !important }`
  // when an option is selected, which overrides the body's `#surface` fill from
  // `src/components/GlobalStyles.tsx`. Disable it globally so the body's
  // scheme-aware Glaze background shows through (dark/light). Stories can still
  // override via `parameters.backgrounds = { disable: false, … }`.
  backgrounds: {
    disabled: true,
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
