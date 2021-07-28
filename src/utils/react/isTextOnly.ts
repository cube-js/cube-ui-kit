import { Children, isValidElement } from 'react';

export function isTextOnly(children) {
  return Children.toArray(children).every(
    (c) => !isValidElement(c),
  );
}
