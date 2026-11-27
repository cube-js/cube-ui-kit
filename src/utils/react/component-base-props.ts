import { filterBaseProps } from '@tenphi/tasty';

import type { BaseProps, BasePropsWithoutChildren } from '@tenphi/tasty';

type ComponentOwnedProp = 'element' | 'theme' | 'title';

export type ComponentBaseProps = Omit<BaseProps, ComponentOwnedProp>;
export type ComponentBasePropsWithoutChildren = Omit<
  BasePropsWithoutChildren,
  ComponentOwnedProp
>;

/** Keep Tasty's slot name and incidental DOM or theme attributes off component roots. */
export function omitComponentOwnedProps<T extends object>(
  props: T & Partial<Record<ComponentOwnedProp, unknown>>,
): Omit<T, ComponentOwnedProp> {
  const { element: _element, theme: _theme, title: _title, ...rest } = props;

  return rest;
}

export function filterComponentBaseProps<
  T extends object,
  O extends Parameters<typeof filterBaseProps>[1] = undefined,
>(props: T, options?: O) {
  return filterBaseProps(omitComponentOwnedProps<T>(props), options);
}
