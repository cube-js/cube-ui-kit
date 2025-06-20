import { DocsContainer } from '@storybook/addon-docs';
import { configure } from '@storybook/test';
import isChromatic from 'chromatic/isChromatic';
import { config } from 'react-transition-group';

import { Root } from '../src';

configure({ testIdAttribute: 'data-qa', asyncUtilTimeout: 10000 });

if (isChromatic()) {
  // disabling transitions
  config.disabled = true;
}

export const parameters = {
  options: {
    storySort: (a, b) => {
      // Get story titles/kinds for comparison
      const aTitle = a.title || a.kind || '';
      const bTitle = b.title || b.kind || '';

      console.log('Sorting:', { aTitle, bTitle }); // Debug log

      // Check if either story is in the 'tasty' section
      const aIsTasty =
        aTitle.toLowerCase().includes('tasty') || aTitle.startsWith('Tasty');
      const bIsTasty =
        bTitle.toLowerCase().includes('tasty') || bTitle.startsWith('Tasty');

      // Always put 'tasty' section at the top
      if (aIsTasty && !bIsTasty) {
        return -1;
      }
      if (bIsTasty && !aIsTasty) {
        return 1;
      }

      // For all other stories, sort alphabetically
      return aTitle.localeCompare(bTitle, undefined, { numeric: true });
    },
  },
  docs: {
    container: ({ children, context }) => (
      <DocsContainer context={context}>
        <Root fontDisplay="auto">{children}</Root>
      </DocsContainer>
    ),
  },
  backgrounds: {
    default: 'transparent',
    values: [
      { name: 'transparent', value: 'transparent' },
      { name: 'gray', value: 'rgba(243,243,250, 1)' },
    ],
  },
};

export const decorators = [
  (Story) => (
    <Root fontDisplay="auto">
      <Story />
    </Root>
  ),
];
