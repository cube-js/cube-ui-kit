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
import { Item, useComboBoxState } from 'react-stately';

import { useEvent } from '../../../_internal/index';
import { LoadingIcon } from '../../../icons';
import { useProviderProps } from '../../../provider';
import {
  BLOCK_STYLES,
  extractStyles,
  OUTER_STYLES,
  tasty,
} from '../../../tasty';
import {
  mergeProps,
  modAttrs,
  useCombinedRefs,
  useLayoutEffect,
} from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
import { OverlayWrapper } from '../../overlays/OverlayWrapper';
import { InvalidIcon } from '../../shared/InvalidIcon';
import { ValidIcon } from '../../shared/ValidIcon';
import { DEFAULT_INPUT_STYLES, INPUT_WRAPPER_STYLES } from '../index';
import { ListBoxPopup } from '../Select';

import type { KeyboardDelegate, LoadingState } from '@react-types/shared';
import type { CubeSelectBaseProps } from '../Select';

type FilterFn = (textValue: string, inputValue: string) => boolean;

export type MenuTriggerAction = 'focus' | 'input' | 'manual';

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

const ComboBoxWrapperElement = tasty({
  styles: INPUT_WRAPPER_STYLES,
});

const InputElement = tasty({
  as: 'input',
  styles: DEFAULT_INPUT_STYLES,
});

const TriggerElement = tasty({
  as: 'button',
  styles: {
    display: 'grid',
    placeItems: 'center',
    placeContent: 'center',
    placeSelf: 'stretch',
    radius: '(1r - 1bw) right',
    width: '4x',
    color: {
      '': '#dark-02',
      hovered: '#dark-02',
      pressed: '#purple',
      '[disabled]': '#dark.30',
    },
    border: 0,
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

export interface CubeComboBoxProps<T>
  extends Omit<
      CubeSelectBaseProps<T>,
      'onOpenChange' | 'onBlur' | 'onFocus' | 'validate' | 'onSelectionChange'
    >,
    AriaComboBoxProps<T>,
    AriaTextFieldProps {
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
  size?: 'small' | 'default' | 'large' | string;
  suffixPosition?: 'before' | 'after';
  menuTrigger?: MenuTriggerAction;
  allowsCustomValue?: boolean;
}

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
    suffix,
    listBoxStyles,
    overlayStyles,
    hideTrigger,
    message,
    description,
    size,
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
    ...otherProps
  } = props;

  let isAsync = loadingState != null;
  let { contains } = useFilter({ sensitivity: 'base' });

  let state = useComboBoxState({
    ...props,
    defaultFilter: filter || contains,
    filter: undefined,
    allowsEmptyCollection: isAsync,
    menuTrigger,
  });

  const outerStyles = extractStyles(otherProps, OUTER_STYLES, styles);

  inputStyles = extractStyles(otherProps, BLOCK_STYLES, inputStyles);

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
      ...props,
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
    }),
    [
      isInvalid,
      validationState,
      isDisabled,
      isHovered,
      isFocused,
      isLoading,
      prefix,
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
      {...modAttrs(mods)}
      styles={outerStyles}
      style={{
        zIndex: isFocused ? 1 : 'initial',
      }}
      data-size={size}
    >
      <InputElement
        ref={inputRef}
        qa="Input"
        autoFocus={autoFocus}
        data-autofocus={autoFocus ? '' : undefined}
        {...allInputProps}
        autoComplete={autoComplete}
        styles={inputStyles}
        {...modAttrs(mods)}
        data-size={size}
      />
      {prefix ? <div data-element="Prefix">{prefix}</div> : null}
      <div data-element="Suffix">
        {suffixPosition === 'before' ? suffix : null}
        {validationState || isLoading ? (
          <>
            {validationState && !isLoading ? validation : null}
            {isLoading ? <LoadingIcon /> : null}
          </>
        ) : null}
        {suffixPosition === 'after' ? suffix : null}
        {!hideTrigger ? (
          <TriggerElement
            qa="ComboBoxTrigger"
            {...mergeProps(buttonProps, triggerFocusProps, triggerHoverProps)}
            {...modAttrs({
              pressed: isTriggerPressed,
              focused: isTriggerFocused,
              hovered: isTriggerHovered,
              disabled: isDisabled,
              loading: isLoading,
            })}
            ref={triggerRef}
            data-size={size}
            isDisabled={isDisabled}
            styles={triggerStyles}
          >
            <CaretDownIcon />
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
) => ReactElement) & { Item: typeof Item };

ComboBox.Item = Item;
Object.defineProperty(ComboBox, 'cubeInputType', {
  value: 'ComboBox',
  enumerable: false,
  configurable: false,
});
