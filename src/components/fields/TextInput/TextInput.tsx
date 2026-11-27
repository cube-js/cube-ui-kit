import { ForwardedRef, forwardRef, RefObject, useRef } from 'react';
import { AriaTextFieldProps, useTextField } from 'react-aria';

import { chain } from '../../../utils/react/chain';
import { mergeProps } from '../../../utils/react/merge-props';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullable-value';
import { withOverlayKeys } from '../../../utils/react/overlay-key-propagation';
import { useBufferedValue } from '../../../utils/react/use-buffered-value';
import { useFieldProps } from '../../form/Form/use-field/use-field-props';

import { useDisplayedValidation } from './displayed-validation';
import { getIdentifierTextServices } from './identifier-text-services';
import { getPasswordManagerIgnoreProps } from './password-manager-ignore';
import {
  CubeBufferedValueProps,
  CubeIdentifierInputProps,
  CubePasswordManagerIgnoreProps,
  CubeTextInputBaseProps,
  TextInputBase,
} from './TextInputBase';

import type {
  FieldBaseProps,
  TextFieldKeyboardProps,
} from '../../../shared/form';

export type CubeTextInputProps = WithNullableValue<
  Omit<CubeTextInputBaseProps, 'validate'>
> &
  CubeBufferedValueProps &
  CubeIdentifierInputProps &
  CubePasswordManagerIgnoreProps &
  TextFieldKeyboardProps & {
    field?: FieldBaseProps<string | null | undefined>['field'];
    validate?: AriaTextFieldProps['validate'];
  };

export { useTextField };

export const TextInput = forwardRef(function TextInput(
  rawProps: CubeTextInputProps,
  ref: ForwardedRef<HTMLElement>,
) {
  rawProps = castNullableStringValue(rawProps);
  let props = useFieldProps(rawProps, {
    defaultValidationTrigger: 'onBlur',
    showsValidateErrors: true,
    valuePropsMapper: ({ value, onChange }) => ({
      onChange,
      value: value?.toString() ?? '',
    }),
  });

  let {
    labelProps: userLabelProps,
    inputProps: userInputProps,
    inputRef: propsInputRef,
    form,
    isBuffered,
    isIdentifier,
    ignorePasswordManagers,
    ...restProps
  } = props;
  let localInputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  let inputRef = propsInputRef ?? localInputRef;

  // Hold the typed text locally until the controlled value catches up, so a parent that echoes it
  // back a render late can't overwrite the DOM node and throw the caret to the end.
  let buffered = useBufferedValue(restProps.value, restProps.onChange, {
    isBuffered,
    isDisabled: restProps.isDisabled,
    isReadOnly: restProps.isReadOnly,
  });

  let displayedValidation = useDisplayedValidation();
  let { labelProps, inputProps, ...validation } = useTextField(
    displayedValidation.trackTouched({
      ...restProps,
      ...getIdentifierTextServices(isIdentifier, restProps),
      value: buffered.value,
      onChange: buffered.onChange,
      onBlur: chain(restProps.onBlur, buffered.reset),
      onKeyDown: withOverlayKeys(restProps.onKeyDown),
      inputElementType: restProps.multiLine ? 'textarea' : 'input',
    }),
    inputRef as RefObject<HTMLInputElement | null>,
  );

  // Merge user-provided labelProps with aria labelProps
  const mergedLabelProps = mergeProps(labelProps, userLabelProps);

  return (
    <TextInputBase
      {...restProps}
      {...displayedValidation.getDisplayedValidation(restProps, validation)}
      ref={ref}
      labelProps={mergedLabelProps}
      inputProps={mergeProps(
        inputProps,
        getPasswordManagerIgnoreProps(ignorePasswordManagers),
        userInputProps,
      )}
      inputRef={inputRef}
    />
  );
});

/**
 * TextInputs are text inputs that allow users to input custom text entries
 * with a keyboard. Various decorations can be displayed around the field to
 * communicate the entry requirements.
 */

(TextInput as any).cubeInputType = 'Text';
