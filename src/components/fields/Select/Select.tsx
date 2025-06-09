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

import { DownIcon, LoadingIcon } from '../../../icons/index';
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
import { mergeProps, useCombinedRefs } from '../../../utils/react/index';
import { useFocus } from '../../../utils/react/interactions';
import { getOverlayTransitionCSS } from '../../../utils/transitions';
import {
  DEFAULT_BUTTON_STYLES,
  DEFAULT_CLEAR_STYLES,
  DEFAULT_LINK_STYLES,
  DEFAULT_NEUTRAL_STYLES,
  DEFAULT_OUTLINE_STYLES,
  DEFAULT_PRIMARY_STYLES,
  DEFAULT_SECONDARY_STYLES,
  SPECIAL_CLEAR_STYLES,
  SPECIAL_LINK_STYLES,
  SPECIAL_NEUTRAL_STYLES,
  SPECIAL_OUTLINE_STYLES,
  SPECIAL_PRIMARY_STYLES,
  SPECIAL_SECONDARY_STYLES,
} from '../../actions/index';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
import { OverlayWrapper } from '../../overlays/OverlayWrapper';
import { InvalidIcon } from '../../shared/InvalidIcon';
import { ValidIcon } from '../../shared/ValidIcon';
import { DEFAULT_INPUT_STYLES, INPUT_WRAPPER_STYLES } from '../index';

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
      overflow: 'hidden',
    },

    CaretIcon: {
      display: 'grid',
      placeItems: 'center',
      width: {
        '': '4x',
        '[data-size="small"]': '3x',
      },
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

type VariantType =
  | 'default.primary'
  | 'default.secondary'
  | 'default.outline'
  | 'default.neutral'
  | 'default.clear'
  | 'default.link'
  | 'special.primary'
  | 'special.secondary'
  | 'special.outline'
  | 'special.neutral'
  | 'special.clear'
  | 'special.link';

function WithValidationState(styles: Styles) {
  return {
    ...styles,
    border: {
      ...(typeof styles.border === 'object' ? styles.border : {}),
      invalid: '#danger-text',
      valid: '#success-text',
    },
  };
}

const SelectElement = tasty({
  as: 'button',
  qa: 'Button',
  styles: {
    ...INPUT_WRAPPER_STYLES,
    ...DEFAULT_BUTTON_STYLES,
    padding: 0,
    gap: 0,
  },
  variants: {
    // Default theme
    'default.primary': DEFAULT_PRIMARY_STYLES,
    'default.secondary': DEFAULT_SECONDARY_STYLES,
    'default.outline': WithValidationState(DEFAULT_OUTLINE_STYLES),
    'default.neutral': WithValidationState(DEFAULT_NEUTRAL_STYLES),
    'default.clear': WithValidationState(DEFAULT_CLEAR_STYLES),
    'default.link': DEFAULT_LINK_STYLES,

    // Special theme
    'special.primary': SPECIAL_PRIMARY_STYLES,
    'special.secondary': SPECIAL_SECONDARY_STYLES,
    'special.outline': WithValidationState(SPECIAL_OUTLINE_STYLES),
    'special.neutral': WithValidationState(SPECIAL_NEUTRAL_STYLES),
    'special.clear': WithValidationState(SPECIAL_CLEAR_STYLES),
    'special.link': SPECIAL_LINK_STYLES,
  },
});

const ListBoxElement = tasty({
  as: 'ul',
  styles: {
    display: 'flex',
    gap: '1bw',
    flow: 'column',
    margin: '0',
    padding: '.5x',
    listStyle: 'none',
    radius: '1cr',
    fill: '#white',
    shadow: '0px 4px 16px #shadow',
    height: 'initial 30x',
    overflow: 'clip auto',
    scrollbar: 'styled',
  },
});

const OptionElement = tasty({
  as: 'li',
  styles: {
    display: 'flex',
    flow: 'column',
    gap: '0',
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
    width: 'max 100%',

    Label: {
      preset: 't3',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      width: 'max 100%',
    },

    Description: {
      preset: 't4',
      color: '#dark-03',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      width: 'max 100%',
    },
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
    BaseStyleProps,
    OuterStyleProps,
    ColorStyleProps,
    FieldBaseProps,
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
  size?: 'small' | 'default' | 'large' | string;
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
    wrapperStyles,
    listBoxStyles,
    overlayStyles,
    suffix,
    message,
    description,
    direction = 'bottom',
    shouldFlip = true,
    placeholder,
    tooltip,
    size,
    styles,
    type = 'outline',
    theme = 'default',
    labelSuffix,
    suffixPosition = 'before',
    ...otherProps
  } = props;
  let state = useSelectState(props);

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
      styles={wrapperStyles}
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
        variant={`${theme}.${type}` as VariantType}
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
            <DownIcon />
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

  const description = (item as any)?.props?.description;

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
      <div data-element="Label">{item.rendered}</div>
      {description ? <div data-element="Description">{description}</div> : null}
    </OptionElement>
  );
}

const _Select = forwardRef(Select);

(_Select as any).cubeInputType = 'Select';

const __Select = Object.assign(
  _Select as typeof _Select & {
    Item: typeof Item;
  },
  {
    Item: Item as unknown as (props: {
      description?: ReactNode;
      [key: string]: any;
    }) => null,
  },
);

__Select.displayName = 'Select';

export { __Select as Select };

export type { AriaSelectProps };
export { useSelectState };
