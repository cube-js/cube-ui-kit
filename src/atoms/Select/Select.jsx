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
  useRef,
} from 'react';
import { useSelectState } from '@react-stately/select';
import { HiddenSelect, useSelect } from '@react-aria/select';
import { useListBox, useOption } from '@react-aria/listbox';
import { useButton } from '@react-aria/button';
import { FocusScope } from '@react-aria/focus';
import { DismissButton, useOverlay } from '@react-aria/overlays';
import { useFormProps } from '../Form/Form';
import { useFocus as useAriaFocus, useHover } from '@react-aria/interactions';
import { useProviderProps } from '../../provider';
import { Base } from '../../components/Base';
import { extractStyles } from '../../utils/styles';
import { BLOCK_STYLES, OUTER_STYLES } from '../../styles/list';
import { useFocus } from '../../utils/interactions';
import { useContextStyles } from '../../providers/Styles';
import { modAttrs } from '../../utils/react/modAttrs';
import { FieldWrapper } from '../../components/FieldWrapper';
import { useCombinedRefs } from '../../utils/react/useCombinedRefs';
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

const SELECT_STYLES = {
  display: 'grid',
  position: 'relative',
};

const INPUT_STYLES = {
  display: 'grid',
  flow: 'column',
  columns: '1fr auto',
  items: 'center stretch',
  content: 'center stretch',
  gap: '1x',
  padding: '(1.25x - 1bw) 1x (1.25x - 1bw) (1.5x - 1bw)',
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
    '': '#purple.0',
    hovered: '#dark.04',
    pressed: '#dark.08',
    disabled: '#dark.04',
  },
  fontWeight: 400,
  textAlign: 'left',
};

const OVERLAY_STYLES = {
  position: 'absolute',
  left: '50%',
  top: '(100% + .5x)',
  transform: 'translate(-50%, 0)',
  width: '100% max-content max-content',
  z: 999,
};

const LISTBOX_STYLES = {
  display: 'flex',
  gap: '.5x',
  flow: 'column',
  margin: '0',
  padding: '.5x',
  listStyle: 'none',
  radius: true,
  fill: '#white',
  shadow: true,
  height: 'initial 30x',
  overflow: 'hidden auto',
  scrollBar: true,
};

const OPTION_STYLES = {
  display: 'block',
  padding: '(1x - 1px) (1.5x - 1px)',
  cursor: 'pointer',
  radius: true,
  fill: {
    '': '#white',
    focused: '#dark.04',
    selected: '#purple',
    'focused & selected': '#purple-text',
    disabled: '#dark.04',
  },
  color: {
    '': '#dark.85',
    selected: '#white',
    disabled: '#dark.30',
  },
  fontWeight: 500,
};

function Select(props, ref) {
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
    inputProps,
    inputRef,
    triggerRef,
    popoverRef,
    listBoxRef,
    isLoading,
    loadingIndicator,
    insideForm,
    value,
    inputStyles,
    optionStyles,
    suffix,
    disallowEmptySelection,
    selectionMode,
    listBoxStyles,
    message,
    requiredMark = true,
    ...otherProps
  } = props;
  let state = useSelectState(props);

  const styles = extractStyles(otherProps, OUTER_STYLES, {
    ...SELECT_STYLES,
    ...useContextStyles('Select_Wrapper', otherProps),
  });

  inputStyles = extractStyles(otherProps, BLOCK_STYLES, {
    ...INPUT_STYLES,
    ...useContextStyles('Select', otherProps),
    ...inputStyles,
  });

  ref = useCombinedRefs(ref);
  inputRef = useCombinedRefs(inputRef);
  triggerRef = useCombinedRefs(triggerRef);
  popoverRef = useCombinedRefs(popoverRef);
  listBoxRef = useCombinedRefs(listBoxRef);

  let { labelProps, triggerProps, valueProps, menuProps } = useSelect(
    props,
    state,
    triggerRef,
  );

  let { isFocused, focusProps } = useFocus({ isDisabled, as: 'input' }, true);
  let { hoverProps, isHovered } = useHover({ isDisabled });

  // Expose imperative interface for ref
  useImperativeHandle(ref, () => ({
    ...createFocusableRef(ref, triggerRef),
    select() {
      if (triggerRef.current) {
        triggerRef.current.select();
      }
    },
    getInputElement() {
      return inputRef.current;
    },
  }));

  // Get props for the button based on the trigger props from useSelect
  let { buttonProps } = useButton(triggerProps, triggerRef);

  let isInvalid = validationState === 'invalid';

  let validationIcon = isInvalid ? (
    <WarningOutlined style={{ color: 'var(--danger-color)' }} />
  ) : (
    <CheckOutlined style={{ color: 'var(--success-color)' }} />
  );
  let validation = cloneElement(validationIcon);

  let selectField = (
    <Base
      qa="SelectWrapper"
      {...modAttrs({
        invalid: isInvalid,
        valid: validationState === 'valid',
        disabled: isDisabled,
        hovered: isHovered,
        focused: isFocused,
      })}
      styles={styles}
    >
      <HiddenSelect
        state={state}
        triggerRef={triggerRef}
        label={props.label}
        name={props.name}
      />
      <Base
        qa={qa || 'Select'}
        as="button"
        {...mergeProps(buttonProps, hoverProps, focusProps)}
        ref={triggerRef}
        styles={{
          ...INPUT_STYLES,
          ...inputStyles,
        }}
        {...modAttrs({
          invalid: isInvalid,
          valid: validationState === 'valid',
          disabled: isDisabled,
          hovered: isHovered,
          focused: isFocused,
        })}
      >
        {prefix}
        <span {...valueProps}>
          {state.selectedItem
            ? state.selectedItem.rendered
            : 'Select an option'}
        </span>
        {(validationState || isLoading || suffix) && (
          <div>
            {validationState && !isLoading ? validation : null}
            {isLoading && <LoadingOutlined />}
            {suffix}
          </div>
        )}
        <CaretDownIcon />
      </Base>
      <OverlayWrapper in={state.isOpen && !isDisabled}>
        <ListBoxPopup
          {...menuProps}
          popoverRef={popoverRef}
          listBoxRef={listBoxRef}
          state={state}
          disallowEmptySelection={disallowEmptySelection}
          selectionMode={selectionMode}
          listBoxStyles={listBoxStyles}
          optionStyles={optionStyles}
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
        Component: selectField,
        ref: ref,
      }}
    />
  );
}

export function ListBoxPopup({
  state,
  popoverRef,
  listBoxRef,
  listBoxStyles,
  overlayStyles,
  optionStyles,
  disallowEmptySelection,
  shouldUseVirtualFocus,
  selectionMode,
  ...otherProps
}) {
  // Get props for the listbox
  let { listBoxProps } = useListBox(
    {
      autoFocus: state.focusStrategy || true,
      disallowEmptySelection,
      selectionMode,
      shouldUseVirtualFocus,
      ...otherProps,
    },
    state,
    listBoxRef,
  );

  listBoxStyles = {
    ...LISTBOX_STYLES,
    ...useContextStyles('ListBoxPopup'),
    ...listBoxStyles,
  };

  // Handle events that should cause the popup to close,
  // e.g. blur, clicking outside, or pressing the escape key.
  let { overlayProps } = useOverlay(
    {
      onClose: () => state.close(),
      shouldCloseOnBlur: true,
      isOpen: state.isOpen,
      isDismissable: true,
    },
    popoverRef,
  );

  // Wrap in <FocusScope> so that focus is restored back to the
  // trigger when the popup is closed. In addition, add hidden
  // <DismissButton> components at the start and end of the list
  // to allow screen reader users to dismiss the popup easily.
  return (
    <FocusScope restoreFocus>
      <Base
        styles={{
          ...OVERLAY_STYLES,
          overlayStyles,
        }}
        {...overlayProps}
        ref={popoverRef}
      >
        <DismissButton onDismiss={() => state.close()} />
        <Base
          as="ul"
          styles={listBoxStyles}
          {...mergeProps(listBoxProps, otherProps)}
          ref={listBoxRef}
        >
          {[...state.collection].map((item) => (
            <Option
              key={item.key}
              item={item}
              state={state}
              optionStyles={optionStyles}
              shouldUseVirtualFocus={shouldUseVirtualFocus}
            />
          ))}
        </Base>
        <DismissButton onDismiss={() => state.close()} />
      </Base>
    </FocusScope>
  );
}

function Option({ item, state, styles, shouldUseVirtualFocus }) {
  let ref = useRef();
  let isDisabled = state.disabledKeys.has(item.key);
  let isSelected = state.selectionManager.isSelected(item.key);
  let isVirtualFocused = state.selectionManager.focusedKey === item.key;

  styles = {
    ...OPTION_STYLES,
    ...useContextStyles('Option'),
    ...styles,
  };

  let { optionProps } = useOption(
    {
      key: item.key,
      isDisabled,
      isSelected,
      shouldSelectOnPressUp: true,
      shouldFocusOnHover: true,
      shouldUseVirtualFocus,
    },
    state,
    ref,
  );

  // Handle focus events so we can apply highlighted
  // style to the focused option
  let [isFocused, setFocused] = React.useState(false);
  let { focusProps } = useAriaFocus({ onFocusChange: setFocused });

  return (
    <Base
      as="li"
      {...mergeProps(optionProps, focusProps)}
      ref={ref}
      {...modAttrs({
        selected: isSelected,
        focused: shouldUseVirtualFocus ? isVirtualFocused : isFocused,
        disabled: isDisabled,
      })}
      styles={styles}
    >
      {item.rendered}
    </Base>
  );
}

export function OverlayWrapper(props) {
  return (
    <CSSTransition
      in={props.in}
      unmountOnExit
      timeout={180}
      classNames="cube-overlay-transition"
    >
      <Base
        styles={{
          position: 'absolute',
          width: '100%',
          top: 0,
          height: '100%',
          z: 999,
        }}
        css={OVERLAY_TRANSITION_CSS}
      >
        {props.children}
      </Base>
    </CSSTransition>
  );
}

const _Select = forwardRef(Select);
_Select.Item = Item;
export { _Select as Select };

export { Item };
