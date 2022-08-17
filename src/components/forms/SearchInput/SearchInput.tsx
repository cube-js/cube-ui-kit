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

export interface CubeSearchInputProps extends CubeTextInputBaseProps {
  /** Whether the search input is clearable using ESC keyboard button or clear button inside the input */
  isClearable?: boolean;
}

export const SearchInput = forwardRef(
  (props: WithNullableValue<CubeSearchInputProps>, ref) => {
    props = castNullableStringValue(props);
    props = useProviderProps(props);

    let { isClearable, value } = props;

    const localRef = useRef(null);
    const combinedRef = useCombinedRefs(ref, localRef);
    let inputRef = useRef(null);

    useEffect(() => {
      const el = combinedRef && combinedRef.current;

      if (el && value != null && el.value !== value) {
        el.value = value;
      }
    }, [combinedRef, value]);

    let state = useSearchFieldState(props);
    let { inputProps, clearButtonProps } = useSearchField(
      props,
      state,
      inputRef,
    );

    return (
      <TextInputBase
        inputProps={inputProps}
        ref={ref}
        inputRef={inputRef}
        inputStyles={{ paddingRight: '4x' }}
        type="search"
        icon={<SearchOutlined />}
        suffixPosition="after"
        suffix={
          isClearable &&
          state.value !== '' &&
          !props.isReadOnly && (
            <Button
              type="clear"
              {...ariaToCubeButtonProps(clearButtonProps)}
              color={{
                '': '#dark.50',
                'hovered | pressed': '#purple-text',
              }}
              radius="right (1r - 1bw)"
              padding="0 1x"
              height="auto"
              placeSelf="stretch"
              icon={<CloseOutlined />}
            />
          )
        }
        {...props}
      />
    );
  },
);
