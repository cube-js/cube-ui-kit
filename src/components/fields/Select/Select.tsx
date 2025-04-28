import { AriaLabelingProps, CollectionBase, DOMRef } from '@react-types/shared';
import {
  cloneElement,
  forwardRef,
  ReactElement,
  ReactNode,
  RefObject,
  useMemo,
  useRef,
} from 'react';
import {
  AriaSelectProps,
  DismissButton,
  FocusScope,
  HiddenSelect,
  useButton,
  useHover,
  useListBox,
  useOption,
  useOverlay,
  useOverlayPosition,
  useSelect,
} from 'react-aria';
import { Item, useSelectState } from 'react-stately';
import styled from 'styled-components';

import { LoadingIcon } from '../../../icons/index';
import { useProviderProps } from '../../../provider';
import { FieldBaseProps } from '../../../shared/index';
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
} from '../../../tasty/index';
import { mergeProps, useCombinedRefs } from '../../../utils/react/index';
import { useFocus } from '../../../utils/react/interactions';
import { getOverlayTransitionCSS } from '../../../utils/transitions';
import { DEFAULT_BUTTON_STYLES } from '../../actions/index';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
import { OverlayWrapper } from '../../overlays/OverlayWrapper';
import { InvalidIcon } from '../../shared/InvalidIcon';
import { ValidIcon } from '../../shared/ValidIcon';
import { DEFAULT_INPUT_STYLES, INPUT_WRAPPER_STYLES } from '../index';

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
      '[data-theme="special"]': '#clear',
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
      textOverflow: 'ellipsis',
      overflow: {
        '': 'initial',
        ellipsis: 'hidden',
      },
    },

    CaretIcon: {
      display: 'grid',
      placeItems: 'center',
      width: 'min 4x',
      cursor: 'pointer',
      fontSize: 'inherit',
    },

    ButtonIcon: {
      display: 'grid',
      placeItems: 'center',
      width: 'min 4x',
      color: 'inherit',
      fontSize: '@icon-size',
    },
  },
});

const SelectElement = tasty({
  as: 'button',
  qa: 'Button',
  styles: {
    ...INPUT_WRAPPER_STYLES,
    ...DEFAULT_BUTTON_STYLES,
    preset: 't3m',
    cursor: 'pointer',
    padding: '0',
    gap: '0',
    border: {
      '': true,
      valid: '#success-text.50',
      invalid: '#danger-text.50',
      '[data-type="primary"]': '#clear',
      '[data-type="clear"]': '#clear',
      '[data-theme="special"] & [data-type="secondary"] & pressed': '#white.44',
      disabled: true,
    },
    fill: {
      '': '#clear',
      '[data-type="primary"]': '#purple',
      '[data-type="primary"] & pressed': '#purple',
      '[data-type="primary"] & hovered': '#purple-text',

      '[data-type="secondary"]': '#dark.0',
      '[data-type="secondary"] & hovered': '#dark.04',
      '[data-type="secondary"] & pressed': '#dark.05',

      '[disabled]': '#dark.04',

      '([data-type="clear"] | [data-type="outline"])': '#purple.0',
      '([data-type="clear"] | [data-type="outline"]) & hovered': '#purple.16',
      '([data-type="clear"] | [data-type="outline"]) & pressed': '#purple.10',
      '([data-type="clear"] | [data-type="outline"]) & [disabled]': '#purple.0',

      // special
      '[data-theme="special"] & [data-type="secondary"]': '#white.12',

      '[data-theme="special"] & [data-type="clear"]': '#white',
      '[data-theme="special"] & [data-type="clear"] & hovered': '#white.94',
      '[data-theme="special"] & [data-type="clear"] & pressed': '#white',

      '[data-theme="special"] & [disabled]': '#white.12',

      '[data-theme="special"] & [data-type="clear"] & [disabled]': '#white.0',
    },
    color: {
      '': '#white',

      '[data-type="secondary"]': '#dark-02',
      '[data-type="secondary"] & hovered': '#dark-02',
      '[data-type="clear"]': '#purple-text',
      '[data-type="secondary"] & pressed': '#purple',

      '[disabled]': '#dark.30',

      // special
      '[data-theme="special"]': '#white',
      '[data-theme="special"] & [data-type="clear"]': '#purple',

      // other
      '[data-theme="special"] & [disabled]': '#white.30',
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
    radius: '@large-radius',
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
      'pressed | selected': '#purple.10',
      'hovered | focused': '#dark.04',
      disabled: '#dark.0',
    },
    color: {
      '': '#dark-02',
      'hovered | focused': '#dark-02',
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
    AriaLabelingProps,
    OuterStyleProps,
    FieldBaseProps,
    BlockStyleProps,
    CollectionBase<T>,
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
  type?: 'secondary' | 'clear' | 'primary' | (string & {});
  suffixPosition?: 'before' | 'after';
}

export interface CubeSelectProps<T> extends CubeSelectBaseProps<T> {
  popoverRef?: RefObject<HTMLInputElement>;
  /** The ref for the list box. */
  listBoxRef?: RefObject<HTMLElement>;
  size?: 'small' | 'default' | 'large' | string;
  ellipsis?: boolean;
  placeholder?: string;
}

function Select<T extends object>(
  props: CubeSelectProps<T>,
  ref: DOMRef<HTMLDivElement>,
) {
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onChange',
    valuePropsMapper: ({ value, onChange }) => ({
      selectedKey: value ?? null,
      onSelectionChange: onChange,
    }),
  });

  let {
    qa,
    label,
    extra,
    icon,
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
    placeholder,
    tooltip,
    size,
    styles,
    type = 'secondary',
    theme = 'default',
    labelSuffix,
    ellipsis,
    suffixPosition = 'before',
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

  let validationIcon = isInvalid ? InvalidIcon : ValidIcon;
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
      ellipsis,
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
      ellipsis,
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
      data-theme={theme}
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
        data-theme={theme}
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
          {isLoading && <LoadingIcon />}
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

  return wrapWithField<Omit<CubeSelectProps<T>, 'children'>>(
    selectField,
    ref,
    mergeProps(
      {
        ...props,
        styles,
      },
      { labelProps },
    ),
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
          {...listBoxProps}
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

  // Handle focus events, so we can apply highlighted
  // style to the focused option
  let { isFocused, focusProps } = useFocus({ isDisabled });

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

__Select.displayName = 'Select';

export { __Select as Select };

export type { AriaSelectProps };
export { useSelectState };
