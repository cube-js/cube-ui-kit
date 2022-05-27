import {
  CheckOutlined,
  LoadingOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { createFocusableRef } from '@react-spectrum/utils';
import {
  cloneElement,
  forwardRef,
  ReactNode,
  RefObject,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useFormProps } from '../Form/Form';
import { useHover } from '@react-aria/interactions';
import { useProviderProps } from '../../../provider';
import { Base } from '../../Base';
import {
  extractStyles,
  useContextStyles,
  BaseProps,
  BlockStyleProps,
  DimensionStyleProps,
  PositionStyleProps,
  BLOCK_STYLES,
  DIMENSION_STYLES,
  POSITION_STYLES,
  Props,
  Styles,
} from '../../../tasty';
import { useFocus } from '../../../utils/react/interactions';
import { Prefix } from '../../layout/Prefix';
import { Suffix } from '../../layout/Suffix';
import { FieldWrapper } from '../FieldWrapper';
import { Space } from '../../layout/Space';
import { Block } from '../../Block';
import { FormFieldProps } from '../../../shared';
import type { AriaTextFieldProps } from '@react-types/textfield';
import { mergeProps } from '../../../utils/react';

const WRAPPER_STYLES: Styles = {
  display: 'grid',
  position: 'relative',
};

const STYLE_LIST = [...POSITION_STYLES, ...DIMENSION_STYLES];

const INPUT_STYLE_PROPS_LIST = [...BLOCK_STYLES, 'resize'];

export const DEFAULT_INPUT_STYLES: Styles = {
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
    '': '#white',
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
  transition: 'theme',
  radius: true,
  padding: {
    '': '(1.25x - 1bw) 1x (1.25x - 1bw) (1.5x - 1bw)',
    '[data-size="small"]': '(.75x - 1px) (1.5x - 1px)',
  },
  fontWeight: 400,
  textAlign: 'left',
  reset: 'input',
  preset: 'default',
  flexGrow: 1,
  margin: 0,
  resize: 'none',
};

export interface CubeTextInputBaseProps
  extends BaseProps,
    PositionStyleProps,
    DimensionStyleProps,
    BlockStyleProps,
    AriaTextFieldProps,
    FormFieldProps {
  /** Input decoration before the main input */
  prefix?: ReactNode;
  /** Input decoration after the main input */
  suffix?: ReactNode;
  /** Suffix position goes before or after the validation and loading statuses */
  suffixPosition?: 'before' | 'after';
  /** Whether the input is multiline */
  multiLine?: boolean;
  /** Whether the input should have auto focus */
  autoFocus?: boolean;
  /** Direct input props */
  inputProps?: Props;
  /** Direct input wrapper props */
  wrapperProps?: Props;
  /** The input ref */
  inputRef?: RefObject<HTMLInputElement | HTMLTextAreaElement>;
  /** The wrapper ref */
  wrapperRef?: RefObject<HTMLDivElement>;
  /** Whether the input has the loading status */
  isLoading?: boolean;
  /** The loading status indicator */
  loadingIndicator?: ReactNode;
  /** Style map for the input */
  inputStyles?: Styles;
  /** Style map for the input wrapper */
  wrapperStyles?: Styles;
  /** The number of rows for the input. Only applies to textarea. */
  rows?: number;
  /** The resize CSS property sets whether an element is resizable, and if so, in which directions. */
  resize?: Styles['resize'];
  /** The size of the input */
  size?: 'small' | 'default' | 'large' | string;
}

function TextInputBase(props: CubeTextInputBaseProps, ref) {
  props = useProviderProps(props);
  props = useFormProps(props);

  let {
    qa,
    label,
    extra,
    labelPosition = 'top',
    labelStyles,
    isRequired,
    necessityIndicator,
    necessityLabel,
    validationState,
    message,
    description,
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
    value,
    inputStyles = {},
    wrapperStyles = {},
    suffix,
    suffixPosition = 'before',
    wrapperRef,
    requiredMark = true,
    tooltip,
    isHidden,
    rows = 1,
    size,
    ...otherProps
  } = props;
  let [suffixWidth, setSuffixWidth] = useState(0);
  let [prefixWidth, setPrefixWidth] = useState(0);

  let styles = extractStyles(otherProps, STYLE_LIST);
  let type = otherProps.type;

  let contextStyles = useContextStyles('Input', otherProps);

  inputStyles = extractStyles(otherProps, INPUT_STYLE_PROPS_LIST, {
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

  let ElementType: 'textarea' | 'input' = multiLine ? 'textarea' : 'input';
  let { isFocused, focusProps } = useFocus({ isDisabled });
  let { hoverProps, isHovered } = useHover({ isDisabled });
  let domRef = useRef(null);
  let defaultInputRef = useRef(null);

  inputRef = inputRef || defaultInputRef;

  // Expose imperative interface for ref
  useImperativeHandle(ref, () => ({
    ...createFocusableRef(domRef, inputRef),
    select() {
      if (inputRef?.current) {
        inputRef.current.select();
      }
    },
    getInputElement() {
      return inputRef?.current;
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

  // Fix safari bug: https://github.com/philipwalton/flexbugs/issues/270
  if (!inputProps?.placeholder) {
    if (!inputProps) {
      inputProps = {};
    }

    inputProps.placeholder = ' ';
  }

  let textField = (
    <Base
      ref={wrapperRef}
      qa={`${qa || 'TextInput'}Wrapper`}
      mods={{
        invalid: isInvalid,
        valid: validationState === 'valid',
        loadable: !!loadingIndicator,
        multiline: multiLine,
      }}
      data-size={size}
      styles={wrapperStyles}
      {...wrapperProps}
    >
      <Base
        qa={qa || 'TextInput'}
        as={ElementType}
        {...mergeProps(inputProps, focusProps, hoverProps)}
        ref={inputRef}
        rows={multiLine ? rows : undefined}
        mods={{
          invalid: isInvalid,
          valid: validationState === 'valid',
          disabled: isDisabled,
          hovered: isHovered,
          focused: isFocused,
        }}
        style={{
          WebkitTextSecurity:
            multiLine && type === 'password' ? 'disc' : 'initial',
        }}
        autoFocus={autoFocus}
        data-size={size}
        styles={inputStyles}
      />
      <Prefix
        padding="0 1x 0 1.5x"
        onWidthChange={setPrefixWidth}
        opacity={isDisabled ? '@disabled-opacity' : false}
        placeItems="center"
      >
        {typeof prefix === 'string' ? (
          <Block padding="1x left">{prefix}</Block>
        ) : (
          prefix
        )}
      </Prefix>
      <Suffix
        padding=".5x left"
        onWidthChange={setSuffixWidth}
        opacity={isDisabled ? '@disabled-opacity' : false}
      >
        {suffixPosition === 'before' ? suffix : null}
        {(validationState && !isLoading) || isLoading ? (
          <Space gap={false} padding={`0 ${suffix ? '1x' : '1.5x'} 0 0`}>
            {validationState && !isLoading ? validation : null}
            {isLoading && <LoadingOutlined />}
          </Space>
        ) : null}
        {suffixPosition === 'after' ? suffix : null}
      </Suffix>
    </Base>
  );

  return (
    <FieldWrapper
      {...{
        labelPosition,
        label,
        extra,
        styles,
        isRequired,
        labelStyles,
        necessityIndicator,
        necessityLabel,
        labelProps,
        isDisabled,
        validationState,
        message,
        description,
        requiredMark,
        tooltip,
        isHidden,
        Component: textField,
        ref: domRef,
      }}
    />
  );
}

const _TextInputBase = forwardRef(TextInputBase);
export { _TextInputBase as TextInputBase };
