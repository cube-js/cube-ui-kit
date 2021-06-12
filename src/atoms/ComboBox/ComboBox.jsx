import {
  CheckOutlined,
  LoadingOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { createFocusableRef } from '@react-spectrum/utils';
import { mergeProps } from '@react-aria/utils';
import React, {
  cloneElement,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';
import { useComboBoxState } from '@react-stately/combobox';
import { useComboBox } from '@react-aria/combobox';
import { useButton } from '@react-aria/button';
import { useFormProps } from '../Form/Form';
import { useHover } from '@react-aria/interactions';
import { useProviderProps } from '../../provider';
import { useFilter } from '@react-aria/i18n';
import { Base } from '../../components/Base';
import { extractStyles } from '../../utils/styles';
import { BLOCK_STYLES, OUTER_STYLES } from '../../styles/list';
import { useFocus } from '../../utils/interactions';
import { useContextStyles } from '../../providers/Styles';
import { modAttrs } from '../../utils/react/modAttrs';
import { FieldWrapper } from '../../components/FieldWrapper';
import { useCombinedRefs } from '../../utils/react/useCombinedRefs';
import { ListBoxPopup } from '../Select/Select';
import { Prefix } from '../../components/Prefix';
import { Suffix } from '../../components/Suffix';
import { Space } from '../../components/Space';
import { Item } from '@react-stately/collections';
import { CSSTransition } from 'react-transition-group';
import { OVERLAY_TRANSITION_CSS } from '../../utils/transitions';

const CaretDownIcon = () => (
  <svg
    aria-hidden="true"
    width="14"
    height="14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.49 4.102H2.51c-.269 0-.42.284-.253.478l4.49 5.206a.342.342 0 00.506 0l4.49-5.206c.167-.194.016-.478-.253-.478z"
      fill="currentColor"
    />
  </svg>
);

const COMBOBOX_STYLES = {
  position: 'relative',
};

const INPUT_STYLES = {
  display: 'block',
  width: '100%',
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
  fontWeight: 400,
};

const TRIGGER_STYLES = {
  display: 'grid',
  items: 'center',
  radius: 'right',
  padding: '0 1.5x',
  color: 'inherit',
  border: 0,
  fill: {
    '': '#purple.0',
    hovered: '#dark.04',
    pressed: '#dark.08',
    disabled: '#clear',
  },
  margin: '1bw top right bottom',
};

function ComboBox(props, ref) {
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
    isDisabled,
    multiLine,
    autoFocus,
    inputRef,
    triggerRef,
    popoverRef,
    listBoxRef,
    isLoading,
    loadingIndicator,
    insideForm,
    value,
    inputStyles,
    triggerStyles,
    wrapperChildren,
    disallowEmptySelection,
    selectionMode,
    listBoxStyles,
    hideTrigger,
    errorMessage,
    ...otherProps
  } = props;
  let { contains } = useFilter({ sensitivity: 'base' });
  let [suffixWidth, setSuffixWidth] = useState(0);
  let [prefixWidth, setPrefixWidth] = useState(0);
  let state = useComboBoxState({ ...props, defaultFilter: contains });

  const styles = extractStyles(otherProps, OUTER_STYLES, {
    ...COMBOBOX_STYLES,
    ...useContextStyles('ComboBox_Wrapper', props),
  });

  inputStyles = extractStyles(otherProps, BLOCK_STYLES, {
    ...INPUT_STYLES,
    ...useContextStyles('ComboBox', props),
    ...inputStyles,
  });

  triggerStyles = {
    ...TRIGGER_STYLES,
    ...useContextStyles('ComboBox_Trigger', props),
    ...triggerStyles,
  };

  ref = useCombinedRefs(ref);
  inputRef = useCombinedRefs(inputRef);
  triggerRef = useCombinedRefs(triggerRef);
  popoverRef = useCombinedRefs(popoverRef);
  listBoxRef = useCombinedRefs(listBoxRef);

  let {
    labelProps,
    inputProps,
    listBoxProps,
    buttonProps: triggerProps,
  } = useComboBox(
    {
      ...props,
      inputRef,
      buttonRef: triggerRef,
      listBoxRef,
      popoverRef,
      menuTrigger: 'input',
    },
    state,
  );

  if (icon) {
    inputStyles.paddingLeft = `${prefixWidth}px`;
  }

  inputStyles.paddingRight = `${suffixWidth}px`;

  let { isFocused, focusProps } = useFocus({ isDisabled, as: 'input' });
  let { hoverProps, isHovered } = useHover({ isDisabled });

  // Expose imperative interface for ref
  useImperativeHandle(ref, () => ({
    ...createFocusableRef(ref, inputRef),
    select() {
      if (inputRef.current) {
        inputRef.current.select();
      }
    },
    getInputElement() {
      return inputRef.current;
    },
  }));

  // Get props for the button based on the trigger props from useComboBox
  let { buttonProps, isTriggerPressed } = useButton(triggerProps, triggerRef);
  let { hoverProps: triggerHoverProps, isHovered: isTriggerHovered } = useHover(
    { isDisabled },
  );
  let { focusProps: triggerFocusProps, isFocused: isTriggerFocused } = useFocus(
    { isDisabled, as: 'button' },
    true,
  );

  let isInvalid = validationState === 'invalid';

  let validationIcon = isInvalid ? (
    <WarningOutlined style={{ color: 'var(--danger-color)' }} />
  ) : (
    <CheckOutlined style={{ color: 'var(--success-color)' }} />
  );
  let validation = cloneElement(validationIcon);

  let comboBoxField = (
    <Base
      qa="ComboBoxWrapper"
      {...modAttrs({
        invalid: isInvalid,
        valid: validationState === 'valid',
        disabled: isDisabled,
        hovered: isHovered,
        focused: isFocused,
        'has-icon': !!icon,
      })}
      styles={styles}
      style={{
        zIndex: isFocused ? '1' : 'initial',
      }}
    >
      <Base
        qa={qa || 'ComboBox'}
        as="input"
        {...mergeProps(inputProps, hoverProps, focusProps)}
        ref={inputRef}
        styles={inputStyles}
        {...modAttrs({
          invalid: isInvalid,
          valid: validationState === 'valid',
          disabled: isDisabled,
          hovered: isHovered,
          focused: isFocused,
        })}
      />
      <Prefix
        onWidthChange={setPrefixWidth}
        padding="0 1x 0 1.5x"
        opacity={isDisabled ? '@disabled-opacity' : false}
        items="center"
      >
        {icon}
      </Prefix>
      <Suffix
        onWidthChange={setSuffixWidth}
        padding="1x left"
        opacity={isDisabled ? '@disabled-opacity' : false}
      >
        <Space gap={false} padding="0 1x">
          {validationState && !isLoading ? validation : null}
          {isLoading && <LoadingOutlined />}
        </Space>
        {wrapperChildren}
        {!hideTrigger ? (
          <Base
            as="button"
            {...mergeProps(buttonProps, triggerFocusProps, triggerHoverProps)}
            {...modAttrs({
              pressed: isTriggerPressed,
              focused: isTriggerFocused,
              hovered: isTriggerHovered,
              disabled: isDisabled,
            })}
            isDisabled={isDisabled}
            ref={triggerRef}
            styles={triggerStyles}
          >
            <CaretDownIcon />
          </Base>
        ) : null}
      </Suffix>
      <CSSTransition
        in={state.isOpen && !isDisabled}
        unmountOnExit
        timeout={120}
        classNames="cube-overlay-transition"
      >
        <Base
          styles={{
            position: 'absolute',
            width: '100%',
            top: 0,
            height: '100%',
          }}
          css={OVERLAY_TRANSITION_CSS}
        >
          <ListBoxPopup
            {...listBoxProps}
            listBoxRef={listBoxRef}
            popoverRef={popoverRef}
            shouldUseVirtualFocus
            state={state}
            listBoxStyles={listBoxStyles}
            disallowEmptySelection={disallowEmptySelection}
            selectionMode={selectionMode}
          />
        </Base>
      </CSSTransition>
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
        labelAlign,
        labelStyles,
        necessityIndicator,
        labelProps,
        isDisabled,
        validationState,
        errorMessage,
        Component: comboBoxField,
        ref: ref,
      }}
    />
  );
}

const _ComboBox = forwardRef(ComboBox);
_ComboBox.Item = Item;
export { _ComboBox as ComboBox };
