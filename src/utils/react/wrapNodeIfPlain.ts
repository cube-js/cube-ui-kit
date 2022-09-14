import { isValidElement, ReactNode } from 'react';
import { isFragment } from 'react-is';

export function wrapNodeIfPlain(children: ReactNode, render: () => ReactNode) {
  const childrenIsFragment =
    children && (Array.isArray(children) || isFragment(children));

  if (!children || (!childrenIsFragment && isValidElement(children))) {
    return children;
  }

  return render();
}
