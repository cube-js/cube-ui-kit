import {
  WarningOutlined,
  CheckOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { createFocusableRef } from '@react-spectrum/utils';
import { Label } from '../../components/Label';
import { mergeProps } from '@react-aria/utils';
import React, {
  cloneElement,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react';
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

const DEFAULT_INPUT_STYLES = {
  padding: '(1.25x - 1bw) (1.5x - 1bw)',
  border: {
    '': true,
    invalid: '#danger-text.50',
    valid: '#success-text.50',
    focused: true,
  },
  radius: true,
  reset: 'input',
  size: 'input',
  outline: {
    '': '#purple-03.0',
    focused: '#purple-03',
  },
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
};

function TextFieldBase(props, ref) {
  props = useProviderProps(props);
  props = useFormProps(props);

  let {
    qa,
    label,
    labelPosition = 'top',
    labelAlign,
    labelStyles,
    isRequired,
    necessityIndicator,
    validationState,
    icon,
    isQuiet = false,
    isDisabled,
    multiLine,
    autoFocus,
    labelProps,
    inputProps,
    inputRef,
    isLoading,
    loadingIndicator,
    insideForm,
    value,
    inputStyles = {},
    wrapperChildren,
    ...otherProps
  } = props;
  const styles = extractStyles(otherProps, POSITION_STYLES).styles;
  // const [inputValue, setInputValue] = useState(defaultValue || value);

  // useEffect(() => {
  //   setInputValue(value);
  // }, [value]);

  const contextStyles = useContextStyles('TextField', otherProps);

  inputStyles = extractStyles(otherProps, BLOCK_STYLES, {
    ...DEFAULT_INPUT_STYLES,
    ...contextStyles,
    ...inputStyles,
  });

  if (icon) {
    inputStyles.paddingLeft = '4x';
  }

  if (validationState || isLoading) {
    inputStyles.paddingRight = '4x';
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

  let textField = (
    <Base
      qa="TextFieldWrapper"
      data-is-invalid={isInvalid ? '' : null}
      data-is-valid={validationState === 'valid' ? '' : null}
      data-is-loadable={loadingIndicator ? '' : null}
      data-is-quite={isQuiet ? '' : null}
      data-is-multiline={multiLine ? '' : null}
      styles={{
        display: 'grid',
        position: 'relative',
      }}
    >
      <Base
        qa={qa || 'TextField'}
        as={ElementType}
        {...mergeProps(inputProps, focusProps, hoverProps)}
        ref={inputRef}
        rows={multiLine ? 1 : undefined}
        {...modAttrs({
          invalid: isInvalid,
          valid: validationState === 'valid',
          disabled: isDisabled,
          hovered: isHovered,
          focused: isFocused,
          'has-icon': !!icon,
        })}
        styles={inputStyles}
      />
      <Prefix padding="0 1x" opacity={isDisabled ? '@disabled-opacity' : false}>
        {icon}
      </Prefix>
      <Suffix padding="0 1x" opacity={isDisabled ? '@disabled-opacity' : false}>
        {validationState && !isLoading ? validation : null}
        {isLoading && <LoadingOutlined />}
        {wrapperChildren}
      </Suffix>
    </Base>
  );

  if (label) {
    return (
      <Base
        qa="Field"
        ref={domRef}
        data-is-has-sider={labelPosition === 'side' ? '' : null}
        styles={{
          display: insideForm ? 'contents' : 'grid',
          columns: {
            '': '1fr',
            'has-sider': 'max-content 1fr',
          },
          gap: {
            '': '.5x',
            'has-sider': '1x',
          },
          items: 'baseline start',
          ...styles,
        }}
      >
        <Label
          styles={labelStyles}
          labelPosition={labelPosition}
          labelAlign={labelAlign}
          isRequired={isRequired}
          necessityIndicator={necessityIndicator}
          {...labelProps}
        >
          {label}
        </Label>
        {textField}
      </Base>
    );
  }

  return React.cloneElement(
    textField,
    mergeProps(textField.props, {
      ref: domRef,
      styles,
    }),
  );
}

const _TextFieldBase = forwardRef(TextFieldBase);
export { _TextFieldBase as TextFieldBase };
