import React, { forwardRef, useEffect, useState, useRef } from 'react';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { Action } from '../../components/Action';
import { Base } from '../../components/Base';
import { Space } from '../../components/Space';
import { useFocus, useHover } from '@react-aria/interactions';
import { useSearchFieldState } from '@react-stately/searchfield';
import { useSearchField } from '@react-aria/searchfield';
import { useButton } from '@react-aria/button';
import { mergeProps } from '@react-aria/utils';
import { useCombinedRefs } from '../../utils/react/useCombinedRefs';

const FIELD_STYLES = {
  outline: {
    '': '#purple-03.0',
    focused: '#purple-03',
  },
  border: {
    '': true,
    disabled: '#clear',
  },
  radius: true,
  padding: '0 1x',
  color: {
    '': '#dark.85',
    disabled: '#dark.30',
  },
  fill: {
    '': '#clear',
    disabled: '#dark.04',
  },
};

const STYLES = {
  reset: 'input',
  display: 'block',
  width: 'initial 100% initial',
  height: 'initial initial initial',
  fontWeight: 400,
  size: 'input',
  color: {
    '': '#dark.85',
    disabled: '#dark.30',
  },
  fill: '#clear',
  border: 0,
  padding: '1x 0',
  grow: 1,
};

export const SearchField = forwardRef(
  (
    {
      isClearable,
      styles,
      isDisabled,
      validationState,
      onSubmit,
      onChange,
      isRequired,
      isReadOnly,
      value,
      ...props
    },
    ref,
  ) => {
    const localRef = useRef();
    const combinedRef = useCombinedRefs(ref, localRef);
    const propsForField = {
      onSubmit,
      onChange,
      isDisabled,
      isRequired,
      isReadOnly,
      validationState,
    };

    useEffect(() => {
      const el = combinedRef && combinedRef.current;

      if (el && value != null && el.value !== value) {
        el.value = value;
      }
    }, [combinedRef, value]);

    let state = useSearchFieldState(propsForField);
    let { inputProps, clearButtonProps } = useSearchField(
      propsForField,
      state,
      combinedRef,
    );
    let { buttonProps } = useButton(clearButtonProps);
    let [isFocused, setIsFocused] = useState(false);
    let { focusProps } = useFocus({
      onFocusChange: setIsFocused,
      elementType: 'input',
    });
    let { hoverProps, isHovered } = useHover({});

    useEffect(() => {
      setIsFocused(false);
    }, [isDisabled]);

    return (
      <Space
        gap={0}
        data-is-focused={isFocused && !isDisabled ? '' : null}
        data-is-disabled={isDisabled ? '' : null}
        styles={{
          ...FIELD_STYLES,
          ...(styles || {}),
        }}
        {...props}
      >
        {isClearable ? <SearchOutlined /> : null}
        <Base
          as="input"
          data-is-hovered={isHovered && !isDisabled ? '' : null}
          data-is-disabled={isDisabled || null}
          {...mergeProps(inputProps, hoverProps, focusProps)}
          ref={combinedRef}
          styles={{
            ...STYLES,
            radius: state.value !== '' ? '1r 0 0 1r' : '1r',
            margin: isClearable ? '1x left' : 0,
          }}
          aria-label="Search field"
        />
        {state.value !== '' && isClearable ? (
          <Action
            type="item"
            padding=".5x"
            color={{ '': '#dark.85', hovered: '#purple-text' }}
            props={buttonProps}
          >
            <CloseOutlined />
          </Action>
        ) : null}
        {!isClearable ? <SearchOutlined /> : null}
      </Space>
    );
  },
);
