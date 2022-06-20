import isChromatic from 'chromatic/isChromatic';
import { config } from 'react-transition-group';
import { DocsContainer } from '@storybook/addon-docs';
import { Root } from '../src';
import { configure } from '@storybook/testing-library';

configure({ testIdAttribute: 'data-qa', asyncUtilTimeout: 10000 });

if (isChromatic()) {
  // disabling transitions
  config.disabled = true;
}

export const parameters = {
  docs: {
    container: ({ children, context }) => (
      <DocsContainer context={context}>
        <Root>{children}</Root>
      </DocsContainer>
    ),
  },
  actions: { argTypesRegex: '^on[A-Z].*' },
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
    <Root>
      <Story />
    </Root>
  ),
];
