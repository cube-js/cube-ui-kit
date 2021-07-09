import React from 'react';

export function isTextOnly(children) {
  return React.Children.toArray(children).every(c => !React.isValidElement(c));
}
