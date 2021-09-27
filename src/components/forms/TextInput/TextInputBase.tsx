import {
  WarningOutlined,
  CheckOutlined,
  LoadingOutlined,
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
import { extractStyles } from '../../../utils/styles';
import { BLOCK_STYLES, POSITION_STYLES } from '../../../styles/list';
import { useFocus } from '../../../utils/interactions';
import { Prefix } from '../../layout/Prefix';
import { Suffix } from '../../layout/Suffix';
import { useContextStyles } from '../../../providers/Styles';
import { FieldWrapper } from '../FieldWrapper';
import { Space } from '../../layout/Space';
import { Block } from '../../Block';
import { Styles } from '../../../styles/types';
import {
  BaseProps,
  BlockStyleProps,
  PositionStyleProps,
  Props,
} from '../../types';
import { FormFieldProps } from '../../../shared';
import { AriaTextFieldProps } from '@react-types/textfield';
import { mergeProps } from '../../../utils/react';

const WRAPPER_STYLES: Styles = {
  display: 'grid',
  position: 'relative',
};

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
  radius: true,
  padding: '(1.25x - 1bw) (1.5x - 1bw)',
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
  inputRef?: RefObject<HTMLInputElement>;
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
}

function TextInputBase(props: CubeTextInputBaseProps, ref) {
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

  suffix
    = typeof suffix === 'string' ? (
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
        mods={{
          invalid: isInvalid,
          valid: validationState === 'valid',
          disabled: isDisabled,
          hovered: isHovered,
          focused: isFocused,
        }}
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
