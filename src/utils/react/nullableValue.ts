import type { Props } from '../../props';

// Each value helper turns a controlled `null` into the control's own empty
// value, so `null` means "controlled, no value"; see `castNullableField`.

export function castNullableStringValue<T>(
  props: T,
  /** `null` for controls whose state takes it, such as a radio group. */
  emptyValue: string | null = '',
): T {
  return castNullableField(
    props,
    ['value', 'defaultValue'],
    'string',
    (v) => String(v),
    emptyValue,
  );
}

export function castNullableNumberValue<T>(props: T): T {
  return castNullableField(
    props,
    ['value', 'defaultValue'],
    'number',
    (v) => Number(v),
    NaN,
  );
}

export function castNullableArrayValue<T>(props: T): T {
  return castNullableField(
    props,
    ['value', 'defaultValue'],
    'object',
    (v) => (Array.isArray(v) ? v : []),
    [],
  );
}

export function castNullableIsSelected<T>(props: T): T {
  return castNullableField(
    props,
    ['isSelected', 'defaultSelected'],
    'boolean',
    (v) => !!v,
    false,
  );
}

export function castNullableSelectedKey<T>(props: T): T {
  return castNullableField(props, ['selectedKey', 'defaultSelectedKey']);
}

/**
 * Replaces `null` in `keys` and casts a value of the wrong `type`.
 *
 * The first key is the controlled one, and its `null` becomes `emptyValue`. Pass the control's own
 * empty value (`''`, `NaN`, `[]`, or `null` where React Stately takes it) so that `null` means
 * "controlled, no value": the field stays controlled and clears. Left out, `null` becomes
 * `undefined`, which switches the control to uncontrolled mode and keeps its last value on screen.
 * `null` in the other keys (`defaultValue`) always becomes `undefined`.
 */
export function castNullableField<T>(
  props: T,
  keys: string[],
  type?: string,
  cast?: (k: any) => any,
  emptyValue?: unknown,
): T {
  props = { ...props };

  keys.forEach((key, index) => {
    if (props[key] === null) {
      props[key] = index === 0 ? emptyValue : undefined;
    }

    if (type && cast && props[key] != null && typeof props[key] != type) {
      props[key] = cast(props[key]);

      console.warn(
        'Wrong value type in',
        props,
        'in keys',
        JSON.stringify(keys),
      );
    }
  });

  return props;
}

// Values are intentionally permissive: the helpers above coerce input models.
// A generic indexed access unioned with `any` has the same type, but declaration
// emit can inline its type parameter outside the generic scope.
export type WithNullableValue<T extends Props> = Omit<
  T,
  'value' | 'defaultValue'
> & {
  value?: any;
  defaultValue?: any;
};

export type WithNullableSelected<T extends Props> = Omit<
  T,
  'isSelected' | 'defaultSelected'
> & {
  isSelected?: any;
  defaultSelected?: any;
};

export type WithNullableSelectedKey<T extends Props> = Omit<
  T,
  'selectedKey' | 'defaultSelectedKey'
> & {
  selectedKey?: any;
  defaultSelectedKey?: any;
};
