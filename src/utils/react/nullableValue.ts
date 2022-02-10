import { Props } from '../../components/types';

export function castNullableValue(props, keys = ['value', 'defaultValue']) {
  keys.forEach((key) => {
    if (props[key] === null) {
      props[key] = undefined;
    }

    if (props[key] != null && typeof props[key] != 'string') {
      props[key] = String(props[key]);

      console.warn(
        'Wrong value type in',
        props,
        'in keys',
        JSON.stringify(keys),
      );
    }
  });
}

export type WithNullableValue<T extends Props> = Omit<
  T,
  'value' | 'defaultValue'
> & {
  value?: T['value'] | any;
  defaultValue?: T['defaultValue'] | any;
};
