import {
  CheckOutlined,
  LoadingOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { mergeProps, useCombinedRefs } from '../../../utils/react';
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
import {
  BasePropsWithoutChildren,
  BLOCK_STYLES,
  BlockStyleProps,
  extractStyles,
  OUTER_STYLES,
  OuterStyleProps,
  Props,
  Styles,
  tasty,
} from '../../../tasty';
import { useFocus } from '../../../utils/react/interactions';
import { FieldWrapper } from '../../forms/FieldWrapper';
import { Item } from '@react-stately/collections';
import { OverlayWrapper } from '../../overlays/OverlayWrapper';
import type { AriaSelectProps } from '@react-types/select';
import { DOMRef } from '@react-types/shared';
import { FormFieldProps } from '../../../shared';
import { getOverlayTransitionCSS } from '../../../utils/transitions';
import styled from 'styled-components';

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

const SelectWrapperElement = tasty({
  styles: {
    display: 'grid',
    position: 'relative',
    radius: true,
    fill: '#white',
    color: {
      '': '#dark.85',
      invalid: '#danger-text',
      focused: '#dark.85',
      disabled: '#dark.30',
    },
  },
});

const SelectElement = tasty({
  as: 'button',
  qa: 'Button',
  styles: {
    display: 'grid',
    flow: 'column',
    gridColumns: {
      '': '1fr auto',
      'with-prefix': 'auto 1fr auto',
    },
    placeItems: 'center stretch',
    placeContent: 'center stretch',
    gap: '1x',
    padding: {
      '': '(1.25x - 1bw) 1x (1.25x - 1bw) (1.5x - 1bw)',
      '[data-size="small"]': '(.75x - 1px) 1x (.75x - 1px)  (1.5x - 1px)',
    },
    border: {
      '': true,
      invalid: '#danger-text.50',
      valid: '#success-text.50',
      focused: true,
    },
    radius: '@context-radius',
    reset: 'button',
    margin: 0,
    preset: 'default',
    outline: {
      '': '#purple-03.0',
      focused: '#purple-03',
    },
    color: 'inherit',
    fill: {
      '': '#dark.0',
      'hovered | disabled': '#dark.04',
    },
    fontWeight: 400,
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'theme',
  },
});

const ListBoxElement = tasty({
  as: 'ul',
  styles: {
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
  },
});

const OptionElement = tasty({
  as: 'li',
  styles: {
    display: 'block',
    padding: '(1x - 1px) (1.5x - 1px)',
    cursor: 'pointer',
    radius: true,
    fill: {
      '': '#dark.0',
      'hovered | focused': '#dark.04',
      'pressed | selected': '#purple.10',
      '[disabled]': '#dark.04',
    },
    color: {
      '': '#dark.75',
      'hovered | focused': '#dark.75',
      'pressed | selected': '#purple',
      '[disabled]': '#dark.30',
    },
    preset: 't3m',
    transition: 'theme',
  },
});

const OverlayElement = tasty({
  styles: {
    position: 'absolute',
    width: 'min @overlay-min-width',
  },
});
const StyledOverlayElement = styled(OverlayElement)`
  ${(props) => {
    return getOverlayTransitionCSS({ placement: props?.['data-position'] });
  }}
`;

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
  size?: 'small' | 'default' | 'large' | string;
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
    extra,
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
    overlayOffset = 8,
    inputStyles,
    optionStyles,
    suffix,
    listBoxStyles,
    overlayStyles,
    message,
    description,
    direction = 'bottom',
    shouldFlip = true,
    requiredMark = true,
    placeholder,
    tooltip,
    size,
    styles,
    ...otherProps
  } = props;
  let state = useSelectState(props);
  const outerStyles = extractStyles(otherProps, OUTER_STYLES, styles);

  inputStyles = extractStyles(otherProps, BLOCK_STYLES, inputStyles);

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

  let triggerWidth = triggerRef?.current?.offsetWidth;

  let selectField = (
    <SelectWrapperElement
      qa={qa || 'Select'}
      mods={{
        invalid: isInvalid,
        valid: validationState === 'valid',
        disabled: isDisabled,
        hovered: isHovered,
        focused: isFocused,
      }}
      styles={outerStyles}
      data-size={size}
    >
      <HiddenSelect
        state={state}
        triggerRef={triggerRef}
        label={props.label}
        name={props.name}
      />
      <SelectElement
        {...mergeProps(buttonProps, hoverProps, focusProps)}
        ref={triggerRef}
        styles={inputStyles}
        data-size={size}
        mods={{
          invalid: isInvalid,
          valid: validationState === 'valid',
          disabled: isDisabled,
          hovered: isHovered,
          focused: isFocused,
          'with-prefix': !!prefix,
        }}
      >
        {prefix}
        <span {...valueProps}>
          {state.selectedItem
            ? state.selectedItem.rendered
            : placeholder || <>&nbsp;</>}
        </span>
        {(validationState || isLoading || suffix) && (
          <div>
            {validationState && !isLoading ? validation : null}
            {isLoading && <LoadingOutlined />}
            {suffix}
          </div>
        )}
        <CaretDownIcon />
      </SelectElement>
      <OverlayWrapper isOpen={state.isOpen && !isDisabled}>
        <ListBoxPopup
          {...menuProps}
          popoverRef={popoverRef}
          listBoxRef={listBoxRef}
          overlayProps={overlayProps}
          placement={placement}
          state={state}
          listBoxStyles={listBoxStyles}
          overlayStyles={overlayStyles}
          optionStyles={optionStyles}
          minWidth={triggerWidth}
        />
      </OverlayWrapper>
    </SelectWrapperElement>
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
        labelProps,
        isDisabled,
        validationState,
        message,
        description,
        requiredMark,
        tooltip,
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
  shouldUseVirtualFocus = false,
  placement,
  minWidth,
  ...otherProps
}) {
  // Get props for the listbox
  let { listBoxProps } = useListBox(
    {
      autoFocus: state.focusStrategy || true,
      shouldUseVirtualFocus,
      ...otherProps,
    },
    state,
    listBoxRef,
  );

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
    <StyledOverlayElement
      {...overlayProps}
      {...parentOverlayProps}
      styles={overlayStyles}
      style={{
        '--overlay-min-width': minWidth ? `${minWidth}px` : 'initial',
        ...parentOverlayProps?.style,
      }}
      data-position={placement}
      ref={popoverRef}
    >
      <FocusScope restoreFocus>
        <DismissButton onDismiss={() => state.close()} />
        <ListBoxElement
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
        </ListBoxElement>
        <DismissButton onDismiss={() => state.close()} />
      </FocusScope>
    </StyledOverlayElement>
  );
}

function Option({ item, state, styles, shouldUseVirtualFocus }) {
  let ref = useRef<HTMLDivElement>(null);
  let isDisabled = state.disabledKeys.has(item.key);
  let isSelected = state.selectionManager.isSelected(item.key);
  let isVirtualFocused = state.selectionManager.focusedKey === item.key;

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
    <OptionElement
      {...mergeProps(optionProps, focusProps)}
      ref={ref}
      mods={{
        selected: isSelected,
        focused: shouldUseVirtualFocus ? isVirtualFocused : isFocused,
        disabled: isDisabled,
      }}
      data-theme={isSelected ? 'special' : undefined}
      styles={styles}
      key={item.key}
    >
      {item.rendered}
    </OptionElement>
  );
}

const _Select = forwardRef(Select);

(_Select as any).cubeInputType = 'Select';

const __Select = Object.assign(
  _Select as typeof _Select & {
    Item: typeof Item;
  },
  { Item },
);

export { __Select as Select };
