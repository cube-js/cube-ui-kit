import { Props } from '../../components/types';

export function castNullableValue<T>(
  props,
  keys = ['value', 'defaultValue'],
  type = 'string',
  cast = (v) => String(v),
): T {
  props = { ...props };

  keys.forEach((key) => {
    if (props[key] === null) {
      props[key] = undefined;
    }

    if (props[key] != null && typeof props[key] != type) {
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
  value?: T['value'] | any;
  defaultValue?: T['defaultValue'] | any;
};
