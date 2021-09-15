import {
  CheckOutlined,
  LoadingOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { mergeProps } from '@react-aria/utils';
import { cloneElement, forwardRef, RefObject, useState } from 'react';
import { useComboBoxState } from '@react-stately/combobox';
import { useComboBox } from '@react-aria/combobox';
import { useButton } from '@react-aria/button';
import { useFormProps } from '../Form';
import { useHover } from '@react-aria/interactions';
import { useProviderProps } from '../../provider';
import { useFilter } from '@react-aria/i18n';
import { Base } from '../../components/Base';
import { extractStyles } from '../../utils/styles';
import { BLOCK_STYLES, OUTER_STYLES } from '../../styles/list';
import { useFocus } from '../../utils/interactions';
import { useContextStyles } from '../../providers/Styles';
import { modAttrs, useCombinedRefs } from '../../utils/react';
import { FieldWrapper } from '../../components/FieldWrapper';
import { CubeSelectBaseProps, ListBoxPopup } from '../Select/Select';
import { Prefix } from '../../components/Prefix';
import { Suffix } from '../../components/Suffix';
import { Space } from '../../components/Space';
import { Item } from '@react-stately/collections';
import { DEFAULT_INPUT_STYLES } from '../TextInput/TextInputBase';
import { useOverlayPosition } from '@react-aria/overlays';
import { OverlayWrapper } from '../../components/OverlayWrapper';
import { NuStyles } from '../../styles/types';
import {
  CollectionBase,
  DOMRef,
  KeyboardDelegate,
  LoadingState,
} from '@react-types/shared';
import { ComboBoxProps } from '@react-types/combobox';

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

const COMBOBOX_STYLES: NuStyles = {
  position: 'relative',
  display: 'grid',
} as const;

const INPUT_STYLES: NuStyles = {
  ...DEFAULT_INPUT_STYLES,
  width: '100%',
} as const;

const TRIGGER_STYLES: NuStyles = {
  display: 'grid',
  placeItems: 'center',
  placeContent: 'center',
  radius: 'right',
  padding: '1.5x 1x',
  color: 'inherit',
  border: 0,
  fill: {
    '': '#purple.0',
    hovered: '#dark.04',
    pressed: '#dark.08',
    disabled: '#clear',
  },
} as const;

export interface CubeComboBoxProps<T>
  extends CubeSelectBaseProps,
    ComboBoxProps<T>,
    CollectionBase<T> {
  multiLine?: boolean;
  autoComplete?: string;
  inputRef?: RefObject<HTMLInputElement | HTMLTextAreaElement>;
  /** The ref for the list box popover. */
  popoverRef?: RefObject<HTMLDivElement>;
  /** The ref for the list box. */
  listBoxRef?: RefObject<HTMLElement>;
  /** An optional keyboard delegate implementation, to override the default. */
  keyboardDelegate?: KeyboardDelegate;
  loadingState?: LoadingState;
  filter?: (val: any, str: string) => boolean;
}

function ComboBox<T extends object>(
  props: CubeComboBoxProps<T>,
  ref: DOMRef<HTMLDivElement>,
) {
  props = useProviderProps(props);
  props = useFormProps(props);

  let {
    qa,
    label,
    labelPosition = 'top',
    labelStyles,
    isRequired,
    necessityIndicator,
    validationState,
    prefix,
    isDisabled,
    multiLine,
    autoFocus,
    inputRef,
    triggerRef,
    popoverRef,
    listBoxRef,
    isLoading,
    loadingIndicator,
    insideForm,
    overlayOffset = 8,
    inputStyles,
    optionStyles,
    triggerStyles,
    suffix,
    disallowEmptySelection,
    listBoxStyles,
    overlayStyles,
    hideTrigger,
    message,
    autoComplete,
    direction = 'bottom',
    shouldFlip = true,
    requiredMark = true,
    menuTrigger = 'input',
    loadingState,
    filter,
    ...otherProps
  } = props;
  let isAsync = loadingState != null;
  let { contains } = useFilter({ sensitivity: 'base' });
  let [suffixWidth, setSuffixWidth] = useState(0);
  let [prefixWidth, setPrefixWidth] = useState(0);
  let state = useComboBoxState({
    ...props,
    defaultFilter: filter || contains,
    allowsEmptyCollection: isAsync,
  });

  const styles = extractStyles(otherProps, OUTER_STYLES, {
    ...COMBOBOX_STYLES,
    ...useContextStyles('ComboBox_Wrapper', props),
  });

  inputStyles = extractStyles(otherProps, BLOCK_STYLES, {
    ...INPUT_STYLES,
    ...useContextStyles('ComboBox', props),
    ...inputStyles,
  });

  triggerStyles = {
    ...TRIGGER_STYLES,
    ...useContextStyles('ComboBox_Trigger', props),
    ...triggerStyles,
  };

  ref = useCombinedRefs(ref);
  inputRef = useCombinedRefs(inputRef);
  triggerRef = useCombinedRefs(triggerRef);
  popoverRef = useCombinedRefs(popoverRef);
  listBoxRef = useCombinedRefs(listBoxRef);

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

  let { overlayProps, placement } = useOverlayPosition({
    targetRef: triggerRef,
    overlayRef: popoverRef,
    scrollRef: listBoxRef,
    // @ts-ignore
    placement: `${direction} end`,
    shouldFlip: shouldFlip,
    isOpen: state.isOpen,
    onClose: state.close,
    offset: overlayOffset,
  });

  if (prefix) {
    inputStyles.paddingLeft = `${prefixWidth}px`;
  }

  inputStyles.paddingRight = `${suffixWidth}px`;

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

  let isInvalid = validationState === 'invalid';

  let validationIcon = isInvalid ? (
    <WarningOutlined style={{ color: 'var(--danger-color)' }} />
  ) : (
    <CheckOutlined style={{ color: 'var(--success-color)' }} />
  );
  let validation = cloneElement(validationIcon);

  let comboBoxField = (
    <Base
      qa="ComboBoxWrapper"
      {...modAttrs({
        invalid: isInvalid,
        valid: validationState === 'valid',
        disabled: isDisabled,
        hovered: isHovered,
        focused: isFocused,
      })}
      styles={styles}
      style={{
        zIndex: isFocused ? 1 : 'initial',
      }}
    >
      <Base
        qa={qa || 'ComboBox'}
        as="input"
        {...mergeProps(inputProps, hoverProps, focusProps)}
        ref={inputRef}
        autoComplete={autoComplete}
        styles={inputStyles}
        {...modAttrs({
          invalid: isInvalid,
          valid: validationState === 'valid',
          disabled: isDisabled,
          hovered: isHovered,
          focused: isFocused,
        })}
      />
      {prefix ? (
        <Prefix
          onWidthChange={setPrefixWidth}
          padding="0 1x 0 1.5x"
          opacity={isDisabled ? '@disabled-opacity' : false}
          placeItems="center"
          outerGap={0}
        >
          {prefix}
        </Prefix>
      ) : null}
      <Suffix
        onWidthChange={setSuffixWidth}
        padding="1x left"
        opacity={isDisabled ? '@disabled-opacity' : false}
      >
        <Space gap={false} padding="0 1x">
          {validationState && !isLoading ? validation : null}
          {isLoading && <LoadingOutlined />}
        </Space>
        {suffix}
        {!hideTrigger ? (
          <Base
            as="button"
            {...mergeProps(buttonProps, triggerFocusProps, triggerHoverProps)}
            {...modAttrs({
              pressed: isTriggerPressed,
              focused: isTriggerFocused,
              hovered: isTriggerHovered,
              disabled: isDisabled,
            })}
            isDisabled={isDisabled}
            ref={triggerRef}
            styles={triggerStyles}
          >
            <CaretDownIcon />
          </Base>
        ) : null}
      </Suffix>
      <OverlayWrapper isOpen={state.isOpen && !isDisabled}>
        <ListBoxPopup
          {...listBoxProps}
          listBoxRef={listBoxRef}
          popoverRef={popoverRef}
          overlayProps={overlayProps}
          shouldUseVirtualFocus
          placement={placement}
          state={state}
          disallowEmptySelection={disallowEmptySelection}
          listBoxStyles={listBoxStyles}
          overlayStyles={overlayStyles}
          optionStyles={optionStyles}
        />
      </OverlayWrapper>
    </Base>
  );

  return (
    <FieldWrapper
      {...{
        labelPosition,
        label,
        insideForm,
        styles,
        isRequired,
        labelStyles,
        necessityIndicator,
        labelProps,
        isDisabled,
        validationState,
        message,
        requiredMark,
        Component: comboBoxField,
        ref: ref,
      }}
    />
  );
}

const _ComboBox = Object.assign(forwardRef(ComboBox), {
  cubeInputType: 'ComboBox',
  Item,
});
export { _ComboBox as ComboBox };
