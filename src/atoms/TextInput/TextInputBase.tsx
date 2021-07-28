import {
  WarningOutlined,
  CheckOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { createFocusableRef } from '@react-spectrum/utils';
import { mergeProps } from '@react-aria/utils';
import { cloneElement, forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useFormProps } from '../Form/Form';
import { useHover } from '@react-aria/interactions';
import { useProviderProps } from '../../provider';
import { Base } from '../../components/Base';
import { extractStyles } from '../../utils/styles';
import { BLOCK_STYLES, POSITION_STYLES } from '../../styles/list';
import { useFocus } from '../../utils/interactions';
import { Prefix } from '../../components/Prefix';
import { Suffix } from '../../components/Suffix';
import { useContextStyles } from '../../providers/Styles';
import { modAttrs } from '../../utils/react/modAttrs';
import { FieldWrapper } from '../../components/FieldWrapper';
import { Space } from '../../components/Space';
import { Block } from '../../components/Block';

const WRAPPER_STYLES = {
  display: 'grid',
  position: 'relative',
};

export const DEFAULT_INPUT_STYLES = {
  display: 'block',
  width: 'initial 100% initial',
  height: 'initial initial initial',
  color: {
    '': '#dark.85',
    invalid: '#danger-text',
    focused: '#dark.85',
    disabled: '#dark.30',
  },
  fill: {
    '': '#clear',
    disabled: '#dark.04',
  },
  border: {
    '': true,
    focused: true,
    valid: '#success-text.50',
    invalid: '#danger-text.50',
    disabled: true,
  },
  outline: {
    '': '#purple-03.0',
    focused: '#purple-03',
    'invalid & focused': '#danger.50',
    'valid & focused': '#success.50',
  },
  radius: true,
  padding: '(1.25x - 1bw) (1.5x - 1bw)',
  fontWeight: 400,
  textAlign: 'left',
  reset: 'input',
  size: 'input',
  grow: 1,
  margin: 0,
};

function TextInputBase(props, ref) {
  props = useProviderProps(props);
  props = useFormProps(props);

  let {
    qa,
    label,
    labelPosition = 'top',
    labelStyles,
    isRequired,
    necessityIndicator,
    validationState,
    message,
    prefix,
    isDisabled,
    multiLine,
    autoFocus,
    labelProps,
    inputProps,
    wrapperProps,
    inputRef,
    isLoading,
    loadingIndicator,
    insideForm,
    value,
    inputStyles = {},
    wrapperStyles = {},
    suffix,
    suffixPosition = 'before',
    wrapperRef,
    requiredMark = true,
    rows = 1,
    ...otherProps
  } = props;
  let [suffixWidth, setSuffixWidth] = useState(0);
  let [prefixWidth, setPrefixWidth] = useState(0);

  let styles = extractStyles(otherProps, POSITION_STYLES);

  let contextStyles = useContextStyles('Input', otherProps);

  inputStyles = extractStyles(otherProps, BLOCK_STYLES, {
    ...DEFAULT_INPUT_STYLES,
    ...contextStyles,
    ...inputStyles,
  });

  wrapperStyles = {
    ...WRAPPER_STYLES,
    ...wrapperStyles,
  };

  if (prefix) {
    inputStyles.paddingLeft = `${prefixWidth}px`;
  }

  if (validationState || isLoading || suffix) {
    inputStyles.paddingRight = `${suffixWidth}px`;
  }

  let ElementType = multiLine ? 'textarea' : 'input';
  let { isFocused, focusProps } = useFocus({ isDisabled, as: ElementType });
  let { hoverProps, isHovered } = useHover({ isDisabled });
  let domRef = useRef(null);
  let defaultInputRef = useRef(null);

  inputRef = inputRef || defaultInputRef;

  // Expose imperative interface for ref
  useImperativeHandle(ref, () => ({
    ...createFocusableRef(domRef, inputRef),
    select() {
      if (inputRef.current) {
        inputRef.current.select();
      }
    },
    getInputElement() {
      return inputRef.current;
    },
  }));

  let isInvalid = validationState === 'invalid';

  let validationIcon = isInvalid ? (
    <WarningOutlined style={{ color: 'var(--danger-color)' }} />
  ) : (
    <CheckOutlined style={{ color: 'var(--success-color)' }} />
  );
  let validation = cloneElement(validationIcon);

  suffix =
    typeof suffix === 'string' ? (
      <Block padding="1x right">{suffix}</Block>
    ) : (
      suffix
    );

  let textField = (
    <Base
      ref={wrapperRef}
      qa={`${qa || 'TextInput'}Wrapper`}
      data-is-invalid={isInvalid ? '' : null}
      data-is-valid={validationState === 'valid' ? '' : null}
      data-is-loadable={loadingIndicator ? '' : null}
      data-is-multiline={multiLine ? '' : null}
      styles={wrapperStyles}
      {...wrapperProps}
    >
      <Base
        qa={qa || 'TextInput'}
        as={ElementType}
        {...mergeProps(inputProps, focusProps, hoverProps)}
        ref={inputRef}
        rows={multiLine ? rows : undefined}
        {...modAttrs({
          invalid: isInvalid,
          valid: validationState === 'valid',
          disabled: isDisabled,
          hovered: isHovered,
          focused: isFocused,
        })}
        styles={inputStyles}
      />
      <Prefix
        padding="0 1x 0 1.5x"
        onWidthChange={setPrefixWidth}
        opacity={isDisabled ? '@disabled-opacity' : false}
        items="center"
      >
        {typeof prefix === 'string' ? (
          <Block padding="1x left">{prefix}</Block>
        ) : (
          prefix
        )}
      </Prefix>
      <Suffix
        padding="1x left"
        onWidthChange={setSuffixWidth}
        opacity={isDisabled ? '@disabled-opacity' : false}
      >
        {suffixPosition === 'before' ? suffix : null}
        <Space gap={false} padding="0 1.5x 0 0">
          {validationState && !isLoading ? validation : null}
          {isLoading && <LoadingOutlined />}
        </Space>
        {suffixPosition === 'after' ? suffix : null}
      </Suffix>
    </Base>
  );

  return (
    <FieldWrapper
      {...{
        labelPosition,
        label,
        insideForm,
        styles,
        isRequired,
        labelStyles,
        necessityIndicator,
        labelProps,
        isDisabled,
        validationState,
        message,
        requiredMark,
        Component: textField,
        ref: domRef,
      }}
    />
  );
}

const _TextInputBase = forwardRef(TextInputBase);
export { _TextInputBase as TextInputBase };
