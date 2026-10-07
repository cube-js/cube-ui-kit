import { DOMRef } from '@react-types/shared';
import { ReactElement } from 'react';

/**
 * @deprecated Use `forwardRef` with a cast that restores the generic, as
 * `Select`, `ComboBox` and `Picker` do. This helper returns a plain function
 * component that reads `ref` from its props, and React 18 never passes `ref`
 * to one, so the ref is dropped there. Its returned `<T>` is unused too, so
 * the component's props lose their item generic.
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
