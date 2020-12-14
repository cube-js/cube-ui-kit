import React from 'react';
import CSSCustomProperties from '../src/components/CSSCustomProperties';

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
}

export const decorators = [(Story) => <><CSSCustomProperties/><Story/></>];
