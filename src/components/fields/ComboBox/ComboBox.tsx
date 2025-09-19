import {
  cloneElement,
  ForwardedRef,
  forwardRef,
  ReactElement,
  RefObject,
  useEffect,
  useMemo,
} from 'react';
import {
  AriaComboBoxProps,
  AriaTextFieldProps,
  useButton,
  useComboBox,
  useFilter,
  useHover,
  useOverlayPosition,
} from 'react-aria';
import { Section as BaseSection, useComboBoxState } from 'react-stately';

import { useEvent } from '../../../_internal/index';
import { CloseIcon, DownIcon, LoadingIcon } from '../../../icons';
import { useProviderProps } from '../../../provider';
import { FieldBaseProps } from '../../../shared';
import {
  BASE_STYLES,
  COLOR_STYLES,
  extractStyles,
  OUTER_STYLES,
  tasty,
} from '../../../tasty';
import { generateRandomId } from '../../../utils/random';
import {
  mergeProps,
  useCombinedRefs,
  useLayoutEffect,
} from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';
import { useEventBus } from '../../../utils/react/useEventBus';
import { Button } from '../../actions';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
import { Item } from '../../Item';
import { OverlayWrapper } from '../../overlays/OverlayWrapper';
import { InvalidIcon } from '../../shared/InvalidIcon';
import { ValidIcon } from '../../shared/ValidIcon';
import { DEFAULT_INPUT_STYLES, INPUT_WRAPPER_STYLES } from '../index';
import { ListBoxPopup } from '../Select';

import type { KeyboardDelegate, LoadingState } from '@react-types/shared';
import type { CubeSelectBaseProps } from '../Select';

type FilterFn = (textValue: string, inputValue: string) => boolean;

export type MenuTriggerAction = 'focus' | 'input' | 'manual';

const ComboBoxWrapperElement = tasty({
  styles: INPUT_WRAPPER_STYLES,
});

const InputElement = tasty({
  as: 'input',
  styles: DEFAULT_INPUT_STYLES,
});

const TriggerElement = tasty({
  as: 'button',
  type: 'neutral',
  styles: {
    display: 'grid',
    placeItems: 'center',
    placeContent: 'center',
    placeSelf: 'stretch',
    radius: '(1r - 1bw) right',
    padding: '0',
    width: '3x',
    boxSizing: 'border-box',
    color: {
      '': '#dark-02',
      hovered: '#dark-02',
      pressed: '#purple',
      '[disabled]': '#dark.30',
    },
    border: 'left',
    reset: 'button',
    margin: 0,
    fill: {
      '': '#dark.0',
      hovered: '#dark.04',
      pressed: '#purple.10',
      disabled: '#clear',
    },
    cursor: 'pointer',
  },
});

const ClearButton = tasty(Button, {
  icon: <CloseIcon />,
  styles: {
    height: '($size - 1x)',
    width: '($size - 1x)',
    margin: '0 .5x',
  },
});

export interface CubeComboBoxProps<T>
  extends Omit<
      CubeSelectBaseProps<T>,
      'onOpenChange' | 'onBlur' | 'onFocus' | 'validate' | 'onSelectionChange'
    >,
    Omit<AriaComboBoxProps<T>, 'errorMessage'>,
    Omit<AriaTextFieldProps, 'errorMessage'>,
    FieldBaseProps {
  defaultSelectedKey?: string | null;
  selectedKey?: string | null;
  onSelectionChange?: (selectedKey: string | null) => void;
  onInputChange?: (inputValue: string) => void;
  inputValue?: string;
  placeholder?: string;
  icon?: ReactElement;
  multiLine?: boolean;
  autoComplete?: string;
  wrapperRef?: RefObject<HTMLDivElement>;
  inputRef?: RefObject<HTMLInputElement>;
  /** The ref for the list box popover. */
  popoverRef?: RefObject<HTMLDivElement>;
  /** The ref for the list box. */
  listBoxRef?: RefObject<HTMLElement>;
  /** An optional keyboard delegate implementation, to override the default. */
  keyboardDelegate?: KeyboardDelegate;
  loadingState?: LoadingState;
  /**
   * The filter function used to determine if a option should be included in the combo box list.
   * Has no effect when `items` is provided.
   */
  filter?: FilterFn;
  size?: 'small' | 'medium' | 'large' | (string & {});
  suffixPosition?: 'before' | 'after';
  menuTrigger?: MenuTriggerAction;
  allowsCustomValue?: boolean;
  /** Whether the combo box is clearable using ESC keyboard button or clear button inside the input */
  isClearable?: boolean;
}

const PROP_STYLES = [...BASE_STYLES, ...OUTER_STYLES, ...COLOR_STYLES];

export const ComboBox = forwardRef(function ComboBox<T extends object>(
  props: CubeComboBoxProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, {
    valuePropsMapper: ({ value, onChange }) => {
      return {
        selectedKey: !props.allowsCustomValue ? value ?? null : undefined,
        inputValue: props.allowsCustomValue ? value ?? '' : undefined,
        onInputChange(val) {
          if (!props.allowsCustomValue) {
            return;
          }

          onChange(val);
        },
        onSelectionChange(val: string) {
          if (val == null && props.allowsCustomValue) {
            return;
          }

          onChange(val);
        },
      };
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
    icon,
    prefix,
    isDisabled,
    multiLine,
    autoFocus,
    wrapperRef,
    inputRef,
    triggerRef,
    popoverRef,
    listBoxRef,
    isLoading,
    loadingIndicator,
    overlayOffset = 8,
    inputStyles,
    optionStyles,
    triggerStyles,
    listBoxStyles,
    overlayStyles,
    wrapperStyles,
    suffix,
    hideTrigger,
    message,
    description,
    size = 'medium',
    autoComplete = 'off',
    direction = 'bottom',
    shouldFlip = true,
    menuTrigger = 'input',
    suffixPosition = 'before',
    loadingState,
    filter,
    styles,
    labelSuffix,
    selectedKey,
    defaultSelectedKey,
    isClearable,
    ...otherProps
  } = props;

  let isAsync = loadingState != null;
  let { contains } = useFilter({ sensitivity: 'base' });

  let comboBoxStateProps: any = {
    ...props,
    defaultFilter: filter || contains,
    filter: undefined,
    allowsEmptyCollection: isAsync,
    menuTrigger,
  };

  let state = useComboBoxState(comboBoxStateProps);

  // Generate a unique ID for this combobox instance
  const comboBoxId = useMemo(() => generateRandomId(), []);

  // Get event bus for menu synchronization
  const { emit, on } = useEventBus();

  // Listen for other menus opening and close this one if needed
  useEffect(() => {
    const unsubscribe = on('popover:open', (data: { menuId: string }) => {
      // If another menu is opening and this combobox is open, close this one
      if (data.menuId !== comboBoxId && state.isOpen) {
        state.close();
      }
    });

    return unsubscribe;
  }, [on, comboBoxId, state]);

  // Emit event when this combobox opens
  useEffect(() => {
    if (state.isOpen) {
      emit('popover:open', { menuId: comboBoxId });
    }
  }, [state.isOpen, emit, comboBoxId]);

  styles = extractStyles(otherProps, PROP_STYLES, styles);

  ref = useCombinedRefs(ref);
  wrapperRef = useCombinedRefs(wrapperRef);
  inputRef = useCombinedRefs(inputRef);
  triggerRef = useCombinedRefs(triggerRef);
  popoverRef = useCombinedRefs(popoverRef);
  listBoxRef = useCombinedRefs(listBoxRef);

  let { overlayProps, placement, updatePosition } = useOverlayPosition({
    targetRef: triggerRef,
    overlayRef: popoverRef,
    scrollRef: listBoxRef,
    placement: `${direction} end`,
    shouldFlip: shouldFlip,
    isOpen: state.isOpen,
    onClose: state.close,
    offset: overlayOffset,
  });

  let {
    labelProps,
    inputProps,
    listBoxProps,
    buttonProps: triggerProps,
  } = useComboBox(
    {
      ...comboBoxStateProps,
      inputRef,
      buttonRef: triggerRef,
      listBoxRef,
      popoverRef,
      menuTrigger,
    },
    state,
  );

  let { isFocused, focusProps } = useFocus({ isDisabled });
  let { hoverProps, isHovered } = useHover({ isDisabled });

  // Get props for the button based on the trigger props from useComboBox
  let { buttonProps, isPressed: isTriggerPressed } = useButton(
    triggerProps,
    triggerRef,
  );
  let { hoverProps: triggerHoverProps, isHovered: isTriggerHovered } = useHover(
    { isDisabled },
  );
  let { focusProps: triggerFocusProps, isFocused: isTriggerFocused } = useFocus(
    { isDisabled },
    true,
  );

  useLayoutEffect(() => {
    if (state.isOpen) {
      updatePosition();
    }
  }, [state.isOpen, state.collection.size]);

  let isInvalid = validationState === 'invalid';

  let validationIcon = isInvalid ? InvalidIcon : ValidIcon;
  let validation = cloneElement(validationIcon);

  // Clear button logic
  let hasValue = props.allowsCustomValue
    ? state.inputValue !== ''
    : state.selectedKey != null;
  let showClearButton =
    isClearable && hasValue && !isDisabled && !props.isReadOnly;

  // Clear function
  let clearValue = useEvent(() => {
    if (props.allowsCustomValue) {
      props.onInputChange?.('');
      // If state has a setInputValue method, use it as well
      if (
        'setInputValue' in state &&
        typeof state.setInputValue === 'function'
      ) {
        state.setInputValue('');
      }
    } else {
      props.onSelectionChange?.(null);
      // If state has a setSelectedKey method, use it as well
      if (
        'setSelectedKey' in state &&
        typeof state.setSelectedKey === 'function'
      ) {
        state.setSelectedKey(null);
      }
    }
    // Close the popup if it's open
    if (state.isOpen) {
      state.close();
    }
    // Focus back to the input
    inputRef.current?.focus();
  });

  let comboBoxWidth = wrapperRef?.current?.offsetWidth;

  if (icon) {
    icon = <div data-element="InputIcon">{icon}</div>;

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

  let mods = useMemo(
    () => ({
      invalid: isInvalid,
      valid: validationState === 'valid',
      disabled: isDisabled,
      hovered: isHovered,
      focused: isFocused,
      loading: isLoading,
      prefix: !!prefix,
      suffix: true,
      clearable: showClearButton,
    }),
    [
      isInvalid,
      validationState,
      isDisabled,
      isHovered,
      isFocused,
      isLoading,
      prefix,
      showClearButton,
    ],
  );

  // If input is not full and the user presses Enter, pick the first option.
  let onKeyPress = useEvent((e: KeyboardEvent) => {
    if (!props.onSelectionChange) {
      return;
    }

    if (e.key === 'Enter') {
      if (!props.allowsCustomValue) {
        if (state.isOpen) {
          // If there is a selected option then do nothing. It will be selected on Enter anyway.
          if (listBoxRef.current?.querySelector('li[aria-selected="true"]')) {
            return;
          }

          const option = [...state.collection][0]?.key;

          if (option && selectedKey !== option) {
            props.onSelectionChange?.(option);

            e.stopPropagation();
            e.preventDefault();
          }
        } else if (
          inputRef.current?.value &&
          ![...state.collection]
            .map((i) => i.textValue)
            .includes(inputRef.current?.value)
        ) {
          // If the input value is not in the collection, we need to prevent the submitting of the form.
          // Also, we reset value manually.
          e.preventDefault();
          props.onSelectionChange?.(null);
        }
        // If a custom value is allowed, we need to check if the input value is in the collection.
      } else if (props.allowsCustomValue) {
        const inputValue = inputRef?.current?.value;

        const item = [...state.collection].find(
          (item) => item.textValue.toLowerCase() === inputValue?.toLowerCase(),
        );

        props.onSelectionChange?.(
          item ? item.key : inputRef?.current?.value ?? '',
        );
      }
    }
  });

  let onBlur = useEvent((e: FocusEvent) => {
    // If the input value is not in the collection, we need to reset the value.
    if (
      !props.allowsCustomValue &&
      inputRef.current?.value &&
      ![...state.collection]
        .map((i) => i.textValue)
        .includes(inputRef.current?.value)
    ) {
      props.onSelectionChange?.(null);
    }
  });

  useEffect(() => {
    inputRef.current?.addEventListener('keydown', onKeyPress, true);
    inputRef.current?.addEventListener('blur', onBlur, true);

    return () => {
      inputRef.current?.removeEventListener('keydown', onKeyPress, true);
      inputRef.current?.removeEventListener('blur', onBlur, true);
    };
  }, []);

  let allInputProps = useMemo(
    () => mergeProps(inputProps, hoverProps, focusProps),
    [inputProps, hoverProps, focusProps],
  );

  let comboBoxField = (
    <ComboBoxWrapperElement
      ref={wrapperRef}
      qa={qa || 'ComboBox'}
      mods={mods}
      styles={wrapperStyles}
      style={{
        zIndex: isFocused ? 1 : 'initial',
      }}
      data-size={size}
    >
      {prefix ? <div data-element="Prefix">{prefix}</div> : null}
      <InputElement
        ref={inputRef}
        qa="Input"
        autoFocus={autoFocus}
        data-autofocus={autoFocus ? '' : undefined}
        {...allInputProps}
        autoComplete={autoComplete}
        styles={inputStyles}
        mods={mods}
        data-size={size}
      />
      <div data-element="Suffix">
        {suffixPosition === 'before' ? suffix : null}
        {validationState || isLoading ? (
          <>
            {validationState && !isLoading ? validation : null}
            {isLoading ? <LoadingIcon /> : null}
          </>
        ) : null}
        {suffixPosition === 'after' ? suffix : null}
        {showClearButton && (
          <ClearButton
            size={size}
            type={validationState === 'invalid' ? 'clear' : 'neutral'}
            theme={validationState === 'invalid' ? 'danger' : undefined}
            qa="ComboBoxClearButton"
            data-no-trigger={hideTrigger ? '' : undefined}
            onPress={clearValue}
          />
        )}
        {!hideTrigger ? (
          <TriggerElement
            data-popover-trigger
            qa="ComboBoxTrigger"
            {...mergeProps(buttonProps, triggerFocusProps, triggerHoverProps)}
            ref={triggerRef}
            mods={{
              pressed: isTriggerPressed,
              focused: isTriggerFocused,
              hovered: isTriggerHovered,
              disabled: isDisabled,
              loading: isLoading,
            }}
            data-size={size}
            isDisabled={isDisabled}
            styles={triggerStyles}
          >
            <DownIcon />
          </TriggerElement>
        ) : null}
      </div>
      <OverlayWrapper isOpen={state.isOpen && !isDisabled}>
        <ListBoxPopup
          {...listBoxProps}
          shouldUseVirtualFocus
          listBoxRef={listBoxRef}
          popoverRef={popoverRef}
          overlayProps={overlayProps}
          placement={placement}
          state={state}
          listBoxStyles={listBoxStyles}
          overlayStyles={overlayStyles}
          optionStyles={optionStyles}
          minWidth={comboBoxWidth}
          triggerRef={triggerRef}
        />
      </OverlayWrapper>
    </ComboBoxWrapperElement>
  );

  return wrapWithField<Omit<CubeComboBoxProps<T>, 'children'>>(
    comboBoxField,
    ref,
    mergeProps({ ...props, styles }, { labelProps }),
  );
}) as unknown as (<T>(
  props: CubeComboBoxProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReactElement) & { Item: typeof Item; Section: typeof BaseSection };

type SectionComponentCB = typeof BaseSection;

const ComboBoxSectionComponent = Object.assign(BaseSection, {
  displayName: 'Section',
}) as SectionComponentCB;

ComboBox.Item = Item;

ComboBox.Section = ComboBoxSectionComponent;

Object.defineProperty(ComboBox, 'cubeInputType', {
  value: 'ComboBox',
  enumerable: false,
  configurable: false,
});
