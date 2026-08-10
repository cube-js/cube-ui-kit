import { ForwardedRef, forwardRef, useCallback, useRef, useState } from 'react';
import { useTextField } from 'react-aria';

import { useI18n } from '../../../i18n';
import { EyeIcon, EyeInvisibleIcon } from '../../../icons';
import { chain, mergeProps, useBufferedValue } from '../../../utils/react';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { ItemAction } from '../../actions';
import { useFieldProps } from '../../form';
import {
  CubeBufferedValueProps,
  CubeTextInputBaseProps,
  TextInputBase,
} from '../TextInput';

export interface CubePasswordInputProps
  extends WithNullableValue<CubeTextInputBaseProps>,
    CubeBufferedValueProps {}

function PasswordInput(
  props: CubePasswordInputProps,
  ref: ForwardedRef<HTMLElement>,
) {
  const { t } = useI18n();

  props = castNullableStringValue(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onBlur',
    valuePropsMapper: ({ value, onChange }) => ({
      value: value?.toString() ?? '',
      onChange,
    }),
  });

  let [type, setType] = useState('password');
  let {
    labelProps: userLabelProps,
    suffix,
    multiLine,
    inputRef: propsInputRef,
    isBuffered,
    ...rest
  } = props;
  let localInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  let inputRef = propsInputRef ?? localInputRef;

  // Hold the typed text locally until the controlled value catches up — see `useBufferedValue`.
  let buffered = useBufferedValue(rest.value, rest.onChange, {
    isBuffered,
    isDisabled: rest.isDisabled,
    isReadOnly: rest.isReadOnly,
  });

  let { labelProps, inputProps } = useTextField(
    {
      ...rest,
      value: buffered.value,
      onChange: buffered.onChange,
      onBlur: chain(rest.onBlur, buffered.reset),
      type,
    },
    inputRef,
  );

  // Merge user-provided labelProps with aria labelProps
  const mergedLabelProps = mergeProps(labelProps, userLabelProps);

  const toggleType = useCallback(() => {
    setType((type) => (type === 'password' ? 'text' : 'password'));
  }, []);

  const wrappedSuffix = (
    <>
      {suffix}
      <ItemAction
        type="clear"
        tooltip={t('passwordInput.toggleMasking', 'Toggle masking')}
        icon={type === 'password' ? <EyeInvisibleIcon /> : <EyeIcon />}
        onPress={toggleType}
      />
    </>
  );

  return (
    <TextInputBase
      ref={ref}
      labelProps={mergedLabelProps}
      inputProps={{ ...inputProps, 'data-input-type': 'passwordinput' }}
      inputRef={inputRef}
      inputStyles={{ paddingRight: '4x' }}
      type={type}
      suffixPosition="after"
      suffix={wrappedSuffix}
      multiLine={multiLine}
      {...rest}
    />
  );
}

/**
 * PasswordInputs are password inputs that allow users to input passwords or code entries
 * with a keyboard. Various decorations can be displayed around the field to
 * communicate the entry requirements.
 */
const _PasswordInput = forwardRef(PasswordInput);

(_PasswordInput as any).cubeInputType = 'Text';
_PasswordInput.displayName = 'PasswordInput';

export { _PasswordInput as PasswordInput };
