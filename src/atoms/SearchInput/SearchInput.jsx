import React, { forwardRef, useEffect, useRef } from 'react';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { useSearchFieldState } from '@react-stately/searchfield';
import { useSearchField } from '@react-aria/searchfield';
import { useCombinedRefs } from '../../utils/react/useCombinedRefs';
import { TextInputBase } from '../TextInput/TextInputBase';
import { useProviderProps } from '../../provider';
import { Button } from '../Button/Button';

export const SearchInput = forwardRef((props, ref) => {
  props = useProviderProps(props);

  let { isClearable, value } = props;

  const localRef = useRef();
  const combinedRef = useCombinedRefs(ref, localRef);
  let inputRef = useRef();

  useEffect(() => {
    const el = combinedRef && combinedRef.current;

    if (el && value != null && el.value !== value) {
      el.value = value;
    }
  }, [combinedRef, value]);

  let state = useSearchFieldState(props);
  let { inputProps, clearButtonProps } = useSearchField(props, state, inputRef);

  return (
    <TextInputBase
      inputProps={inputProps}
      ref={ref}
      inputRef={inputRef}
      inputStyles={{ paddingRight: '4x' }}
      type="search"
      prefix={<SearchOutlined />}
      suffixPosition="after"
      suffix={
        isClearable &&
        state.value !== '' &&
        !props.isReadOnly && (
          <Button
            type="clear"
            {...clearButtonProps}
            color={{
              '': '#dark.50',
              'hovered | pressed': '#purple-text',
            }}
            radius="right (1r - 1bw)"
            padding=".5x 1x"
            place="stretch"
            icon={<CloseOutlined />}
          />
        )
      }
      {...props}
    />
  );
});
