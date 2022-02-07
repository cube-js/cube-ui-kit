import { isValidElement, ReactNode } from 'react';
import { isFragment } from 'react-is';

export function wrapNodeIfPlain(children: ReactNode, render: () => ReactNode) {
  const childrenIsFragment = Array.isArray(children) || isFragment(children);

  if (!childrenIsFragment && isValidElement(children)) {
    return children;
  }

  return render();
}
