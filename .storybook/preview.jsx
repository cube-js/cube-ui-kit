import React from 'react';
import { DocsContainer } from '@storybook/addon-docs';
import { Root } from '../src';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  viewMode: 'docs',
  previewTabs: { 'storybook/docs/panel': { index: -1 } },
  docs: {
    container: ({ children, context }) => (
      <DocsContainer context={context}>
        <Root>{children}</Root>
      </DocsContainer>
    ),
  },
};

export const decorators = [
  (Story) => (
    <Root>
      <Story />
    </Root>
  ),
];
