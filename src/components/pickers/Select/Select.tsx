import {
  CheckOutlined,
  LoadingOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  cloneElement,
  forwardRef,
  ReactElement,
  ReactNode,
  RefObject,
  useMemo,
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
import { useFocus as useAriaFocus, useHover } from '@react-aria/interactions';
import { Item } from '@react-stately/collections';
import { DOMRef } from '@react-types/shared';
import styled from 'styled-components';

import { useFormProps } from '../../forms';
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
import { OverlayWrapper } from '../../overlays/OverlayWrapper';
import { FormFieldProps } from '../../../shared';
import { getOverlayTransitionCSS } from '../../../utils/transitions';
import { mergeProps, useCombinedRefs } from '../../../utils/react';
import {
  DEFAULT_INPUT_STYLES,
  INPUT_WRAPPER_STYLES,
} from '../../forms/TextInput/TextInputBase';
import { CubeButtonProps, provideButtonStyles } from '../../actions';

import type { AriaSelectProps } from '@react-types/select';

function CaretDownIcon() {
  return (
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
}

const SelectWrapperElement = tasty({
  styles: {
    display: 'grid',
    position: 'relative',
    radius: true,
    fill: {
      '': '#white',
      disabled: '#dark.04',
    },
    color: {
      '': '#dark.85',
      focused: '#dark.85',
      invalid: '#danger-text',
      disabled: '#dark.30',
    },

    Value: {
      ...DEFAULT_INPUT_STYLES,
      preset: {
        '': 't3',
        '[data-type="primary"]': 't3m',
      },
      color: 'inherit',
      opacity: {
        '': 1,
        placeholder: '.6',
      },
      textAlign: 'left',
      fill: '#clear',
    },

    CaretIcon: {
      display: 'grid',
      placeItems: 'center',
      width: 'min 4x',
      cursor: 'pointer',
      fontSize: 'inherit',
      lineHeight: 'inherit',
    },

    ButtonIcon: {
      display: 'grid',
      placeItems: 'center',
      width: 'min 4x',
      color: 'inherit',
      fontSize: '@icon-size',
      lineHeight: 'inherit',
    },
  },
});

const SelectElement = tasty({
  as: 'button',
  qa: 'Button',
  styles: {
    ...INPUT_WRAPPER_STYLES,
    preset: 't3m',
    cursor: 'pointer',
    padding: '0',
    border: {
      '': true,
      valid: '#success-text.50',
      invalid: '#danger-text.50',
      '[data-type="clear"]': '#clear',
      disabled: true,
    },
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
      disabled: '#dark.0',
    },
    color: {
      '': '#dark.75',
      'hovered | focused': '#dark.75',
      'pressed | selected': '#purple',
      disabled: '#dark.3',
    },
    preset: 't3',
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
  icon?: ReactElement;
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
  type?: CubeButtonProps['type'];
  suffixPosition?: 'before' | 'after';
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
    icon,
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
    type = 'neutral',
    theme,
    labelSuffix,
    suffixPosition = 'before',
    ...otherProps
  } = props;
  let state = useSelectState(props);
  const outerStyles = extractStyles(otherProps, OUTER_STYLES, styles);

  inputStyles = extractStyles(otherProps, BLOCK_STYLES, {
    ...(() => {
      let styles = provideButtonStyles({ type, theme });

      delete styles['border'];

      if (isDisabled || validationState === 'invalid') {
        styles.color = 'inherit';
      }

      return styles;
    })(),
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
    <WarningOutlined
      data-element="ValidationIcon"
      style={{ color: 'var(--danger-color)' }}
    />
  ) : (
    <CheckOutlined
      data-element="ValidationIcon"
      style={{ color: 'var(--success-color)' }}
    />
  );
  let validation = cloneElement(validationIcon);

  let triggerWidth = triggerRef?.current?.offsetWidth;

  if (icon) {
    icon = <div data-element="ButtonIcon">{icon}</div>;

    if (prefix) {
      prefix = (
        <>
          {icon}
          {prefix}
        </>
      );
    } else {
      prefix = icon;
    }
  }

  const showPlaceholder = !!placeholder?.trim() && !state.selectedItem;

  const modifiers = useMemo(
    () => ({
      invalid: isInvalid,
      valid: validationState === 'valid',
      disabled: isDisabled,
      loading: isLoading,
      hovered: isHovered,
      focused: isFocused,
      placeholder: showPlaceholder,
      prefix: !!prefix,
      suffix: true,
    }),
    [
      validationState,
      isDisabled,
      isLoading,
      isHovered,
      isFocused,
      showPlaceholder,
      prefix,
    ],
  );

  let selectField = (
    <SelectWrapperElement
      qa={qa || 'Select'}
      mods={modifiers}
      styles={outerStyles}
      data-size={size}
      data-type={type}
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
        data-type={type}
        mods={modifiers}
      >
        {prefix ? <div data-element="Prefix">{prefix}</div> : null}
        <span data-element="Value" {...valueProps}>
          {state.selectedItem
            ? state.selectedItem.rendered
            : placeholder || <>&nbsp;</>}
        </span>
        <div data-element="Suffix">
          {suffixPosition === 'before' ? suffix : null}
          {validationState && !isLoading ? validation : null}
          {isLoading && <LoadingOutlined />}
          {suffixPosition === 'after' ? suffix : null}
          <div data-element="CaretIcon">
            <CaretDownIcon />
          </div>
        </div>
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
        labelSuffix,
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
      ref={popoverRef}
      styles={overlayStyles}
      style={{
        '--overlay-min-width': minWidth ? `${minWidth}px` : 'initial',
        ...parentOverlayProps?.style,
      }}
      data-position={placement}
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
      key={item.key}
      mods={{
        selected: isSelected,
        focused: shouldUseVirtualFocus ? isVirtualFocused : isFocused,
        disabled: isDisabled,
      }}
      data-theme={isSelected ? 'special' : undefined}
      styles={styles}
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
