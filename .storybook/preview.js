import React from 'react';
import GlobalStyles from '../src/components/CSSCustomProperties';

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
}

export const decorators = [(Story) => <><GlobalStyles/><Story/></>];
