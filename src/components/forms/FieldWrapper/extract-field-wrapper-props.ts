import { CubeFieldWrapperProps } from './types';

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

type UnionToOvlds<U> = UnionToIntersection<
  U extends any ? (f: U) => void : never
>;

type PopUnion<U> = UnionToOvlds<U> extends (a: infer A) => void ? A : never;
type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true;

type UnionToArray<T, A extends unknown[] = []> = IsUnion<T> extends true
  ? UnionToArray<Exclude<T, PopUnion<T>>, [PopUnion<T>, ...A]>
  : [T, ...A];

const createFieldWrapperPropsKeys = <
  PropKeys = UnionToArray<keyof CubeFieldWrapperProps>,
>(
  arr: PropKeys,
): Set<string> => new Set(arr as unknown as string[]);

const fieldWrapperPropsKeys = createFieldWrapperPropsKeys([
  'as',
  'validationState',
  'styles',
  'isRequired',
  'isDisabled',
  'fieldProps',
  'isHidden',
  'label',
  'labelPosition',
  'labelSuffix',
  'labelStyles',
  'labelProps',
  'description',
  'requiredMark',
  'tooltip',
  'extra',
  'necessityLabel',
  'necessityIndicator',
  'message',
  'messageStyles',
  'Component',
]);

export function extractFieldWrapperProps<
  Props extends CubeFieldWrapperProps,
  FieldWrapperKeys extends keyof CubeFieldWrapperProps = keyof CubeFieldWrapperProps,
  ActualWrapperProps extends {
    [K in keyof Pick<
      Props,
      keyof CubeFieldWrapperProps
    >]: CubeFieldWrapperProps[K];
  } = {
    [K in keyof Pick<
      Props,
      keyof CubeFieldWrapperProps
    >]: CubeFieldWrapperProps[K];
  },
  RestProps extends Omit<Props, FieldWrapperKeys> = Omit<
    Props,
    FieldWrapperKeys
  >,
>(
  props: Props,
): Readonly<{ fieldWrapperProps: ActualWrapperProps; rest: RestProps }> {
  const fieldWrapperProps = {} as ActualWrapperProps;
  const rest = {} as RestProps;

  for (const [key, prop] of Object.entries(props)) {
    if (fieldWrapperPropsKeys.has(key)) {
      fieldWrapperProps[key] = prop;
    } else {
      rest[key] = prop;
    }
  }

  return { fieldWrapperProps, rest } as const;
}
