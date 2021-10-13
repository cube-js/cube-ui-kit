import React from 'react';
import { Root } from '../src/components/Root';

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
}

export const decorators = [(Story) => <Root><Story/></Root>];
