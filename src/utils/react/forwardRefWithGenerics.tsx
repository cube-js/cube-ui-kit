import { DOMRef } from '@react-types/shared';
import { ReactElement } from 'react';

/**
 * A helper for creating forwardRef components with generic types.
 * This solves the issue where React's forwardRef doesn't work well with generic components,
 * especially when props include required children from CollectionBase<T> or similar types.
 *
 * @example
 * ```tsx
 * function MySelect<T extends object>(
 *   props: MySelectProps<T>,
 *   ref: DOMRef<HTMLDivElement>
 * ) {
 *   // component implementation
 *   return <div ref={ref}>...</div>;
 * }
 *
 * const MySelectWithRef = forwardRefWithGenerics(MySelect);
 *
 * // Usage:
 * <MySelectWithRef<ItemType> items={items} ref={myRef} />
 * ```
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
