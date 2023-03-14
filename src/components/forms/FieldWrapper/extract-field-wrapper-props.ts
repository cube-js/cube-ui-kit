import { CubeFieldWrapperProps } from './types';

const createFieldWrapperPropsKeys = <
  PropKeys = (keyof CubeFieldWrapperProps)[],
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

type WrapperProps<Props extends CubeFieldWrapperProps> = {
  [K in keyof Pick<
    Props,
    keyof CubeFieldWrapperProps
  >]: CubeFieldWrapperProps[K];
};

export function extractFieldWrapperProps<
  Props extends CubeFieldWrapperProps,
  FieldWrapperKeys extends keyof CubeFieldWrapperProps = keyof CubeFieldWrapperProps,
  ActualWrapperProps extends WrapperProps<Props> = WrapperProps<Props>,
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
