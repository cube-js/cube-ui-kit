import { AriaLabelingProps, CollectionBase, DOMRef } from '@react-types/shared';
import React, {
  cloneElement,
  forwardRef,
  ReactElement,
  ReactNode,
  RefObject,
  useEffect,
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
  useListBoxSection,
  useOption,
  useOverlay,
  useOverlayPosition,
  useSelect,
} from 'react-aria';
import { Section as BaseSection, useSelectState } from 'react-stately';
import { CubeTooltipProviderProps } from 'src/components/overlays/Tooltip/TooltipProvider';
import styled from 'styled-components';

import { DirectionIcon, LoadingIcon } from '../../../icons/index';
import { useProviderProps } from '../../../provider';
import { FieldBaseProps } from '../../../shared/index';
import {
  BASE_STYLES,
  BasePropsWithoutChildren,
  BaseStyleProps,
  COLOR_STYLES,
  ColorStyleProps,
  extractStyles,
  OUTER_STYLES,
  OuterStyleProps,
  Props,
  Styles,
  tasty,
} from '../../../tasty/index';
import { generateRandomId } from '../../../utils/random';
import { mergeProps, useCombinedRefs } from '../../../utils/react/index';
import { useFocus } from '../../../utils/react/interactions';
import { useEventBus } from '../../../utils/react/useEventBus';
import { getOverlayTransitionCSS } from '../../../utils/transitions';
import {
  StyledDivider as ListDivider,
  StyledSectionHeading as ListSectionHeading,
  StyledSection as ListSectionWrapper,
} from '../../actions/Menu/styled';
import { ItemBase } from '../../content/ItemBase';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
import { Item } from '../../Item';
import { OverlayWrapper } from '../../overlays/OverlayWrapper';
import { InvalidIcon } from '../../shared/InvalidIcon';
import { ValidIcon } from '../../shared/ValidIcon';

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
  },
});

const SelectTrigger = tasty(ItemBase, {
  as: 'button',
  qa: 'Trigger',
  styles: {
    reset: 'button',

    Label: {
      opacity: {
        '': 1,
        placeholder: '$disabled-opacity',
      },
    },
  },
});

export const ListBoxElement = tasty({
  as: 'ul',
  styles: {
    display: 'flex',
    gap: '1bw',
    flow: 'column',
    margin: '0',
    padding: {
      '': '.5x',
      section: 0,
    },
    listStyle: 'none',
    radius: {
      '': '1cr',
      section: '0',
    },
    border: {
      '': true,
      section: false,
    },
    fill: '#white',
    shadow: {
      '': '0px 4px 16px #shadow',
      section: false,
    },
    height: 'initial max-content (50vh - $size-md)',
    overflow: 'clip auto',
    scrollbar: 'styled',
  },
});

// Use ItemBase for options to unify item visuals and reduce custom styling
const OptionItem = tasty(ItemBase, {
  as: 'li',
  qa: 'Option',
  styles: {
    '$inline-compensation': '0px',
  },
});

const OverlayElement = tasty({
  styles: {
    position: 'absolute',
    width: 'min $overlay-min-width',
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
    BaseStyleProps,
    OuterStyleProps,
    ColorStyleProps,
    Omit<FieldBaseProps, 'tooltip'>,
    CollectionBase<T>,
    Omit<AriaSelectProps<T>, 'errorMessage'> {
  icon?: ReactElement;
  rightIcon?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Description text for the trigger. Note: Different from field-level description. */
  description?: ReactNode;
  descriptionPlacement?: 'inline' | 'block' | 'auto';
  /** Keyboard shortcut that triggers the select when pressed */
  hotkeys?: string;
  /**
   * Tooltip content and configuration for the trigger:
   * - string: simple tooltip text
   * - true: auto tooltip on overflow (shows selected value as tooltip when truncated)
   * - object: advanced configuration with optional auto property
   */
  tooltip?:
    | string
    | boolean
    | (Omit<CubeTooltipProviderProps, 'children'> & { auto?: boolean });
  triggerRef?: RefObject<HTMLButtonElement>;
  isLoading?: boolean;
  loadingIndicator?: ReactNode;
  overlayOffset?: number;
  hideTrigger?: boolean;
  /**
   *  @deprecated Use `triggerStyles` instead
   */
  inputStyles?: Styles;
  optionStyles?: Styles;
  triggerStyles?: Styles;
  listBoxStyles?: Styles;
  overlayStyles?: Styles;
  /**
   *  @deprecated Use `styles` instead
   */
  wrapperStyles?: Styles;
  direction?: 'top' | 'bottom';
  shouldFlip?: boolean;
  inputProps?: Props;
  type?: 'outline' | 'clear' | 'primary' | (string & {});
  suffixPosition?: 'before' | 'after';
  theme?: 'default' | 'special';
}

export interface CubeSelectProps<T> extends CubeSelectBaseProps<T> {
  popoverRef?: RefObject<HTMLInputElement>;
  /** The ref for the list box. */
  listBoxRef?: RefObject<HTMLElement>;
  size?: 'small' | 'medium' | 'large' | (string & {});
  placeholder?: string;
}

const PROP_STYLES = [...BASE_STYLES, ...OUTER_STYLES, ...COLOR_STYLES];

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
    rightIcon,
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
    triggerStyles,
    optionStyles,
    wrapperStyles,
    listBoxStyles,
    overlayStyles,
    suffix,
    message,
    description,
    descriptionPlacement,
    hotkeys,
    direction = 'bottom',
    shouldFlip = true,
    placeholder,
    tooltip,
    size = 'medium',
    styles,
    type = 'outline',
    theme = 'default',
    labelSuffix,
    suffixPosition = 'before',
    ...otherProps
  } = props;
  let state = useSelectState(props);

  // Generate a unique ID for this select instance
  const selectId = useMemo(() => generateRandomId(), []);

  // Get event bus for menu synchronization
  const { emit, on } = useEventBus();

  // Listen for other menus opening and close this one if needed
  useEffect(() => {
    const unsubscribe = on('menu:open', (data: { menuId: string }) => {
      // If another menu is opening and this select is open, close this one
      if (data.menuId !== selectId && state.isOpen) {
        state.close();
      }
    });

    return unsubscribe;
  }, [on, selectId, state]);

  // Emit event when this select opens
  useEffect(() => {
    if (state.isOpen) {
      emit('menu:open', { menuId: selectId });
    }
  }, [state.isOpen, emit, selectId]);

  styles = extractStyles(otherProps, PROP_STYLES, styles);

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

  suffix = useMemo(() => {
    if (!suffix && !validationState) {
      return null;
    }

    return (
      <>
        {suffix}
        {validationState ? validation : null}
      </>
    );
  }, [suffix, validationState, validation]);

  let selectField = (
    <SelectWrapperElement
      qa={qa || 'Select'}
      mods={modifiers}
      styles={{ ...wrapperStyles, ...styles }}
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
      <SelectTrigger
        {...mergeProps(buttonProps, hoverProps, focusProps)}
        ref={triggerRef}
        data-popover-trigger
        styles={{ ...inputStyles, ...triggerStyles }}
        theme={theme}
        size={size}
        // Ensure this button never submits a surrounding form in tests or runtime
        buttonType="button"
        // Preserve visual variant via data attribute instead of conflicting with HTML attribute
        type={type}
        mods={modifiers}
        prefix={prefix}
        suffix={suffix}
        icon={icon}
        rightIcon={
          rightIcon !== undefined ? (
            rightIcon
          ) : isLoading ? (
            <LoadingIcon />
          ) : (
            <DirectionIcon to={state.isOpen ? 'up' : 'down'} />
          )
        }
        description={description}
        descriptionPlacement={descriptionPlacement}
        hotkeys={hotkeys}
        tooltip={tooltip}
        labelProps={valueProps}
      >
        {state.selectedItem
          ? state.selectedItem.rendered
          : placeholder || <>&nbsp;</>}
      </SelectTrigger>
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
          triggerRef={triggerRef}
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
  size = 'small',
  triggerRef,
  ...otherProps
}) {
  // For trigger+popover components, map 'small' size to 'medium' for list items
  // while preserving 'medium' and 'large' sizes
  const listItemSize = size === 'small' ? 'medium' : size;
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
      shouldCloseOnInteractOutside: (el) => {
        const menuTriggerEl = el.closest('[data-popover-trigger]');
        // If no menu trigger was clicked, allow closing
        if (!menuTriggerEl) return true;
        // If the same trigger that opened this select was clicked, allow closing
        if (menuTriggerEl === triggerRef?.current) return true;
        // Otherwise, don't close (let event mechanism handle it)
        return false;
      },
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
        {(() => {
          const hasSections = Array.from(state.collection).some(
            (i: any) => i.type === 'section',
          );

          const renderedItems: React.ReactNode[] = [];
          let isFirstSection = true;

          for (const item of state.collection) {
            if (item.type === 'section') {
              if (!isFirstSection) {
                renderedItems.push(
                  <ListDivider
                    key={`divider-${String(item.key)}`}
                    as="li"
                    role="separator"
                    aria-orientation="horizontal"
                  />,
                );
              }

              renderedItems.push(
                <SelectSection
                  key={item.key}
                  item={item}
                  state={state}
                  optionStyles={optionStyles}
                  sectionStyles={undefined}
                  shouldUseVirtualFocus={shouldUseVirtualFocus}
                  size={listItemSize}
                />,
              );

              isFirstSection = false;
            } else {
              renderedItems.push(
                <Option
                  key={item.key}
                  item={item}
                  state={state}
                  styles={optionStyles}
                  shouldUseVirtualFocus={shouldUseVirtualFocus}
                  size={listItemSize}
                />,
              );
            }
          }

          return (
            <ListBoxElement
              styles={listBoxStyles}
              {...listBoxProps}
              ref={listBoxRef}
              mods={{ sections: hasSections }}
            >
              {renderedItems}
            </ListBoxElement>
          );
        })()}
        <DismissButton onDismiss={() => state.close()} />
      </FocusScope>
    </StyledOverlayElement>
  );
}

function Option({ item, state, styles, shouldUseVirtualFocus, size }) {
  let ref = useRef<HTMLLIElement>(null);
  let isDisabled = state.disabledKeys.has(item.key);
  let isSelected = state.selectionManager.isSelected(item.key);
  let isVirtualFocused = state.selectionManager.focusedKey === item.key;

  let { optionProps, isPressed, labelProps, descriptionProps } = useOption(
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

  const {
    qa,
    description,
    icon,
    prefix,
    suffix,
    rightIcon,
    descriptionPlacement,
    tooltip,
    styles: itemStyles,
  } = ((item as any)?.props || {}) as {
    description?: React.ReactNode;
    icon?: React.ReactElement;
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
    rightIcon?: React.ReactElement;
    styles?: Styles;
    descriptionPlacement?: 'inline' | 'block' | 'auto';
    tooltip?:
      | string
      | boolean
      | (Omit<CubeTooltipProviderProps, 'children'> & { auto?: boolean });
    qa?: string;
  };

  return (
    <OptionItem
      {...mergeProps(optionProps, focusProps)}
      ref={ref}
      qa={qa}
      mods={{
        selected: isSelected,
        focused: shouldUseVirtualFocus ? isVirtualFocused : isFocused,
        disabled: isDisabled,
        pressed: isPressed,
      }}
      data-size={size}
      styles={{ ...(styles as Styles), ...(itemStyles as Styles) }}
      icon={icon}
      prefix={prefix}
      suffix={suffix}
      rightIcon={rightIcon}
      description={description}
      descriptionPlacement={descriptionPlacement}
      labelProps={labelProps}
      descriptionProps={descriptionProps}
      tooltip={tooltip}
      defaultTooltipPlacement="right"
    >
      {item.rendered}
    </OptionItem>
  );
}

interface SelectSectionProps<T> {
  item: any; // react-stately Node<T>
  state: any; // TreeState<T>
  optionStyles?: Styles;
  headingStyles?: Styles;
  sectionStyles?: Styles;
  shouldUseVirtualFocus?: boolean;
  size?: string;
}

function SelectSection<T>(props: SelectSectionProps<T>) {
  const {
    item,
    state,
    optionStyles,
    headingStyles,
    sectionStyles,
    shouldUseVirtualFocus,
    size,
  } = props;

  const heading = item.rendered;

  const { itemProps, headingProps, groupProps } = useListBoxSection({
    heading,
    'aria-label': item['aria-label'],
  });

  return (
    <ListSectionWrapper {...itemProps} styles={sectionStyles}>
      {heading && (
        <ListSectionHeading
          {...headingProps}
          size={size}
          styles={{ ...headingStyles, '$inline-compensation': '0px' }}
        >
          {heading}
        </ListSectionHeading>
      )}
      <ListBoxElement {...groupProps} mods={{ section: true }}>
        {[...item.childNodes]
          .filter((node: any) => state.collection.getItem(node.key))
          .map((node: any) => (
            <Option
              key={node.key}
              item={node}
              state={state}
              styles={optionStyles}
              shouldUseVirtualFocus={shouldUseVirtualFocus}
              size={size}
            />
          ))}
      </ListBoxElement>
    </ListSectionWrapper>
  );
}

const _Select = forwardRef(Select);

(_Select as any).cubeInputType = 'Select';

type SectionComponent = typeof BaseSection;

const SelectSectionComponent = Object.assign(BaseSection, {
  displayName: 'Section',
}) as SectionComponent;

const __Select = Object.assign(
  _Select as typeof _Select & {
    Item: typeof Item;
    Section: typeof SelectSectionComponent;
  },
  {
    Item,
    Section: SelectSectionComponent,
  },
);

__Select.displayName = 'Select';

export { __Select as Select };

export type { AriaSelectProps };
export { useSelectState };
