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
  useListBox,
  useListBoxSection,
  useOption,
} from 'react-aria';
import { Section as BaseSection, Item, useListState } from 'react-stately';

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
import { useFieldProps, useFormProps, wrapWithField } from '../../form';

import type { CollectionBase, Key } from '@react-types/shared';
import type { FieldBaseProps } from '../../../shared';

const ListBoxWrapperElement = tasty({
  styles: {
    display: 'flex',
    flow: 'column',
    gap: 0,
    position: 'relative',
    radius: true,
    fill: '#white',
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
    flow: 'column',
    gap: '.25x',
    padding: '.75x 1x',
    radius: '1r',
    cursor: 'pointer',
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

const SectionHeadingElement = tasty({
  styles: {
    preset: 't4 strong',
    color: '#dark-03',
    padding: '.5x 1x .25x',
    userSelect: 'none',
  },
});

const SectionListElement = tasty({
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

const DividerElement = tasty({
  as: 'li',
  styles: {
    height: '1bw',
    fill: '#border',
    margin: '.5x 0',
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
  listRef?: RefObject<HTMLElement>;
  /**
   * Optional ref that will receive the internal React Stately list state instance.
   * This can be used by parent components (e.g., FilterListBox) for virtual focus
   * management while keeping DOM focus elsewhere.
   */
  stateRef?: MutableRefObject<any | null>;
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
    labelSuffix,
    selectedKey,
    defaultSelectedKey,
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    stateRef,
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

  styles = extractStyles(otherProps, PROP_STYLES, styles);

  ref = useCombinedRefs(ref);
  listRef = useCombinedRefs(listRef);

  const { listBoxProps } = useListBox(
    {
      ...props,
      'aria-label': props['aria-label'] || label?.toString(),
      isDisabled,
      shouldUseVirtualFocus: false,
      shouldFocusWrap: true,
    },
    listState,
    listRef,
  );

  const { isFocused, focusProps } = useFocus({ isDisabled });
  const isInvalid = validationState === 'invalid';

  const mods = useMemo(
    () => ({
      invalid: isInvalid,
      valid: validationState === 'valid',
      disabled: isDisabled,
      focused: isFocused,
    }),
    [isInvalid, validationState, isDisabled, isFocused],
  );

  const listBoxField = (
    <ListBoxWrapperElement
      ref={ref}
      qa={qa || 'ListBox'}
      {...modAttrs(mods)}
      styles={styles}
      {...focusProps}
    >
      <ListElement
        {...listBoxProps}
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
                  <DividerElement
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
                />,
              );
            }
          }

          return renderedItems;
        })()}
      </ListElement>
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

function Option({ item, state, styles, isParentDisabled, validationState }) {
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
      shouldFocusOnHover: true,
    },
    state,
    ref,
  );

  const description = (item as any)?.props?.description;

  return (
    <OptionElement
      id={`ListBox-option-${String(item.key)}`}
      {...optionProps}
      ref={ref}
      mods={{
        selected: isSelected,
        focused: isFocused,
        disabled: isDisabled,
        pressed: isPressed,
        valid: isSelected && validationState === 'valid',
        invalid: isSelected && validationState === 'invalid',
      }}
      styles={styles}
    >
      <div data-element="Label">{item.rendered}</div>
      {description ? <div data-element="Description">{description}</div> : null}
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
  } = props;
  const heading = item.rendered;

  const { itemProps, headingProps, groupProps } = useListBoxSection({
    heading,
    'aria-label': item['aria-label'],
  });

  return (
    <SectionWrapperElement {...itemProps} styles={sectionStyles}>
      {heading && (
        <SectionHeadingElement {...headingProps} styles={headingStyles}>
          {heading}
        </SectionHeadingElement>
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
