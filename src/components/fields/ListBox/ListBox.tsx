import {
  ForwardedRef,
  forwardRef,
  MutableRefObject,
  ReactElement,
  ReactNode,
  RefObject,
  useMemo,
  useRef,
} from 'react';
import {
  AriaListBoxProps,
  useKeyboard,
  useListBox,
  useListBoxSection,
  useOption,
} from 'react-aria';
import { Section as BaseSection, Item, useListState } from 'react-stately';

import { useWarn } from '../../../_internal/hooks/use-warn';
import { CheckIcon } from '../../../icons';
import { useProviderProps } from '../../../provider';
import {
  BASE_STYLES,
  COLOR_STYLES,
  extractStyles,
  OUTER_STYLES,
  Styles,
  tasty,
} from '../../../tasty';
import { mergeProps, modAttrs, useCombinedRefs } from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';
// Import Menu styled components for header and footer
import {
  StyledDivider,
  StyledFooter,
  StyledHeader,
  StyledSectionHeading,
} from '../../actions/Menu/styled';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';

import type { CollectionBase, Key } from '@react-types/shared';
import type { FieldBaseProps } from '../../../shared';

const ListBoxWrapperElement = tasty({
  qa: 'ListBox',
  styles: {
    display: 'grid',
    gridColumns: '1sf',
    gridRows: 'max-content 1sf max-content',
    flow: 'column',
    gap: 0,
    position: 'relative',
    radius: true,
    color: '#dark-02',
    transition: 'theme',
    outline: {
      '': '#purple-03.0',
      'invalid & focused': '#danger.50',
      focused: '#purple-03',
    },
    border: {
      '': true,
      focused: '#purple-text',
      valid: '#success-text.50',
      invalid: '#danger-text.50',
      disabled: true,
      'popover | searchable': false,
    },
  },
});

const ListElement = tasty({
  as: 'ul',
  styles: {
    display: 'flex',
    gap: '1bw',
    flow: 'column',
    margin: '0',
    padding: '.5x',
    listStyle: 'none',
    height: 'auto',
    overflow: 'auto',
    scrollbar: 'styled',
  },
});

const OptionElement = tasty({
  as: 'li',
  styles: {
    display: 'flex',
    flow: 'row',
    placeItems: 'center start',
    gap: '.75x',
    padding: '.75x 1x',
    radius: '1r',
    cursor: {
      '': 'default',
      disabled: 'not-allowed',
    },
    transition: 'theme',
    outline: 0,
    border: 0,
    userSelect: 'none',
    color: {
      '': '#dark-02',
      'selected | pressed': '#dark',
      disabled: '#dark-04',
      valid: '#success-text',
      invalid: '#danger-text',
    },
    fill: {
      '': '#clear',
      focused: '#dark.03',
      selected: '#dark.06',
      'selected & focused': '#dark.09',
      pressed: '#dark.06',
      valid: '#success-bg',
      invalid: '#danger-bg',
      disabled: '#clear',
    },

    CheckboxWrapper: {
      cursor: 'pointer',
      padding: '.75x',
      margin: '-.75x',
    },

    Checkbox: {
      display: 'grid',
      placeItems: 'center',
      radius: '.5r',
      width: '(2x - 2bw)',
      height: '(2x - 2bw)',
      flexShrink: 0,
      transition: 'theme',
      opacity: {
        '': 0,
        'selected | :hover': 1,
      },
      fill: {
        '': '#white',
        selected: '#purple-text',
        'invalid & !selected': '#white',
        'invalid & selected': '#danger',
        disabled: '#dark.12',
      },
      color: {
        '': '#white',
        'disabled & !selected': '#clear',
      },
      border: {
        '': '#dark.30',
        invalid: '#danger',
        'disabled | (selected & !invalid)': '#clear',
      },
    },

    Content: {
      display: 'flex',
      flow: 'column',
      gap: '.25x',
      flex: 1,
    },

    Label: {
      preset: 't3',
      color: 'inherit',
    },

    Description: {
      preset: 't4',
      color: {
        '': '#dark-03',
      },
    },
  },
});

const SectionWrapperElement = tasty({
  as: 'li',
  styles: {
    display: 'block',
  },
});

const SectionListElement = tasty({
  qa: 'ListBoxSectionList',
  as: 'ul',
  styles: {
    display: 'flex',
    gap: '1bw',
    flow: 'column',
    margin: '0',
    padding: '0',
    listStyle: 'none',
  },
});

export interface CubeListBoxProps<T>
  extends Omit<AriaListBoxProps<T>, 'onSelectionChange'>,
    CollectionBase<T>,
    FieldBaseProps {
  /** Custom styles for the list container */
  listStyles?: Styles;
  /** Custom styles for options */
  optionStyles?: Styles;
  /** Custom styles for sections */
  sectionStyles?: Styles;
  /** Custom styles for section headings */
  headingStyles?: Styles;
  /** Whether the ListBox is disabled */
  isDisabled?: boolean;
  /** The selected key(s) */
  selectedKey?: Key | null;
  selectedKeys?: Key[];
  /** Default selected key(s) */
  defaultSelectedKey?: Key | null;
  defaultSelectedKeys?: Key[];
  /** Selection change handler */
  onSelectionChange?: (key: Key | null | Key[]) => void;
  /** Ref for the list */
  listRef?: RefObject<HTMLDivElement>;
  /**
   * Ref to access the internal ListState instance.
   * This allows parent components to access selection state and other list functionality.
   */
  stateRef?: MutableRefObject<any | null>;

  /**
   * When true (default) moving the pointer over an option will move DOM focus to that option.
   * Set to false for components that keep DOM focus outside (e.g. searchable FilterListBox).
   */
  focusOnHover?: boolean;
  /** Custom header content */
  header?: ReactNode;
  /** Custom footer content */
  footer?: ReactNode;
  /** Custom styles for the header */
  headerStyles?: Styles;
  /** Custom styles for the footer */
  footerStyles?: Styles;
  /** Mods for the ListBox */
  mods?: Record<string, boolean>;

  /**
   * When true, ListBox will use virtual focus. This keeps actual DOM focus
   * outside of the individual option elements (e.g. for searchable lists
   * where focus stays within an external input).
   * Defaults to false for backward compatibility.
   */
  shouldUseVirtualFocus?: boolean;

  /**
   * Optional callback fired when the user presses Escape key.
   * When provided, this prevents React Aria's default Escape behavior (selection reset).
   */
  onEscape?: () => void;

  /**
   * Whether the options in the ListBox are checkable.
   * This adds a checkbox icon to the left of the option.
   */
  isCheckable?: boolean;

  /**
   * Callback fired when an option is clicked but not on the checkbox area.
   * Used by FilterPicker to close the popover on non-checkbox clicks.
   */
  onOptionClick?: (key: Key) => void;
}

const PROP_STYLES = [...BASE_STYLES, ...OUTER_STYLES, ...COLOR_STYLES];

export const ListBox = forwardRef(function ListBox<T extends object>(
  props: CubeListBoxProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, {
    valuePropsMapper: ({ value, onChange }) => {
      const fieldProps: any = {};

      if (props.selectionMode === 'multiple') {
        fieldProps.selectedKeys = value || [];
      } else {
        fieldProps.selectedKey = value ?? null;
      }

      fieldProps.onSelectionChange = (key: any) => {
        if (props.selectionMode === 'multiple') {
          onChange(key ? (Array.isArray(key) ? key : [key]) : []);
        } else {
          onChange(Array.isArray(key) ? key[0] : key);
        }
      };

      return fieldProps;
    },
  });

  let {
    qa,
    label,
    extra,
    labelStyles,
    isRequired,
    necessityIndicator,
    validationState,
    isDisabled,
    listStyles,
    optionStyles,
    sectionStyles,
    headingStyles,
    listRef,
    message,
    description,
    styles,
    mods: externalMods,
    labelSuffix,
    selectedKey,
    defaultSelectedKey,
    selectedKeys,
    defaultSelectedKeys,
    shouldUseVirtualFocus,
    onSelectionChange,
    stateRef,
    focusOnHover,
    header,
    footer,
    headerStyles,
    footerStyles,
    escapeKeyBehavior,
    onEscape,
    isCheckable,
    onOptionClick,
    ...otherProps
  } = props;

  // Wrap onSelectionChange to prevent selection when disabled and handle React Aria's Set format
  const externalSelectionHandler = onSelectionChange || (props as any).onChange;

  const wrappedOnSelectionChange = useMemo(() => {
    if (!externalSelectionHandler) return undefined;

    return (keys: any) => {
      // Don't allow selection changes when disabled
      if (isDisabled) {
        return;
      }

      // React Aria always passes a Set for selection changes
      // For single selection mode, we extract the first (and only) key
      if (keys instanceof Set) {
        if (keys.size === 0) {
          externalSelectionHandler(
            props.selectionMode === 'multiple' ? [] : null,
          );
        } else if (props.selectionMode === 'multiple') {
          externalSelectionHandler(Array.from(keys));
        } else {
          externalSelectionHandler(Array.from(keys)[0]);
        }
      } else {
        externalSelectionHandler(keys);
      }
    };
  }, [externalSelectionHandler, isDisabled, props.selectionMode]);

  // Prepare props for useListState with correct selection props
  const listStateProps: any = {
    ...props,
    onSelectionChange: wrappedOnSelectionChange,
    isDisabled,
    selectionMode: props.selectionMode || 'single',
  };

  // Set selection props based on mode
  if (listStateProps.selectionMode === 'multiple') {
    if (selectedKeys !== undefined) {
      listStateProps.selectedKeys = new Set(selectedKeys as Key[]);
    }
    if (defaultSelectedKeys !== undefined) {
      listStateProps.defaultSelectedKeys = new Set(
        defaultSelectedKeys as Key[],
      );
    }
    // Remove single-selection props if any
    delete listStateProps.selectedKey;
    delete listStateProps.defaultSelectedKey;
  } else {
    // For single-selection we convert the scalar key props that our public
    // API exposes into the Set-based props that React Stately expects.
    if (selectedKey !== undefined) {
      listStateProps.selectedKeys =
        selectedKey == null ? new Set() : new Set([selectedKey]);
    }

    if (defaultSelectedKey !== undefined) {
      listStateProps.defaultSelectedKeys =
        defaultSelectedKey == null ? new Set() : new Set([defaultSelectedKey]);
    }

    // Remove the single-value props so we don't pass unsupported keys through.
    delete listStateProps.selectedKey;
    delete listStateProps.defaultSelectedKey;
  }

  const listState = useListState(listStateProps);

  // Expose the list state instance via the provided ref (if any)
  if (stateRef) {
    stateRef.current = listState;
  }

  // Warn if isCheckable is false in single selection mode
  useWarn(isCheckable === false && props.selectionMode === 'single', {
    key: ['listbox-checkable-single-mode'],
    args: [
      'CubeUIKit: isCheckable=false is not recommended in single selection mode as it may confuse users about selection behavior.',
    ],
  });

  // Custom keyboard handling to prevent selection clearing on Escape while allowing overlay dismiss
  const { keyboardProps } = useKeyboard({
    onKeyDown: (e) => {
      if (e.key === 'Escape' && onEscape) {
        // Don't prevent default - let the overlay system handle closing
        // But we'll call onEscape to potentially override the default selection clearing
        onEscape();
      }
    },
  });

  styles = extractStyles(otherProps, PROP_STYLES, styles);

  ref = useCombinedRefs(ref);
  listRef = useCombinedRefs(listRef);

  const { listBoxProps } = useListBox(
    {
      ...props,
      'aria-label': props['aria-label'] || label?.toString(),
      isDisabled,
      shouldUseVirtualFocus: shouldUseVirtualFocus ?? false,
      shouldFocusWrap: true,
      escapeKeyBehavior: onEscape ? 'none' : 'clearSelection',
    },
    listState,
    listRef,
  );

  const { isFocused, focusProps } = useFocus({ isDisabled });
  const isInvalid = validationState === 'invalid';

  // Merge React Aria listbox props with custom keyboard props so both sets of
  // event handlers (e.g. Arrow navigation *and* our Escape handler) are
  // preserved.
  const mergedListBoxProps = mergeProps(listBoxProps, keyboardProps);

  const mods = useMemo(
    () => ({
      invalid: isInvalid,
      valid: validationState === 'valid',
      disabled: isDisabled,
      focused: isFocused,
      header: !!header,
      footer: !!footer,
      ...externalMods,
    }),
    [
      isInvalid,
      validationState,
      isDisabled,
      isFocused,
      header,
      footer,
      externalMods,
    ],
  );

  const listBoxField = (
    <ListBoxWrapperElement
      ref={ref}
      qa={qa || 'ListBox'}
      {...modAttrs(mods)}
      styles={styles}
      {...focusProps}
    >
      {header ? (
        <StyledHeader styles={headerStyles}>{header}</StyledHeader>
      ) : (
        <div role="presentation" />
      )}
      <ListElement
        {...mergedListBoxProps}
        ref={listRef}
        styles={listStyles}
        aria-disabled={isDisabled || undefined}
      >
        {(() => {
          const renderedItems: ReactNode[] = [];
          let isFirstSection = true;

          for (const item of listState.collection) {
            if (item.type === 'section') {
              if (!isFirstSection) {
                renderedItems.push(
                  <StyledDivider
                    key={`divider-${String(item.key)}`}
                    role="separator"
                    aria-orientation="horizontal"
                  />,
                );
              }

              renderedItems.push(
                <ListBoxSection
                  key={item.key}
                  item={item}
                  state={listState}
                  optionStyles={optionStyles}
                  headingStyles={headingStyles}
                  sectionStyles={sectionStyles}
                  isParentDisabled={isDisabled}
                  validationState={validationState}
                  focusOnHover={focusOnHover}
                  isCheckable={isCheckable}
                  onOptionClick={onOptionClick}
                />,
              );

              isFirstSection = false;
            } else {
              renderedItems.push(
                <Option
                  key={item.key}
                  item={item}
                  state={listState}
                  styles={optionStyles}
                  isParentDisabled={isDisabled}
                  validationState={validationState}
                  focusOnHover={focusOnHover}
                  isCheckable={isCheckable}
                  onOptionClick={onOptionClick}
                />,
              );
            }
          }

          return renderedItems;
        })()}
      </ListElement>
      {footer ? (
        <StyledFooter styles={footerStyles}>{footer}</StyledFooter>
      ) : (
        <div role="presentation" />
      )}
    </ListBoxWrapperElement>
  );

  return wrapWithField<Omit<CubeListBoxProps<T>, 'children'>>(
    listBoxField,
    ref,
    mergeProps({ ...props, styles: undefined }, {}),
  );
}) as unknown as (<T>(
  props: CubeListBoxProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReactElement) & { Item: typeof Item; Section: typeof BaseSection };

function Option({
  item,
  state,
  styles,
  isParentDisabled,
  validationState,
  focusOnHover = true,
  isCheckable,
  onOptionClick,
}) {
  const ref = useRef<HTMLLIElement>(null);
  const isDisabled = isParentDisabled || state.disabledKeys.has(item.key);
  const isSelected = state.selectionManager.isSelected(item.key);
  const isFocused = state.selectionManager.focusedKey === item.key;

  const { optionProps, isPressed } = useOption(
    {
      key: item.key,
      isDisabled,
      isSelected,
      shouldSelectOnPressUp: true,
      shouldFocusOnHover: focusOnHover,
    },
    state,
    ref,
  );

  const description = (item as any)?.props?.description;

  // Custom click handler for the entire option
  const handleOptionClick = (e) => {
    // If there's an onOptionClick callback and this is checkable in multiple mode,
    // we need to distinguish between checkbox and content clicks
    if (
      onOptionClick &&
      isCheckable &&
      state.selectionManager.selectionMode === 'multiple'
    ) {
      // Check if the click target is within the checkbox area
      const clickTarget = e.target as HTMLElement;
      const checkboxElement = ref.current?.querySelector(
        '[data-element="CheckboxWrapper"]',
      );

      if (
        checkboxElement &&
        (checkboxElement === clickTarget ||
          checkboxElement.contains(clickTarget))
      ) {
        // Checkbox area clicked - only toggle, don't call onOptionClick
        // Let React Aria handle the selection
        optionProps.onClick?.(e);
      } else {
        // Content area clicked - toggle and trigger callback
        // Let React Aria handle the selection first
        optionProps.onClick?.(e);
        // Then call the callback (which will close the popover in FilterPicker)
        if (onOptionClick) {
          onOptionClick(item.key);
        }
      }
    } else {
      // Normal behavior - let React Aria handle it
      optionProps.onClick?.(e);
    }
  };

  return (
    <OptionElement
      id={`ListBoxItem-${String(item.key)}`}
      {...optionProps}
      ref={ref}
      mods={{
        selected: isSelected,
        focused: isFocused,
        disabled: isDisabled,
        pressed: isPressed,
        valid: isSelected && validationState === 'valid',
        invalid: isSelected && validationState === 'invalid',
        checkable: isCheckable,
        hovered: isFocused, // We'll treat focus as hover for the checkbox visibility
      }}
      styles={styles}
      onClick={handleOptionClick}
    >
      {isCheckable && state.selectionManager.selectionMode === 'multiple' && (
        <div data-element="CheckboxWrapper">
          <div data-element="Checkbox">
            <CheckIcon size={12} stroke={3} />
          </div>
        </div>
      )}
      <div data-element="Content">
        <div data-element="Label">{item.rendered}</div>
        {description ? (
          <div data-element="Description">{description}</div>
        ) : null}
      </div>
    </OptionElement>
  );
}

interface ListBoxSectionProps<T> {
  item: any;
  state: any;
  optionStyles?: Styles;
  headingStyles?: Styles;
  sectionStyles?: Styles;
  isParentDisabled?: boolean;
  validationState?: any;
  focusOnHover?: boolean;
  isCheckable?: boolean;
  onOptionClick?: (key: Key) => void;
}

function ListBoxSection<T>(props: ListBoxSectionProps<T>) {
  const {
    item,
    state,
    optionStyles,
    headingStyles,
    sectionStyles,
    isParentDisabled,
    validationState,
    focusOnHover,
    isCheckable,
    onOptionClick,
  } = props;
  const heading = item.rendered;

  const { itemProps, headingProps, groupProps } = useListBoxSection({
    heading,
    'aria-label': item['aria-label'],
  });

  return (
    <SectionWrapperElement {...itemProps} styles={sectionStyles}>
      {heading && (
        <StyledSectionHeading {...headingProps} styles={headingStyles}>
          {heading}
        </StyledSectionHeading>
      )}
      <SectionListElement {...groupProps}>
        {[...item.childNodes]
          .filter((node: any) => state.collection.getItem(node.key))
          .map((node: any) => (
            <Option
              key={node.key}
              item={node}
              state={state}
              styles={optionStyles}
              isParentDisabled={isParentDisabled}
              validationState={validationState}
              focusOnHover={focusOnHover}
              isCheckable={isCheckable}
              onOptionClick={onOptionClick}
            />
          ))}
      </SectionListElement>
    </SectionWrapperElement>
  );
}

type SectionComponent = typeof BaseSection;

const ListBoxSectionComponent = Object.assign(BaseSection, {
  displayName: 'Section',
}) as SectionComponent;

ListBox.Item = Item as unknown as (props: {
  description?: ReactNode;
  [key: string]: any;
}) => ReactElement;

ListBox.Section = ListBoxSectionComponent;

Object.defineProperty(ListBox, 'cubeInputType', {
  value: 'ListBox',
  enumerable: false,
  configurable: false,
});
