import { forwardRef, useRef } from 'react';
import { SearchFieldProps, useSearchFieldState } from 'react-stately';
import { useSearchField } from 'react-aria';

import { CubeTextInputBaseProps, TextInputBase } from '../TextInput';
import { useProviderProps } from '../../../provider';
import { Button } from '../../actions';
import { ariaToCubeButtonProps } from '../../../utils/react/mapProps';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { tasty } from '../../../tasty';
import { CloseIcon, SearchIcon } from '../../../icons';

export { useSearchFieldState, useSearchField };
export type { SearchFieldProps };

export interface CubeSearchInputProps
  extends CubeTextInputBaseProps,
    SearchFieldProps {
  /** Whether the search input is clearable using ESC keyboard button or clear button inside the input */
  isClearable?: boolean;
}

const ClearButton = tasty(Button, {
  icon: <CloseIcon />,
  styles: {
    radius: 'right (1r - 1bw)',
    width: '4x',
    height: 'auto',
    placeSelf: 'stretch',
  },
});

export const SearchInput = forwardRef(function SearchInput(
  props: WithNullableValue<CubeSearchInputProps>,
  ref,
) {
  props = castNullableStringValue(props);
  props = useProviderProps(props);

  let { isClearable, validationState } = props;

  let inputRef = useRef(null);

  let state = useSearchFieldState(props);
  let { inputProps, clearButtonProps } = useSearchField(props, state, inputRef);
  let showClearButton = isClearable && state.value !== '' && !props.isReadOnly;

  return (
    <TextInputBase
      ref={ref}
      inputProps={inputProps}
      inputRef={inputRef}
      type="search"
      icon={<SearchIcon />}
      suffixPosition="after"
      {...props}
      suffix={
        props.suffix || showClearButton ? (
          <>
            {props.suffix}
            {showClearButton && (
              <ClearButton
                type={validationState === 'invalid' ? 'clear' : 'neutral'}
                theme={validationState === 'invalid' ? 'danger' : undefined}
                {...ariaToCubeButtonProps(clearButtonProps)}
              />
            )}
          </>
        ) : undefined
      }
    />
  );
});
