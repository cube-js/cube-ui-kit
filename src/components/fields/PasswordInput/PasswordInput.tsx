import { ForwardedRef, forwardRef, useCallback, useRef, useState } from 'react';
import { useTextField } from 'react-aria';

import { useI18n } from '../../../i18n';
import { EyeIcon } from '../../../icons/EyeIcon';
import { EyeInvisibleIcon } from '../../../icons/EyeInvisibleIcon';
import { chain, mergeProps, useBufferedValue } from '../../../utils/react';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { ItemAction, ItemActionProvider } from '../../actions';
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
    inputProps: userInputProps,
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
      {/*
        The disabled state travels through the provider rather than as a prop on
        the action. Both disable it, but the provider marks the state as
        INHERITED from the field, and `current` paints from the colour it
        inherits — which a disabled field has already faded — so a second fade
        would multiply the two down to roughly a tenth opacity. No `type` is
        passed, so the `context` mod stays off and the toggle keeps its margins.
      */}
      <ItemActionProvider isDisabled={rest.isDisabled}>
        <ItemAction
          // No `type` — the default `current` type inherits the input's own text
          // color, so the toggle follows the field's theme, validation state and
          // disabled state rather than staying opaque against faded text.
          tooltip={t('passwordInput.toggleMasking', 'Toggle masking')}
          icon={type === 'password' ? <EyeInvisibleIcon /> : <EyeIcon />}
          onPress={toggleType}
        />
      </ItemActionProvider>
    </>
  );

  return (
    <TextInputBase
      ref={ref}
      labelProps={mergedLabelProps}
      inputProps={mergeProps(
        inputProps,
        { 'data-input-type': 'passwordinput' },
        userInputProps,
      )}
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
