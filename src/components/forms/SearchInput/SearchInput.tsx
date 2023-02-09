import { forwardRef, useEffect, useRef } from 'react';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { useSearchFieldState } from '@react-stately/searchfield';
import { useSearchField } from '@react-aria/searchfield';

import { useCombinedRefs } from '../../../utils/react';
import {
  CubeTextInputBaseProps,
  TextInputBase,
} from '../TextInput/TextInputBase';
import { useProviderProps } from '../../../provider';
import { Button } from '../../actions';
import { ariaToCubeButtonProps } from '../../../utils/react/mapProps';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { tasty } from '../../../tasty';

export interface CubeSearchInputProps extends CubeTextInputBaseProps {
  /** Whether the search input is clearable using ESC keyboard button or clear button inside the input */
  isClearable?: boolean;
}

const ClearButton = tasty(Button, {
  icon: <CloseOutlined />,
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

  let { isClearable, value, validationState } = props;

  const localRef = useRef(null);
  const combinedRef = useCombinedRefs(ref, localRef);
  let inputRef = useRef(null);

  useEffect(() => {
    const el = combinedRef && combinedRef.current;

    if (el && el.value !== value) {
      if (value) {
        el.value = value;
      } else {
        el.value = '';
      }
    }
  }, [combinedRef, value]);

  let state = useSearchFieldState(props);
  let { inputProps, clearButtonProps } = useSearchField(props, state, inputRef);

  return (
    <TextInputBase
      ref={ref}
      inputProps={inputProps}
      inputRef={inputRef}
      type="search"
      icon={<SearchOutlined />}
      suffixPosition="after"
      suffix={
        isClearable &&
        state.value !== '' &&
        !props.isReadOnly && (
          <ClearButton
            type={validationState === 'invalid' ? 'clear' : 'neutral'}
            theme={validationState === 'invalid' ? 'danger' : undefined}
            {...ariaToCubeButtonProps(clearButtonProps)}
          />
        )
      }
      {...props}
    />
  );
});
