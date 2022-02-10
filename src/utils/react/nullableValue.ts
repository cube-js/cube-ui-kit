import { Props } from '../../components/types';

export function castNullableValue<
  T extends {
    value?: any;
    defaultValue?: any;
  },
>(
  props: T,
): Omit<T, 'value' | 'defaultValue'> & {
  value: Exclude<Props['value'], null>;
  defaultValue: Exclude<Props['defaultValue'], null>;
} {
  if (props.value === null) {
    props.value = undefined;
  }

  if (props.defaultValue === null) {
    props.defaultValue = undefined;
  }

  return props as Omit<T, 'value' | 'defaultValue'> & {
    value: Exclude<Props['value'], null>;
    defaultValue: Exclude<Props['defaultValue'], null>;
  };
}

export type WithNullableValue<T extends Props> = Omit<
  T,
  'value' | 'defaultValue'
> & {
  value?: T['value'] | null;
  defaultValue?: T['defaultValue'] | null;
};
