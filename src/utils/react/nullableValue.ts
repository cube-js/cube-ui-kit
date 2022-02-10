import { Props } from '../../components/types';

export function castNullableStringValue<T>(props: T): T {
  return castNullableField(props, ['value', 'defaultValue'], 'string', (v) =>
    String(v),
  );
}

export function castNullableNumberValue<T>(props: T): T {
  return castNullableField(props, ['value', 'defaultValue'], 'number', (v) =>
    Number(v),
  );
}

export function castNullableIsSelected<T>(props: T): T {
  return castNullableField(
    props,
    ['isSelected', 'defaultSelected'],
    'boolean',
    (v) => !!v,
  );
}

export function castNullableSelectedKey<T>(props: T): T {
  return castNullableField(props, ['selectedKey', 'defaultSelectedKey']);
}

export function castNullableField<T>(
  props: T,
  keys: string[],
  type?: string,
  cast?: (k: any) => any,
): T {
  props = { ...props };

  keys.forEach((key) => {
    if (props[key] === null) {
      props[key] = undefined;
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

export type WithNullableValue<T extends Props> = Omit<
  T,
  'value' | 'defaultValue'
> & {
  value: T['value'] | any;
  defaultValue: T['defaultValue'] | any;
};

export type WithNullableSelected<T extends Props> = Omit<
  T,
  'isSelected' | 'defaultSelected'
> & {
  isSelected: T['isSelected'] | any;
  defaultSelected: T['defaultSelected'] | any;
};

export type WithNullableSelectedKey<T extends Props> = Omit<
  T,
  'selectedKey' | 'defaultSelectedKey'
> & {
  selectedKey: T['selectedKey'] | any;
  defaultSelectedKey: T['defaultSelectedKey'] | any;
};
