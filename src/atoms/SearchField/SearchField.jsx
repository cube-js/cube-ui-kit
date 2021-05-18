import React, { forwardRef, useEffect, useState, useRef } from 'react';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import Action from '../../components/Action';
import Base from '../../components/Base';
import Space from '../../components/Space';
import { useFocus, useHover } from '@react-aria/interactions';
import { useSearchFieldState } from '@react-stately/searchfield';
import { useSearchField } from '@react-aria/searchfield';
import { useButton } from '@react-aria/button';
import { mergeProps } from '@react-aria/utils';

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

export default forwardRef(
  (
    {
      clearable,
      styles,
      disabled,
      validationState,
      onSubmit,
      onChange,
      required,
      readOnly,
      ...props
    },
    ref,
  ) => {
    // const localRef = useRef(null);
    // const combinedRef = useCombinedRefs(ref, localRef);
    const propsForField = {
      onSubmit,
      onChange,
      isDisabled: disabled,
      isRequired: required,
      isReadOnly: readOnly,
      validationState,
    };

    let state = useSearchFieldState(propsForField);
    let { inputProps, clearButtonProps } = useSearchField(
      propsForField,
      state,
      ref,
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
    }, [disabled]);

    return (
      <Space
        gap={0}
        data-is-focused={isFocused && !disabled ? '' : null}
        data-is-disabled={disabled ? '' : null}
        styles={{
          ...FIELD_STYLES,
          ...(styles || {}),
        }}
        {...props}
      >
        {clearable ? <SearchOutlined /> : null}
        <Base
          as="input"
          data-is-hovered={isHovered && !disabled ? '' : null}
          data-is-disabled={disabled || null}
          {...mergeProps(inputProps, hoverProps, focusProps)}
          ref={ref}
          styles={{
            ...STYLES,
            radius: state.value !== '' ? '1r 0 0 1r' : '1r',
            margin: clearable ? '1x left' : 0,
          }}
          aria-label="Search field"
        />
        {state.value !== '' && clearable ? (
          <Action
            type="item"
            padding=".5x"
            color={{ '': '#dark.85', hovered: '#purple-text' }}
            {...buttonProps}
          >
            <CloseOutlined />
          </Action>
        ) : null}
        {!clearable ? <SearchOutlined /> : null}
      </Space>
    );
  },
);
