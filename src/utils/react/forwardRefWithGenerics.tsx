import { DOMRef } from '@react-types/shared';
import { ReactElement } from 'react';

/**
 * @deprecated Declare a ref prop on a generic component, or preserve an
 * existing forwardRef wrapper with a cast that restores its generic. This
 * helper's returned `<T>` is unused, so props lose their item generic.
 */
export function forwardRefWithGenerics<
  TProps extends Record<string, any>,
  TElement extends HTMLElement = HTMLElement,
>(
  component: <T extends object>(
    props: TProps,
    ref: DOMRef<TElement>,
  ) => ReactElement,
) {
  return function ComponentWithRef<T extends object>(
    props: TProps & { ref?: DOMRef<TElement> },
  ) {
    const { ref = null, ...otherProps } = props;
    return component(otherProps as TProps, ref);
  };
}
