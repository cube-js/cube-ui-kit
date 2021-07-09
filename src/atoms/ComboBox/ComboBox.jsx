import { CheckOutlined, LoadingOutlined, WarningOutlined, } from '@ant-design/icons';
import { createFocusableRef } from '@react-spectrum/utils';
import { mergeProps } from '@react-aria/utils';
import React, { cloneElement, forwardRef, useImperativeHandle, useState, } from 'react';
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
import { DEFAULT_INPUT_STYLES } from '../TextInput/TextInputBase';
import { useOverlayPosition } from '@react-aria/overlays';
import { OverlayWrapper } from '../../components/OverlayWrapper';

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
  display: 'grid',
};

const INPUT_STYLES = {
  ...DEFAULT_INPUT_STYLES,
  width: '100%',
};

const TRIGGER_STYLES = {
  display: 'grid',
  items: 'center',
  content: 'center',
  radius: 'right',
  padding: '1.5x 1x',
  color: 'inherit',
  border: 0,
  fill: {
    '': '#purple.0',
    hovered: '#dark.04',
    pressed: '#dark.08',
    disabled: '#clear',
  },
};

function ComboBox(props, ref) {
  props = useProviderProps(props);
  props = useFormProps(props);

  if (props.onChange) {
    props.onSelectionChange = props.onChange;

    delete props.onChange;
  }

  let {
    qa,
    label,
    labelPosition = 'top',
    labelStyles,
    isRequired,
    necessityIndicator,
    validationState,
    prefix,
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
    offset = 8,
    inputStyles,
    triggerStyles,
    suffix,
    disallowEmptySelection,
    selectionMode,
    listBoxStyles,
    hideTrigger,
    message,
    direction = 'bottom',
    shouldFlip = true,
    requiredMark = true,
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

  let { overlayProps, placement } = useOverlayPosition({
    targetRef: triggerRef,
    overlayRef: popoverRef,
    scrollRef: listBoxRef,
    placement: `${direction} end`,
    shouldFlip: shouldFlip,
    isOpen: state.isOpen,
    onClose: state.close,
    offset,
  });

  if (prefix) {
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
    <WarningOutlined style={{ color: 'var(--danger-color)' }}/>
  ) : (
    <CheckOutlined style={{ color: 'var(--success-color)' }}/>
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
      {prefix ? (
        <Prefix
          onWidthChange={setPrefixWidth}
          padding="0 1x 0 1.5x"
          opacity={isDisabled ? '@disabled-opacity' : false}
          items="center"
          outerGap={0}
        >
          {prefix}
        </Prefix>
      ) : null}
      <Suffix
        onWidthChange={setSuffixWidth}
        padding="1x left"
        opacity={isDisabled ? '@disabled-opacity' : false}
      >
        <Space gap={false} padding="0 1x">
          {validationState && !isLoading ? validation : null}
          {isLoading && <LoadingOutlined/>}
        </Space>
        {suffix}
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
            <CaretDownIcon/>
          </Base>
        ) : null}
      </Suffix>
      <OverlayWrapper isOpen={state.isOpen && !isDisabled}>
        <ListBoxPopup
          {...listBoxProps}
          listBoxRef={listBoxRef}
          popoverRef={popoverRef}
          overlayProps={overlayProps}
          shouldUseVirtualFocus
          placement={placement}
          state={state}
          disallowEmptySelection={disallowEmptySelection}
          listBoxStyles={listBoxStyles}
          selectionMode={selectionMode}
        />
      </OverlayWrapper>
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
        Component: comboBoxField,
        ref: ref,
      }}
    />
  );
}

const _ComboBox = forwardRef(ComboBox);
_ComboBox.Item = Item;
export { _ComboBox as ComboBox };
