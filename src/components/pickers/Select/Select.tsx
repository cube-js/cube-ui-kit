import {
  CheckOutlined,
  LoadingOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { mergeProps } from '@react-aria/utils';
import {
  cloneElement,
  forwardRef,
  ReactNode,
  RefObject,
  useRef,
  useState,
} from 'react';
import { useSelectState } from '@react-stately/select';
import { HiddenSelect, useSelect } from '@react-aria/select';
import { useListBox, useOption } from '@react-aria/listbox';
import { useButton } from '@react-aria/button';
import { FocusScope } from '@react-aria/focus';
import {
  DismissButton,
  useOverlay,
  useOverlayPosition,
} from '@react-aria/overlays';
import { useFormProps } from '../../forms/Form/Form';
import { useFocus as useAriaFocus, useHover } from '@react-aria/interactions';
import { useProviderProps } from '../../../provider';
import { Base } from '../../Base';
import { extractStyles } from '../../../utils/styles';
import { BLOCK_STYLES, OUTER_STYLES } from '../../../styles/list';
import { useFocus } from '../../../utils/interactions';
import { useContextStyles } from '../../../providers/Styles';
import { useCombinedRefs } from '../../../utils/react';
import { FieldWrapper } from '../../forms/FieldWrapper';
import { Item } from '@react-stately/collections';
import { OverlayWrapper } from '../../overlays/OverlayWrapper';
import { Styles } from '../../../styles/types';
import {
  BasePropsWithoutChildren,
  BlockStyleProps,
  OuterStyleProps,
  Props,
} from '../../types';
import { AriaSelectProps } from '@react-types/select';
import { DOMRef } from '@react-types/shared';
import { FormFieldProps } from '../../../shared';

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

const SELECT_STYLES: Styles = {
  display: 'grid',
  position: 'relative',
} as const;

const INPUT_STYLES: Styles = {
  display: 'grid',
  flow: 'column',
  gridColumns: '1fr auto',
  placeItems: 'center stretch',
  placeContent: 'center stretch',
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
  preset: 'default',
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
} as const;

const OVERLAY_STYLES: Styles = {
  position: 'absolute',
  transform: {
    '': 'translate(-1.5x, 0)',
    '[data-position="top"]': 'translate(-1.5x, 0)',
  },
  width: '100% max-content max-content',
} as const;

const LISTBOX_STYLES: Styles = {
  display: 'flex',
  gap: '.5x',
  flow: 'column',
  margin: '0',
  padding: '.5x',
  listStyle: 'none',
  radius: true,
  fill: '#white',
  shadow: '0px 4px 16px #shadow',
  height: 'initial 30x',
  overflow: 'hidden auto',
  styledScrollbar: true,
} as const;

const OPTION_STYLES: Styles = {
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
} as const;

export interface CubeSelectBaseProps<T>
  extends BasePropsWithoutChildren,
    OuterStyleProps,
    FormFieldProps,
    BlockStyleProps,
    AriaSelectProps<T> {
  prefix?: ReactNode;
  suffix?: ReactNode;
  triggerRef?: RefObject<HTMLButtonElement>;
  isLoading?: boolean;
  loadingIndicator?: ReactNode;
  overlayOffset?: number;
  hideTrigger?: boolean;
  inputStyles?: Styles;
  optionStyles?: Styles;
  triggerStyles?: Styles;
  listBoxStyles?: Styles;
  overlayStyles?: Styles;
  direction?: 'top' | 'bottom';
  shouldFlip?: boolean;
  inputProps?: Props;
}

export interface CubeSelectProps<T> extends CubeSelectBaseProps<T> {
  popoverRef?: RefObject<HTMLInputElement>;
  /** The ref for the list box. */
  listBoxRef?: RefObject<HTMLElement>;
}

function Select<T extends object>(
  props: CubeSelectProps<T>,
  ref: DOMRef<HTMLDivElement>,
) {
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
    prefix,
    isDisabled,
    autoFocus,
    inputProps,
    triggerRef,
    popoverRef,
    listBoxRef,
    isLoading,
    loadingIndicator,
    insideForm,
    overlayOffset = 8,
    inputStyles,
    optionStyles,
    suffix,
    disallowEmptySelection,
    listBoxStyles,
    overlayStyles,
    message,
    direction = 'bottom',
    shouldFlip = true,
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
  triggerRef = useCombinedRefs(triggerRef);
  popoverRef = useCombinedRefs(popoverRef);
  listBoxRef = useCombinedRefs(listBoxRef);

  let { labelProps, triggerProps, valueProps, menuProps } = useSelect(
    props,
    state,
    triggerRef,
  );

  let { overlayProps, placement } = useOverlayPosition({
    targetRef: triggerRef,
    overlayRef: popoverRef,
    scrollRef: listBoxRef,
    // @ts-ignore
    placement: `${direction} end`,
    shouldFlip: shouldFlip,
    isOpen: state.isOpen,
    onClose: state.close,
    offset: overlayOffset,
  });

  let { isFocused, focusProps } = useFocus({ isDisabled }, true);
  let { hoverProps, isHovered } = useHover({ isDisabled });

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
      mods={{
        invalid: isInvalid,
        valid: validationState === 'valid',
        disabled: isDisabled,
        hovered: isHovered,
        focused: isFocused,
      }}
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
        mods={{
          invalid: isInvalid,
          valid: validationState === 'valid',
          disabled: isDisabled,
          hovered: isHovered,
          focused: isFocused,
        }}
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
      <OverlayWrapper isOpen={state.isOpen && !isDisabled}>
        <ListBoxPopup
          {...menuProps}
          popoverRef={popoverRef}
          listBoxRef={listBoxRef}
          overlayProps={overlayProps}
          placement={placement}
          state={state}
          disallowEmptySelection={disallowEmptySelection}
          listBoxStyles={listBoxStyles}
          overlayStyles={overlayStyles}
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
  overlayProps: parentOverlayProps,
  disallowEmptySelection,
  shouldUseVirtualFocus = false,
  placement,
  ...otherProps
}) {
  // Get props for the listbox
  let { listBoxProps } = useListBox(
    {
      autoFocus: state.focusStrategy || true,
      disallowEmptySelection,
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
        {...parentOverlayProps}
        {...overlayProps}
        data-position={placement}
        ref={popoverRef}
      >
        <DismissButton onDismiss={() => state.close()} />
        <Base
          as="ul"
          styles={listBoxStyles}
          {...mergeProps(listBoxProps, otherProps)}
          ref={listBoxRef}
        >
          {Array.from(state.collection).map((item: any) => (
            <Option
              key={item.key}
              item={item}
              state={state}
              styles={optionStyles}
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
  let ref = useRef<HTMLDivElement>(null);
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
  let [isFocused, setFocused] = useState(false);
  let { focusProps } = useAriaFocus({ onFocusChange: setFocused });

  return (
    <Base
      as="li"
      {...mergeProps(optionProps, focusProps)}
      ref={ref}
      mods={{
        selected: isSelected,
        focused: shouldUseVirtualFocus ? isVirtualFocused : isFocused,
        disabled: isDisabled,
      }}
      styles={styles}
      key={item.key}
    >
      {item.rendered}
    </Base>
  );
}

const _Select = Object.assign(forwardRef(Select), { Item });
// @ts-ignore
_Select.cubeInputType = 'Select';
export { _Select as Select };
