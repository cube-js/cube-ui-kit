import { forwardRef, useRef } from 'react';
import { useSearchField } from 'react-aria';
import { SearchFieldProps, useSearchFieldState } from 'react-stately';

import { CloseIcon, SearchIcon } from '../../../icons';
import { useProviderProps } from '../../../provider';
import { ariaToCubeButtonProps } from '../../../utils/react/mapProps';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { ItemAction } from '../../actions';
import { CubeTextInputBaseProps, TextInputBase } from '../TextInput';

export { useSearchFieldState, useSearchField };
export type { SearchFieldProps };

export interface CubeSearchInputProps
  extends CubeTextInputBaseProps,
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
  props = useProviderProps(props);

  let {
    isClearable,
    validationState,
    onClear,
    labelProps: userLabelProps,
    ...restProps
  } = props;

  let inputRef = useRef(null);

  let state = useSearchFieldState(restProps);
  let { labelProps, inputProps, clearButtonProps } = useSearchField(
    restProps,
    state,
    inputRef,
  );
  let showClearButton =
    isClearable && state.value !== '' && !restProps.isReadOnly;

  // Merge user-provided labelProps with aria labelProps
  const mergedLabelProps = { ...labelProps, ...userLabelProps };

  return (
    <TextInputBase
      ref={ref}
      labelProps={mergedLabelProps}
      inputProps={{ ...inputProps, 'data-input-type': 'searchinput' }}
      inputRef={inputRef}
      type="search"
      icon={<SearchIcon />}
      suffixPosition="after"
      validationState={validationState}
      {...restProps}
      suffix={
        restProps.suffix || showClearButton ? (
          <>
            {restProps.suffix}
            {showClearButton && (
              <ItemAction
                icon={<CloseIcon />}
                size={restProps.size}
                type={validationState === 'invalid' ? 'clear' : 'neutral'}
                theme={validationState === 'invalid' ? 'danger' : undefined}
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
