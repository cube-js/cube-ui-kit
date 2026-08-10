import { forwardRef, useRef } from 'react';
import { useSearchField } from 'react-aria';
import { SearchFieldProps, useSearchFieldState } from 'react-stately';

import { CloseIcon, SearchIcon } from '../../../icons';
import { useProviderProps } from '../../../provider';
import { chain, mergeProps, useBufferedValue } from '../../../utils/react';
import { ariaToCubeButtonProps } from '../../../utils/react/mapProps';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { ItemAction } from '../../actions';
import { getValidationTheme, useValidationProps } from '../../form';
import { CubeTextInputBaseProps, TextInputBase } from '../TextInput';

export { useSearchFieldState, useSearchField };
export type { SearchFieldProps };

export interface CubeSearchInputProps
  extends Omit<
      CubeTextInputBaseProps,
      // SearchInput is not form-connected: it holds no persistent value, so
      // form-binding and form-validation props are excluded from the public API.
      | 'name'
      | 'form'
      | 'rules'
      | 'shouldUpdate'
      | 'validationDelay'
      | 'validateTrigger'
      | 'insideForm'
      | 'idPrefix'
    >,
    SearchFieldProps {
  /** Whether the search input is clearable using ESC keyboard button or clear button inside the input */
  isClearable?: boolean;
  /** Callback called when the clear button is pressed */
  onClear?: () => void;
}

export const SearchInput = forwardRef(function SearchInput(
  props: WithNullableValue<CubeSearchInputProps>,
  ref,
) {
  props = castNullableStringValue(props);
  // SearchInput is a standalone control, not a form field, so it does not use `useFieldProps`.
  props = useProviderProps(props);
  props = useValidationProps(props);

  let {
    isClearable,
    isInvalid,
    isValid,
    onClear,
    labelProps: userLabelProps,
    isBuffered,
    ...restProps
  } = props;

  let inputRef = useRef(null);

  // Hold the typed text locally until the controlled value catches up — see `useBufferedValue`.
  // Applied before the state hook, so `state.value` (and the clear button) follow the draft.
  let buffered = useBufferedValue(restProps.value, restProps.onChange, {
    isBuffered,
    isDisabled: restProps.isDisabled,
    isReadOnly: restProps.isReadOnly,
  });
  let fieldProps = {
    ...restProps,
    value: buffered.value,
    onChange: buffered.onChange,
    onBlur: chain(restProps.onBlur, buffered.reset),
  };

  let state = useSearchFieldState(fieldProps);
  let { labelProps, inputProps, clearButtonProps } = useSearchField(
    fieldProps,
    state,
    inputRef,
  );
  let showClearButton =
    isClearable && state.value !== '' && !restProps.isReadOnly;

  // Merge user-provided labelProps with aria labelProps
  const mergedLabelProps = mergeProps(labelProps, userLabelProps);

  return (
    <TextInputBase
      ref={ref}
      labelProps={mergedLabelProps}
      inputProps={{ ...inputProps, 'data-input-type': 'searchinput' }}
      inputRef={inputRef}
      type="search"
      icon={<SearchIcon />}
      suffixPosition="after"
      isInvalid={isInvalid}
      isValid={isValid}
      {...restProps}
      suffix={
        restProps.suffix || showClearButton ? (
          <>
            {restProps.suffix}
            {showClearButton && (
              <ItemAction
                icon={<CloseIcon />}
                size={restProps.size}
                type="clear"
                theme={getValidationTheme(undefined, { isInvalid, isValid })}
                {...ariaToCubeButtonProps(clearButtonProps)}
                onPress={(e) => {
                  // Call the original clear functionality
                  clearButtonProps.onPress?.();
                  // Call the onClear callback
                  onClear?.();
                }}
              />
            )}
          </>
        ) : undefined
      }
    />
  );
});
