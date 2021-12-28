import React from 'react';
import { Root } from '../src/components/Root';

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  viewMode: 'docs',
  previewTabs: { 'storybook/docs/panel': { index: -1 } },
}

export const decorators = [(Story) => <Root><Story/></Root>];
