import { ForwardedRef, forwardRef, RefObject, useRef, useState } from 'react';
import { AriaTextFieldProps, useTextField } from 'react-aria';

import { useI18n } from '../../../i18n';
import { EyeIcon } from '../../../icons/EyeIcon';
import { EyeInvisibleIcon } from '../../../icons/EyeInvisibleIcon';
import { chain, mergeProps, useBufferedValue } from '../../../utils/react';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { ItemAction } from '../../actions/ItemAction/ItemAction';
import { ItemActionProvider } from '../../actions/ItemActionContext';
import { useFieldProps } from '../../form';
import { useDisplayedValidation } from '../TextInput/displayed-validation';
import {
  CubeBufferedValueProps,
  CubeTextInputBaseProps,
  TextInputBase,
} from '../TextInput/TextInputBase';

import type { TextFieldKeyboardProps } from '../../../shared/form';

export interface CubePasswordInputProps
  extends WithNullableValue<Omit<CubeTextInputBaseProps, 'validate'>>,
    CubeBufferedValueProps,
    TextFieldKeyboardProps {
  validate?: AriaTextFieldProps['validate'];
}

function PasswordInput(
  rawProps: CubePasswordInputProps,
  ref: ForwardedRef<HTMLElement>,
) {
  const { t } = useI18n();

  rawProps = castNullableStringValue(rawProps);
  let props = useFieldProps(rawProps, {
    defaultValidationTrigger: 'onBlur',
    showsValidateErrors: true,
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
    // The form instance, not the DOM `form` id `useTextField` forwards.
    form,
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

  let displayedValidation = useDisplayedValidation();
  let { labelProps, inputProps, ...validation } = useTextField(
    displayedValidation.trackTouched({
      ...rest,
      value: buffered.value,
      onChange: buffered.onChange,
      onBlur: chain(rest.onBlur, buffered.reset),
      type,
    }),
    inputRef as RefObject<HTMLInputElement | null>,
  );

  // Merge user-provided labelProps with aria labelProps
  const mergedLabelProps = mergeProps(labelProps, userLabelProps);

  const toggleType = () => {
    setType((type) => (type === 'password' ? 'text' : 'password'));
  };

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
          // A toggle button keeps one name and reports its state with
          // `aria-pressed`: pressed means the password is shown.
          tooltip={t('passwordInput.showPassword', 'Show password')}
          aria-pressed={type === 'text'}
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
      {...displayedValidation.getDisplayedValidation(rest, validation)}
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
