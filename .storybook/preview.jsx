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
