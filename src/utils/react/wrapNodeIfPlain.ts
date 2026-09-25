import { Fragment, isValidElement, ReactNode } from 'react';

export function wrapNodeIfPlain(children: ReactNode, render: () => ReactNode) {
  // Compared by `type`, not with `react-is`: the pinned `react-is@18` does not
  // recognise React 19 elements, so it called every fragment a single element.
  const childrenIsFragment =
    Array.isArray(children) ||
    (isValidElement(children) && children.type === Fragment);

  if (!children || (!childrenIsFragment && isValidElement(children))) {
    return children;
  }

  return render();
}
