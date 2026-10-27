import { AriaLabelingProps, CollectionBase, Key } from '@react-types/shared';
import { BasePropsWithoutChildren, Styles, tasty } from '@tenphi/tasty';
import React, {
  cloneElement,
  ForwardedRef,
  forwardRef,
  ForwardRefRenderFunction,
  KeyboardEvent,
  ReactElement,
  ReactNode,
  RefObject,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
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
import {
  Section as BaseSection,
  SelectState,
  useSelectState,
} from 'react-stately';

import { useI18n } from '../../../i18n';
import { CloseIcon } from '../../../icons/CloseIcon';
import { DirectionIcon } from '../../../icons/DirectionIcon';
import { LoadingIcon } from '../../../icons/LoadingIcon';
import { FieldBaseProps } from '../../../shared/index';
import { generateRandomId } from '../../../utils/random';
import { mergeProps, useCombinedRefs } from '../../../utils/react/index';
import { useFocus } from '../../../utils/react/interactions';
import { focusProgrammatically } from '../../../utils/react/programmaticFocus';
import { mergeRefs } from '../../../utils/react/useCombinedRefs';
import { useOverlayEscapeGuard } from '../../../utils/react/useOverlayEscapeGuard';
import { usePopoverSync } from '../../../utils/react/usePopoverSync';
import { mergeStyleLayers } from '../../../utils/styles';
import { isOwnActionsPress } from '../../actions/actions-run';
import { ItemAction } from '../../actions/ItemAction/ItemAction';
import { ItemActionsWrapper } from '../../actions/ItemActionsWrapper';
import {
  StyledDivider as ListDivider,
  StyledSectionHeading as ListSectionHeading,
  StyledSection as ListSectionWrapper,
} from '../../actions/Menu/styled';
import {
  CollectionItem,
  filterCollectionItemProps,
  filterSelectionItemProps,
  getValueSelectionState,
} from '../../CollectionItem';
import { CubeItemProps, Item } from '../../content/Item';
import { Text } from '../../content/Text';
import {
  getValidationIcon,
  getValidationMods,
  useFieldProps,
  wrapWithField,
} from '../../form';
import {
  FieldLayoutStyleProps,
  splitFieldLayout,
} from '../../form/field-layout';
import { DisplayTransition } from '../../helpers';
import { useModalLayerRef } from '../../overlays/Modal/modal-containment';
import { CubeTooltipProviderProps } from '../../overlays/Tooltip/TooltipProvider';
import { Portal } from '../../portal';
import { useOptionOriginPress } from '../option-origin-press';
import { TriggerActions, TriggerIcon } from '../TriggerActions';

import type { Placement } from 'react-aria';
import type { Props } from '../../../props';

const SelectWrapperElement = tasty({
  qa: 'SelectWrapper',
  styles: {
    display: 'grid',
    position: 'relative',
    radius: true,
    fill: {
      '': '#surface',
      disabled: '#disabled-surface',
      'theme=special': '#clear',
    },
    color: {
      '': '#dark.85',
      focused: '#dark.85',
      invalid: '#danger-text',
      disabled: '#disabled-surface-text',
    },
  },
});

export const ListBoxElement = tasty({
  qa: 'ListBox',
  as: 'ul',
  styles: {
    // Set from `listGap`. A section's list inherits it from the popup's.
    '$list-gap': { '': '$item-gap', section: false },
    display: 'flex',
    // It spaces options: sections and dividers keep a hairline.
    gap: { '': '$list-gap', sections: '$item-gap' },
    flow: 'column',
    margin: '0',
    padding: '0',
    listStyle: 'none',
    // The popup's list is the scroll container and the element its height
    // limit lands on, so React Aria's page navigation measures what is
    // actually visible. A section's list grows with its options.
    overflow: { '': 'auto', section: false },
    // Options measure their scroll offset against the list.
    position: 'relative',
    scrollbar: 'styled',
    // The listbox is programmatically focused when the popover opens
    // (so keyboard nav works immediately) but it should never display a
    // focus ring — only the focused option does. Without this, the
    // browser draws its native outline around the whole listbox when
    // it receives focus.
    outline: 0,
  },
});

// Use Item for options to unify item visuals and reduce custom styling
const OptionItem = tasty(Item, {
  as: 'li',
  disableActionsFocus: true,
  qa: 'Option',
  styles: {
    '$inline-compensation': '0px',
  },
});

const SelectOverlayWrapper = tasty({
  qa: 'SelectOverlayWrapper',
  styles: {
    position: 'absolute',
    zIndex: 1000,
    // React Aria writes the room left in the viewport as this element's
    // `max-height`; a flex column lets the popup shrink to it.
    display: 'flex',
    flow: 'column',
  },
});

const OverlayElement = tasty({
  qa: 'SelectOverlay',
  styles: {
    width: 'min $overlay-min-width',
    display: 'grid',
    gridRows: '1sf',
    height: 'initial max-content (50vh - 5x)',
    overflow: 'auto',
    fill: '#surface',
    radius: '1cr',
    shadow: true,
    padding: '.5x',
    border: true,
    boxSizing: 'border-box',
    transition:
      'translate $transition ease-out, scale $transition ease-out, theme $transition ease-out',
    translate: {
      '': '0 0',
      'open & [data-placement="top"]': '0 0',
      '!open & [data-placement="top"]': '0 1x',
      'open & ([data-placement="bottom"] | ![data-placement])': '0 0',
      '!open & ([data-placement="bottom"] | ![data-placement])': '0 -1x',
    },
    transformOrigin: {
      '': 'top center',
      '[data-placement="top"]': 'bottom center',
    },
    scale: {
      '': '1 1',
      '!open': '1 .9',
    },
    opacity: {
      '': 1,
      '!open': 0.001,
    },
  },
});

export interface CubeSelectBaseProps<T>
  extends
    BasePropsWithoutChildren,
    AriaLabelingProps,
    FieldLayoutStyleProps,
    FieldBaseProps<Key | null | undefined>,
    CollectionBase<T>,
    Omit<
      AriaSelectProps<T>,
      | 'errorMessage'
      | 'form'
      | 'name'
      | 'selectedKey'
      | 'defaultSelectedKey'
      | 'onSelectionChange'
    > {
  /** The currently selected key in the collection (controlled). */
  selectedKey?: Key | null;
  /** The initial selected key in the collection (uncontrolled). */
  defaultSelectedKey?: Key;
  /** Handler that is called when the selection changes. */
  onSelectionChange?: (key: Key | null) => void;
  icon?: ReactElement;
  rightIcon?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Description text for the trigger. Note: Different from field-level description. */
  triggerDescription?: ReactNode;
  descriptionPlacement?: 'inline' | 'block';
  /** Keyboard shortcut that triggers the select when pressed */
  hotkeys?: string;
  /**
   * Tooltip content and configuration for the trigger. The info badge next to
   * the field's label is `labelTooltip`.
   * - string: simple tooltip text
   * - true: auto tooltip on overflow (shows selected value as tooltip when truncated)
   * - object: advanced configuration with optional auto property
   */
  tooltip?:
    | string
    | boolean
    | (Omit<CubeTooltipProviderProps, 'children'> & { auto?: boolean });
  triggerRef?: RefObject<HTMLButtonElement>;
  /**
   * Shows a loading indicator in the trigger. The value can't change while
   * loading: the list doesn't open and typeahead is ignored.
   */
  isLoading?: boolean;
  /** Replaces the default loading icon shown while `isLoading` is set. */
  loadingIndicator?: ReactNode;
  overlayOffset?: number;
  /**
   * @deprecated Has no effect: the whole Select is its trigger. To hide the
   * dropdown caret, pass `rightIcon={null}`.
   */
  hideTrigger?: boolean;
  /**
   *  @deprecated Use `triggerStyles` instead
   */
  inputStyles?: Styles;
  optionStyles?: Styles;
  triggerStyles?: Styles;
  listBoxStyles?: Styles;
  /** Space between options, in pixels. Defaults to a hairline (`$item-gap`, `1px`). */
  listGap?: number;
  overlayStyles?: Styles;
  direction?: 'top' | 'bottom';
  /**
   * The ref of the element the popover should visually attach itself to.
   * Defaults to the trigger button.
   *
   * Only the popover's POSITION follows this ref. The trigger keeps its own
   * ref for focus, outside-click and dismiss logic, so anchoring to a wider
   * container does not make clicks inside that container count as trigger
   * presses. The popover's `minWidth` also stays tied to the trigger, not to
   * this element.
   */
  targetRef?: RefObject<HTMLElement | null>;
  /**
   * Placement of the popover relative to the anchor.
   * Accepts React Aria's `Placement` strings (e.g. `'bottom start'`,
   * `'top start'`, `'right top'`, `'left top'`).
   *
   * Overrides `direction` when both are given.
   * @default `${direction} end`
   */
  placement?: Placement;
  shouldFlip?: boolean;
  /** Minimum padding in pixels between the popover and viewport edges */
  containerPadding?: number;
  /** Additional props for the trigger button element. */
  inputProps?: Props;
  type?: 'outline' | 'outline-2' | 'clear' | 'primary' | (string & {});
  /**
   * Shape of the trigger's border radius.
   * - `card` - Card shape with larger border radius (`1cr`)
   * - `button` - Button shape with default border radius (default)
   * - `sharp` - Sharp corners with no border radius (`0`)
   * - `pill` - Pill shape with fully rounded ends (`round`)
   * @default "button"
   */
  shape?: 'card' | 'button' | 'sharp' | 'pill';
  suffixPosition?: 'before' | 'after';
  theme?: 'default' | 'special';
  /** Whether the select is clearable using a clear button in the rightIcon slot */
  isClearable?: boolean;
  /** Accessible name for the built-in clear button. Defaults to a localized "Clear value". */
  clearLabel?: string;
  /** Callback called when the clear button is pressed */
  onClear?: () => void;
  /**
   * Custom actions rendered inside the trigger, to the left of the built-in
   * clear button and dropdown caret. Use `Select.Action` so they match the
   * trigger's size and theme.
   *
   * Pressing one runs its handler without opening or closing the popover —
   * including while the popover is open. Actions follow the trigger's disabled
   * state but NOT `isReadOnly`, since a read-only field can still host an
   * action that does not change the value; pass `isDisabled` yourself for one
   * that does.
   */
  actions?: ReactNode;
  /** Callback called when the popover open state changes */
  onOpenChange?: (isOpen: boolean) => void;
}

export interface CubeSelectProps<T> extends CubeSelectBaseProps<T> {
  /** The ref for the popover element. */
  popoverRef?: RefObject<HTMLElement | null>;
  /** The ref for the list box. */
  listBoxRef?: RefObject<HTMLElement>;
  size?: 'small' | 'medium' | 'large' | (string & {});
  placeholder?: string;
}

const ignore = () => {};

/**
 * A state whose value can't change. React Aria's trigger opens the list,
 * steps with `ArrowLeft`/`ArrowRight` and typeaheads through these methods,
 * so ignoring them fixes the value while the trigger stays focusable.
 */
function lockSelectState<S extends SelectState<object>>(state: S): S {
  return {
    ...state,
    open: ignore,
    toggle: ignore,
    setSelectedKey: ignore,
    setValue: ignore,
  };
}

function Select<T extends object>(
  rawProps: CubeSelectProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  let props = useFieldProps(rawProps, {
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
    isInvalid,
    isValid,
    prefix,
    isDisabled = props.isLoading || false,
    autoFocus,
    inputProps,
    triggerRef: triggerRefProp,
    popoverRef,
    listBoxRef,
    isLoading,
    loadingIndicator,
    overlayOffset = 8,
    inputStyles,
    triggerStyles,
    optionStyles,
    listBoxStyles,
    listGap,
    overlayStyles,
    suffix,
    actions,
    message,
    triggerDescription,
    descriptionPlacement,
    hotkeys,
    direction = 'bottom',
    targetRef,
    placement: placementProp,
    shouldFlip = true,
    containerPadding = 8,
    placeholder,
    tooltip,
    size = 'medium',
    shape,
    styles,
    type = 'outline',
    theme = 'default',
    labelSuffix,
    suffixPosition = 'before',
    isClearable,
    clearLabel,
    onOpenChange,
    form,
  } = props;
  const { t } = useI18n();
  // `useSelectState` reports `onOpenChange` itself, once per transition.
  let state = getValueSelectionState(useSelectState(props));
  // Read-only and loading keep the trigger focusable, but its value is fixed.
  const isLocked = !!props.isReadOnly || !!isLoading;

  if (isLocked) state = lockSelectState(state);

  // Generate a unique ID for this select instance
  const selectId = useMemo(() => generateRandomId(), []);

  // A list that can no longer change the value closes rather than staying open
  // behind a hidden popup, so `aria-expanded` follows and enabling the field
  // again doesn't bring the list back.
  const isInert = isLocked || isDisabled;
  const closeList = useEffectEvent(() => state.close());

  useEffect(() => {
    if (isInert && state.isOpen) closeList();
  }, [isInert, state.isOpen]);

  const fieldLayout = splitFieldLayout(props);

  styles = fieldLayout.styles;

  ref = useCombinedRefs(ref);
  const triggerRef = useCombinedRefs(triggerRefProp);
  popoverRef = useCombinedRefs(popoverRef);
  listBoxRef = useCombinedRefs(listBoxRef);

  usePopoverSync({
    menuId: selectId,
    isOpen: state.isOpen,
    onClose: () => state.close(),
    triggerRef: triggerRef as RefObject<HTMLElement | null>,
    containerRef: popoverRef as RefObject<HTMLElement | null>,
  });

  // Hand focus back to the trigger the moment the list closes, rather than
  // leaving it to the popup's `FocusScope`, which only restores when it
  // UNMOUNTS — at the end of the exit transition (CUB-4839).
  //
  // For the length of that transition focus would otherwise sit on an option
  // inside a popup that is going away, and the key a user presses next can
  // land nowhere at all: once the option is detached focus drops to `<body>`,
  // which takes the event out of the React tree entirely.
  //
  // `focusProgrammatically` so the trigger's tooltip does not read this as the
  // user arriving and pop up — it would then swallow that next `Escape`.
  //
  // Guarded on focus still being INSIDE the popup, so this only finishes a
  // hand-off the popup had already started: closing by clicking elsewhere
  // leaves focus wherever the user put it.
  useEffect(() => {
    if (state.isOpen) return;

    const popover = popoverRef.current;
    const active = document.activeElement;

    if (!popover || !active || !popover.contains(active)) return;

    focusProgrammatically(triggerRef.current, { preventScroll: true });
    // Both refs come from `useCombinedRefs`, so their identity never changes;
    // listing them satisfies the rule without re-running this.
  }, [state.isOpen, popoverRef, triggerRef]);

  // React Aria hands `form` to `HiddenSelect` as the id of its `<form>`, so the
  // form instance would render as `form="[object Object]"` on the `<select>`.
  let { labelProps, triggerProps, valueProps, menuProps } = useSelect(
    { ...props, form: undefined },
    state,
    triggerRef,
  );

  let { overlayProps, placement } = useOverlayPosition({
    // Position only. `triggerRef` stays the dismiss/focus anchor below, so a
    // consumer can line this popover up with a row without that row's clicks
    // reading as presses on the trigger.
    targetRef: (targetRef ?? triggerRef) as RefObject<HTMLElement>,
    overlayRef: popoverRef,
    scrollRef: listBoxRef,
    placement: placementProp ?? (`${direction} end` as Placement),
    shouldFlip: shouldFlip,
    isOpen: state.isOpen,
    onClose: state.close,
    offset: overlayOffset,
    containerPadding: containerPadding,
  });

  let { isFocused, focusProps } = useFocus(true);
  let { hoverProps, isHovered } = useHover({ isDisabled });

  // Get props for the button based on the trigger props from useSelect
  let { buttonProps } = useButton({ ...triggerProps, autoFocus }, triggerRef);

  let validationIcon = getValidationIcon({ isInvalid, isValid });

  // Clear button logic
  let hasSelection = state.selectedItem != null;
  let showClearButton = isClearable && hasSelection && !isInert;

  function clearValue() {
    // Reports the change through `onSelectionChange`.
    state.setSelectedKey(null);

    if (state.isOpen) {
      state.close();
    }

    // Back to the trigger, without its tooltip reading this as the user
    // arriving there and then swallowing the next `Escape`.
    focusProgrammatically(triggerRef.current);

    props.onClear?.();
  }

  // The popup is at least as wide as the trigger. Measured as the list opens,
  // before the popup mounts and is positioned, rather than during render, so a
  // trigger resized while the list was closed is read fresh.
  const [triggerWidth, setTriggerWidth] = useState<number>();

  useLayoutEffect(() => {
    if (state.isOpen) setTriggerWidth(triggerRef.current?.offsetWidth);
  }, [state.isOpen, triggerRef]);

  const loadingIcon = loadingIndicator ?? <LoadingIcon />;

  const showPlaceholder = !!placeholder?.trim() && !state.selectedItem;

  const modifiers = useMemo(
    () => ({
      ...getValidationMods({ isInvalid, isValid }),
      disabled: isDisabled,
      loading: isLoading,
      hovered: isHovered,
      focused: isFocused,
      placeholder: showPlaceholder,
      prefix: !!prefix,
      suffix: true,
    }),
    [
      isInvalid,
      isValid,
      isDisabled,
      isLoading,
      isHovered,
      isFocused,
      showPlaceholder,
      prefix,
    ],
  );

  suffix = useMemo(() => {
    if (!suffix && !validationIcon) {
      return null;
    }

    return (
      <>
        {suffix}
        {validationIcon}
      </>
    );
  }, [suffix, validationIcon]);

  // A caller's `rightIcon` keeps the `rightIcon` slot: it accepts a render
  // function resolved against the trigger's mods, which only that slot does, and
  // it is also what a caller's `RightIcon` styles target. It replaces the
  // built-in control, exactly as before.
  const hasCustomRightIcon = rightIcon !== undefined;
  const triggerRightIcon = hasCustomRightIcon
    ? isLoading
      ? loadingIcon
      : rightIcon
    : undefined;

  // With a caller's own `rightIcon` the built-in control moves into that slot,
  // leaving the run with whatever the caller passed — possibly nothing. The run
  // is still rendered, so the trigger does not restructure if actions arrive
  // later, but the row stops counting it as end content — which is what keeps an
  // icon-only trigger with `rightIcon={null}` square.
  const hasTriggerActions = !hasCustomRightIcon || !!actions;

  // Everything trailing that is NOT the caller's own icon goes into the actions
  // run — a sibling of the `<button>`, so the clear button is no longer nested
  // inside one. See `TriggerActions`.
  const triggerActions = (
    <TriggerActions
      actions={actions}
      builtIn={
        hasCustomRightIcon ? null : showClearButton ? (
          <ItemAction
            icon={<CloseIcon />}
            size={size}
            qa="SelectClearButton"
            // `ItemAction` derives its accessible name from `aria-label` or a
            // string `tooltip` and warns for neither, so an icon-only clear
            // button without this reaches a screen reader unnamed.
            aria-label={clearLabel ?? t('select.clearValue', 'Clear value')}
            // No explicit `type`/`theme`: the default `current` type paints
            // from the trigger's own inherited text color, so the button
            // matches whatever the field is showing instead of one palette.
            //
            // NOTE: this trigger keeps NEUTRAL label text when invalid, so
            // the button reads neutral there too. `Picker` and `FilterPicker`
            // are also `Item`-based but do tint theirs, which is the actual
            // inconsistency to fix — in `Select`, not here.
            mods={{ pressed: false }}
            onPress={clearValue}
          />
        ) : isLoading ? (
          <TriggerIcon>{loadingIcon}</TriggerIcon>
        ) : (
          <TriggerIcon>
            <DirectionIcon to={state.isOpen ? 'up' : 'down'} />
          </TriggerIcon>
        )
      }
    />
  );

  let selectField = (
    <SelectWrapperElement
      ref={ref}
      mods={modifiers}
      styles={styles}
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
      {/*
        The trigger's trailing controls are rendered as a SIBLING of the
        `<button>` — the same layout `ItemButton` uses for its actions, shared
        through `ItemActionsWrapper`. `Select` builds its trigger from `Item`
        rather than `ItemButton` because `useSelect`/`useButton` already own the
        button props, so it reaches for the wrapper directly.

        The RAW theme, unlike `Picker` / `FilterPicker` which forward
        `getValidationTheme(...)`: this trigger is painted with the raw theme too
        and surfaces validation through `SelectWrapperElement` rather than by
        switching theme. What the wrapper hands its actions must always match
        what the trigger paints with.
      */}
      <ItemActionsWrapper
        type={type}
        theme={theme}
        size={size}
        isDisabled={isDisabled || isLoading}
        mods={modifiers}
        actions={triggerActions}
      >
        {({ showActions, skipActionsWidthTransition }) => (
          <Item
            actions={hasTriggerActions || undefined}
            insideWrapper
            as="button"
            qa={qa || 'Select'}
            data-input-type="select"
            {...mergeProps(buttonProps, hoverProps, focusProps, inputProps)}
            // For a dialog kept mounted while closed, as on `Button`.
            {...(autoFocus ? { 'data-autofocus': '' } : undefined)}
            ref={triggerRef}
            data-popover-trigger
            showActions={showActions}
            skipActionsWidthTransition={skipActionsWidthTransition}
            styles={mergeStyleLayers(inputStyles, triggerStyles)}
            theme={theme}
            size={size}
            shape={shape}
            // Ensure this button never submits a surrounding form in tests or runtime
            htmlType="button"
            // Preserve visual variant via data attribute instead of conflicting with HTML attribute
            type={type}
            mods={modifiers}
            prefix={prefix}
            suffix={suffix}
            icon={icon}
            rightIcon={triggerRightIcon}
            description={triggerDescription}
            descriptionPlacement={descriptionPlacement}
            hotkeys={hotkeys}
            tooltip={tooltip}
            labelProps={valueProps}
          >
            {state.selectedItem ? (
              state.selectedItem.rendered
            ) : placeholder ? (
              <Text.Placeholder>{placeholder}</Text.Placeholder>
            ) : null}
          </Item>
        )}
      </ItemActionsWrapper>
      <ListBoxPopup
        {...menuProps}
        popoverRef={popoverRef}
        listBoxRef={listBoxRef}
        overlayProps={overlayProps}
        placement={placement}
        state={state}
        listBoxStyles={listBoxStyles}
        listGap={listGap}
        overlayStyles={overlayStyles}
        optionStyles={optionStyles}
        minWidth={triggerWidth}
        size={size}
        triggerRef={triggerRef}
        isDisabled={isDisabled}
      />
    </SelectWrapperElement>
  );

  return wrapWithField<Omit<CubeSelectProps<T>, 'children' | 'tooltip'>>(
    selectField,
    mergeProps(
      {
        ...props,
        ...fieldLayout.field,
        // The trigger's own. Handed on, it read as the legacy field `tooltip`.
        tooltip: undefined,
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
  listGap,
  overlayStyles,
  optionStyles,
  overlayProps: parentOverlayProps,
  shouldUseVirtualFocus = false,
  placement,
  minWidth,
  size = 'small',
  triggerRef,
  isDisabled,
  ...otherProps
}) {
  // Handle events that should cause the popup to close,
  // e.g. blur, clicking outside, or pressing the escape key.
  let { overlayProps: rawOverlayProps } = useOverlay(
    {
      onClose: () => state.close(),
      shouldCloseOnBlur: true,
      isOpen: state.isOpen,
      isDismissable: true,
      shouldCloseOnInteractOutside: (el) => {
        // The trigger owns interactive controls of its own — the clear button
        // and any custom `actions`. They sit in the actions run, a SIBLING of
        // the trigger, so the lookup below would read them as a press outside
        // and dismiss, swallowing the press: the first press on `Reset` while
        // the list was open only closed the list and the action never ran. Same
        // guard as `DialogTrigger`, which `Picker` / `FilterPicker` go through.
        if (isOwnActionsPress(el, triggerRef?.current)) return false;

        const menuTriggerEl = el.closest('[data-popover-trigger]');
        if (!menuTriggerEl) {
          if (el.closest('[data-popover-keep]')) return false;
          // Plain interactive controls (Button, ItemButton) opt in via
          // `data-popover-dismiss` to dismiss us without losing their click
          // to useOverlay's stopPropagation. Schedule the close after the
          // click finishes so the button's onPress runs first.
          if (el.closest('[data-popover-dismiss]')) {
            setTimeout(() => state.close(), 0);
            return false;
          }
          return true;
        }
        // If the same trigger that opened this select was clicked, allow closing
        if (menuTriggerEl === triggerRef?.current) return true;
        // Otherwise, don't close (let event mechanism handle it)
        return false;
      },
    },
    popoverRef,
  );

  // A list that has already closed must not swallow the `Escape` meant for
  // whatever surrounds it — see `useOverlayEscapeGuard`.
  const overlayProps = useOverlayEscapeGuard(rawOverlayProps, state.isOpen);

  // Opened inside a modal, the list stays readable while the modal hides the
  // page.
  const layerRef = useModalLayerRef();

  // Extract primary placement direction for consistent styling
  const placementDirection = placement?.split(' ')[0] || 'bottom';

  // Wrap in <FocusScope> so that focus is restored back to the
  // trigger when the popup is closed. In addition, add hidden
  // <DismissButton> components at the start and end of the list
  // to allow screen reader users to dismiss the popup easily.
  //
  // `SelectListBox` puts focus in the list as it mounts, which happens on
  // every open. `autoFocus` on the scope then finds focus already inside and
  // only registers the scope as the active one, so an outer contained Dialog
  // FocusScope (e.g. a popover Dialog wrapping the Select) recognises focus
  // moving into the Select popover and doesn't yank it back to the trigger.
  return (
    <Portal>
      <DisplayTransition isShown={state.isOpen && !isDisabled}>
        {({ phase, isShown, isExiting, ref: transitionRef }) => (
          <SelectOverlayWrapper
            {...overlayProps}
            {...parentOverlayProps}
            ref={mergeRefs(popoverRef, layerRef)}
            // oxlint-disable-next-line tasty/no-style-prop -- React Aria's overlay positioning computes these coordinates
            style={parentOverlayProps?.style}
            // A press on the list while it fades out must not close the
            // overlay under it (CUB-5293) — see `Overlay`.
            data-react-aria-top-layer={isExiting || undefined}
          >
            <OverlayElement
              ref={transitionRef}
              data-placement={placementDirection}
              data-phase={phase}
              mods={{
                open: isShown,
              }}
              styles={overlayStyles}
              tokens={{
                '$overlay-min-width': minWidth ? `${minWidth}px` : 'initial',
              }}
            >
              <FocusScope autoFocus restoreFocus>
                <DismissButton onDismiss={() => state.close()} />
                <SelectListBox
                  {...otherProps}
                  state={state}
                  listBoxRef={listBoxRef}
                  listBoxStyles={listBoxStyles}
                  listGap={listGap}
                  optionStyles={optionStyles}
                  shouldUseVirtualFocus={shouldUseVirtualFocus}
                  size={size}
                />
                <DismissButton onDismiss={() => state.close()} />
              </FocusScope>
            </OverlayElement>
          </SelectOverlayWrapper>
        )}
      </DisplayTransition>
    </Portal>
  );
}

/** The first or last option that can take focus. */
function getEdgeOptionKey(
  state: SelectState<object>,
  edge: 'first' | 'last',
): Key | null {
  const keys = [...state.collection.getKeys()];

  if (edge === 'last') keys.reverse();

  return (
    keys.find(
      (key) =>
        state.collection.getItem(key)?.type === 'item' &&
        state.selectionManager.canSelectItem(key),
    ) ?? null
  );
}

/**
 * Where focus lands as the list opens. `ArrowUp` opens on the last option;
 * `ArrowDown`, `Enter` and `Space` on the selected option, or else the first.
 * A pointer opens on the selected option, or else on the list itself, as in
 * React Aria, so a click highlights nothing the user didn't pick.
 */
function getOpeningFocusKey(state: SelectState<object>): Key | null {
  const { focusStrategy, selectedKey, selectionManager } = state;

  if (focusStrategy === 'last') return getEdgeOptionKey(state, 'last');

  if (selectedKey != null && selectionManager.canSelectItem(selectedKey)) {
    return selectedKey;
  }

  return focusStrategy === 'first' ? getEdgeOptionKey(state, 'first') : null;
}

/**
 * Scrolls `list` so `option` is in view. Layout offsets rather than client
 * rects: on its first frames the popup is scaled by its enter transition,
 * which would skew a rect-based scroll. The list is positioned, so the offset
 * chain ends at it.
 */
function scrollIntoList(list: HTMLElement, option: HTMLElement) {
  let top = 0;

  for (
    let node: HTMLElement | null = option;
    node && node !== list;
    node = node.offsetParent as HTMLElement | null
  ) {
    top += node.offsetTop;
  }

  const bottom = top + option.offsetHeight;

  if (top < list.scrollTop) {
    list.scrollTop = top;
  } else if (bottom > list.scrollTop + list.clientHeight) {
    list.scrollTop = bottom - list.clientHeight;
  }
}

function focusOpeningOption(
  state: SelectState<object>,
  list: HTMLElement | null,
  shouldUseVirtualFocus: boolean,
) {
  const key = getOpeningFocusKey(state);
  const manager = state.selectionManager;

  manager.setFocused(true);
  manager.setFocusedKey(key);

  if (!list || shouldUseVirtualFocus) return;

  const option =
    key == null
      ? undefined
      : Array.from(list.querySelectorAll<HTMLElement>('[role="option"]')).find(
          (element) => element.dataset.key === String(key),
        );

  if (!option) {
    list.focus({ preventScroll: true });

    return;
  }

  scrollIntoList(list, option);
  // Focused here rather than left to the option, which would only follow on
  // the next render: the scope's `autoFocus` runs first and would otherwise
  // focus whichever option was tabbable from the last opening.
  option.focus({ preventScroll: true });
}

/**
 * The list inside the popup. It decides where focus lands when it mounts,
 * rather than inheriting the last opening. The popup unmounts it once it has
 * closed, so that is every opening except a reopen during the exit
 * transition, which keeps the list mounted.
 */
function SelectListBox({
  state,
  listBoxRef,
  listBoxStyles,
  listGap,
  optionStyles,
  shouldUseVirtualFocus,
  size,
  ...otherProps
}) {
  // For trigger+popover components, map 'small' size to 'medium' for list items
  // while preserving 'medium' and 'large' sizes
  const listItemSize = size === 'small' ? 'medium' : size;
  const listGapTokens =
    listGap == null ? undefined : { '$list-gap': `${listGap}px` };

  let { listBoxProps } = useListBox(
    // Opening focus is `focusOpeningOption`'s: React Aria's own `autoFocus`
    // lets a selection win over the last option `ArrowUp` asks for.
    { ...otherProps, shouldUseVirtualFocus, autoFocus: false },
    state,
    listBoxRef,
  );

  const focusOnOpen = useEffectEvent(() =>
    focusOpeningOption(state, listBoxRef.current, shouldUseVirtualFocus),
  );

  useEffect(() => {
    focusOnOpen();
  }, []);

  const renderedItems: React.ReactNode[] = [];
  let hasSections = false;

  for (const item of state.collection) {
    if (item.type === 'section') {
      if (hasSections) {
        // A listbox may only own options and groups, so the divider between
        // sections is presentation only.
        renderedItems.push(
          <ListDivider
            key={`divider-${String(item.key)}`}
            as="li"
            role="presentation"
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

      hasSections = true;
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
      tokens={listGapTokens}
      mods={{ sections: hasSections }}
      {...listBoxProps}
      ref={listBoxRef}
    >
      {renderedItems}
    </ListBoxElement>
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

  // A mouse press picks the option it started on, even if the list moved
  // under the pointer before the release.
  const originPress = useOptionOriginPress({
    key: item.key,
    ref,
    manager: state.selectionManager,
    isDisabled,
  });
  const { onPointerUp, ...ariaOptionProps } =
    filterSelectionItemProps(optionProps);

  // Handle focus events, so we can apply highlighted
  // style to the focused option
  let { isFocused, focusProps } = useFocus();

  // Filter out service props - all remaining props can be passed to Item
  const filteredItemProps = filterSelectionItemProps(
    filterCollectionItemProps(item.props),
  );

  const keyboardProps = {
    onKeyDown(event: KeyboardEvent<HTMLLIElement>) {
      // Committing an option refocuses the trigger during keydown. Cancel
      // Enter's native activation there, preserving Control+Enter context
      // menus and activation of links or controls inside the option.
      if (
        event.key === 'Enter' &&
        !event.ctrlKey &&
        event.target === event.currentTarget
      ) {
        event.preventDefault();
      }
    },
  };

  return (
    <OptionItem
      {...mergeProps(
        ariaOptionProps,
        {
          onPointerDown: originPress.onPointerDown,
          onPointerUp: originPress.wrapPointerUp(onPointerUp),
        },
        focusProps,
        filteredItemProps,
        keyboardProps,
      )}
      ref={ref}
      mods={{
        listboxitem: true,
        selected: isSelected,
        focused: shouldUseVirtualFocus ? isVirtualFocused : isFocused,
        disabled: isDisabled,
        pressed: isPressed,
      }}
      data-size={size}
      styles={mergeStyleLayers(
        styles as Styles,
        filteredItemProps.styles as Styles,
      )}
      labelProps={labelProps}
      descriptionProps={descriptionProps}
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
          styles={mergeStyleLayers(headingStyles, {
            '$inline-compensation': '0px',
          })}
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

// `forwardRef` can't carry the item generic, so the cast restores it, as in
// ComboBox and Picker.
const _Select = forwardRef(
  Select as ForwardRefRenderFunction<HTMLDivElement, any>,
) as unknown as <T>(
  props: CubeSelectProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReactElement;

(_Select as any).cubeInputType = 'Select';

type SectionComponent = typeof BaseSection;

const SelectSectionComponent = Object.assign(BaseSection, {
  displayName: 'Section',
}) as SectionComponent;

const __Select = Object.assign(
  _Select as typeof _Select & {
    Item: typeof CollectionItem;
    Section: typeof SelectSectionComponent;
    Action: typeof ItemAction;
  },
  {
    Item: CollectionItem,
    Section: SelectSectionComponent,
    Action: ItemAction,
  },
);

(__Select as any).displayName = 'Select';

export { __Select as Select };

export type { AriaSelectProps };
export { useSelectState };
