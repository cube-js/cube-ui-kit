import { isValidElement, ReactNode } from 'react';
import { isFragment } from 'react-is';

export function wrapNodeIfPlain(children: ReactNode, render: () => ReactNode) {
  if (isValidElement(children)) {
    if (isFragment(children)) {
      console.warn(
        'Don\'t use a fragment as a child. This can lead to errors in the display logic of elements.',
      );
    }

    return children;
  }

  return render();
}
