import { useFocusableRef } from '@react-spectrum/utils';
import { forwardRef, useMemo, useRef } from 'react';
import { useHover, useRadio } from 'react-aria';

import { useProviderProps } from '../../../provider';
import { FieldBaseProps } from '../../../shared';
import {
  BaseProps,
  extractStyles,
  filterBaseProps,
  OUTER_STYLES,
  OuterStyleProps,
  tasty,
} from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';
import { CubeItemBaseProps, ItemBase } from '../../content/ItemBase/ItemBase';
import { INLINE_LABEL_STYLES, useFieldProps, useFormProps } from '../../form';
import { HiddenInput } from '../../HiddenInput';

import { useRadioProvider } from './context';
import { RadioGroup } from './RadioGroup';

import type { AriaRadioProps } from 'react-aria';

export { AriaRadioProps };
export { useRadio };

const RadioButtonElement = tasty(ItemBase, {
  qa: 'Radio',
  as: 'label',
  styles: {
    preset: 't3m',
    lineHeight: '1fs',
  },
});

const TabRadioButtonSelectedElement = tasty(RadioButtonElement, {
  qa: 'RadioSelected',
  styles: {
    fill: '#white',
    shadow: '0 0 .5x #shadow',
  },
});

const RadioWrapperElement = tasty({
  as: 'label',
  qa: 'RadioWrapper',
  styles: {
    position: 'relative',
    display: 'grid',
    placeItems: {
      '': 'center start',
      button: 'stretch',
    },
    gap: '1x',
    flow: 'column',
    preset: 'default',
    width: 'min-content',
    margin: {
      '': '1x right',
      button: '0',
    },
    zIndex: {
      '': 'initial',
      checked: 1,
    },
    flexGrow: 1,
  },
});

const RadioNormalElement = tasty({
  styles: {
    display: 'grid',
    placeItems: 'center',
    radius: 'round',
    fill: {
      '': '#white',
      disabled: '#dark.04',
    },
    color: {
      checked: '#purple-text',
      'invalid & checked': '#danger-text',
      'disabled | !checked': '#clear',
      'disabled & checked': '#dark.12',
    },
    border: {
      '': '#dark-04',
      checked: '#purple-text',
      invalid: '#danger-text.50',
      disabled: '#dark.12',
    },
    width: '2x',
    height: '2x',
    outline: {
      '': '#purple-text.0',
      focused: '1bw #purple-text',
    },
    outlineOffset: 1,
    transition: 'theme',
    whiteSpace: 'nowrap',

    RadioCircle: {
      display: 'block',
      radius: 'round',
      width: '1x',
      height: '1x',
      fill: 'currentColor',
    },
  },
});

const RadioCircleElement = <div data-element="RadioCircle" />;

const RadioLabelElement = tasty({
  qa: 'RadioLabel',
  styles: INLINE_LABEL_STYLES,
});

export interface CubeRadioProps
  extends BaseProps,
    AriaRadioProps,
    Omit<FieldBaseProps, 'tooltip'>,
    OuterStyleProps {
  /* The visual type of the radio button */
  type?: 'button' | 'radio';
  buttonType?: Exclude<CubeItemBaseProps['type'], 'secondary'>;
  value?: string;
  /* Whether the radio is invalid */
  isInvalid?: boolean;
  /* Size of the button (for button type only) */
  size?: Omit<CubeItemBaseProps['size'], 'inline'>;
  /* Icon to display (for button type only) */
  icon?: CubeItemBaseProps['icon'];
  /* Icon to display on the right (for button type only) */
  rightIcon?: CubeItemBaseProps['rightIcon'];
  /* Description text (for button type only) */
  description?: CubeItemBaseProps['description'];
  /* Tooltip configuration (for button type only) */
  tooltip?: CubeItemBaseProps['tooltip'];
  /* Keyboard shortcut (for button type only) */
  hotkeys?: CubeItemBaseProps['hotkeys'];
}

function Radio(props: CubeRadioProps, ref) {
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, { defaultValidationTrigger: 'onChange' });

  let {
    qa,
    isDisabled,
    isInvalid,
    children,
    label,
    autoFocus,
    labelStyles,
    labelProps,
    type,
    buttonType,
    size,
    icon,
    rightIcon,
    description,
    tooltip,
    hotkeys,
    'aria-label': ariaLabel,
    form,
    ...otherProps
  } = props;

  label = label || children;

  let styles = extractStyles(otherProps, OUTER_STYLES);

  labelStyles = {
    ...INLINE_LABEL_STYLES,
    ...labelStyles,
  };

  let radioGroupProps = useRadioProvider();

  let state = radioGroupProps && radioGroupProps.state;
  let name = radioGroupProps && radioGroupProps.name;
  let contextSize = radioGroupProps?.size;
  let contextButtonType = radioGroupProps?.buttonType;
  let contextType = radioGroupProps?.type;
  let contextIsDisabled = radioGroupProps?.isDisabled;

  if (!state) {
    throw new Error('CubeUI: The Radio button is used outside the RadioGroup.');
  }

  // Determine effective type from props or context
  let effectiveType = type ?? contextType ?? 'radio';
  let isButton = effectiveType === 'button' || effectiveType === 'tabs';

  // Determine effective size with priority: prop > context > default
  let effectiveSize =
    size ?? contextSize ?? (effectiveType === 'tabs' ? 'small' : 'medium');

  // Apply size mapping for tabs mode button radios
  if (effectiveType === 'tabs' && isButton) {
    if (effectiveSize === 'small' || effectiveSize === 'medium') {
      effectiveSize = 'xsmall';
    } else if (effectiveSize === 'large') {
      effectiveSize = 'medium';
    } else if (effectiveSize === 'xlarge') {
      effectiveSize = 'large';
    }
    // 'xsmall' stays 'xsmall'
  }

  // Determine effective button type
  // In tabs mode, always use 'neutral' and ignore buttonType prop
  let effectiveButtonType;
  if (effectiveType === 'tabs') {
    effectiveButtonType = 'neutral'; // Force neutral for tabs, ignore buttonType
  } else {
    const baseButtonType = buttonType ?? contextButtonType ?? 'outline';
    // When buttonType is 'primary', use 'secondary' for non-selected and 'primary' for selected
    if (baseButtonType === 'primary') {
      effectiveButtonType =
        state.selectedValue === props.value ? 'primary' : 'secondary';
    } else {
      effectiveButtonType = baseButtonType;
    }
  }

  // Use context isDisabled if prop isDisabled is not explicitly set
  let effectiveIsDisabled = isDisabled ?? contextIsDisabled ?? false;

  let { isFocused, focusProps } = useFocus(
    { isDisabled: effectiveIsDisabled },
    true,
  );
  let { hoverProps, isHovered } = useHover({ isDisabled: effectiveIsDisabled });

  let inputRef = useRef(null);
  let domRef = useFocusableRef(ref, inputRef);

  let {
    inputProps,
    isDisabled: isRadioDisabled,
    isSelected: isRadioSelected,
  } = useRadio(
    {
      name,
      ...props,
      isDisabled: effectiveIsDisabled,
    },
    state,
    inputRef,
  );

  const mods = useMemo(
    () => ({
      checked: isRadioSelected,
      invalid: !!isInvalid,
      disabled: isRadioDisabled,
      hovered: isHovered,
      button: isButton,
      focused: isFocused,
      tabs: effectiveType === 'tabs',
    }),
    [
      isRadioSelected,
      isInvalid,
      isRadioDisabled,
      isHovered,
      isButton,
      isFocused,
      effectiveType,
    ],
  );

  // Render button type using ItemBase
  if (isButton) {
    const ButtonElement =
      isRadioSelected && contextType === 'tabs'
        ? TabRadioButtonSelectedElement
        : RadioButtonElement;

    return (
      <ButtonElement
        ref={domRef}
        qa={qa || 'Radio'}
        type={effectiveButtonType}
        theme={isInvalid ? 'danger' : 'default'}
        size={effectiveSize}
        icon={icon}
        rightIcon={rightIcon}
        description={description}
        tooltip={tooltip}
        hotkeys={hotkeys}
        isSelected={isRadioSelected}
        isDisabled={isRadioDisabled}
        mods={mods}
        styles={styles}
        {...mergeProps(hoverProps, focusProps)}
      >
        <HiddenInput
          data-qa={qa || 'Radio'}
          aria-label={ariaLabel}
          {...inputProps}
          ref={inputRef}
          form={null}
          mods={{ button: isButton, disabled: isRadioDisabled }}
        />
        {label}
      </ButtonElement>
    );
  }

  // Render classic radio type
  return (
    <RadioWrapperElement
      styles={styles}
      {...hoverProps}
      ref={domRef}
      mods={mods}
      data-type={type}
    >
      <HiddenInput
        data-qa={qa || 'Radio'}
        aria-label={ariaLabel}
        {...mergeProps(inputProps, focusProps)}
        ref={inputRef}
        mods={{ button: isButton }}
      />
      <RadioNormalElement data-element="Input" mods={mods} data-type={type}>
        {RadioCircleElement}
      </RadioNormalElement>
      {label && (
        <RadioLabelElement
          mods={mods}
          styles={labelStyles}
          {...filterBaseProps(labelProps)}
        >
          {label}
        </RadioLabelElement>
      )}
    </RadioWrapperElement>
  );
}

/**
 * Radio buttons allow users to select a single option from a list of mutually exclusive options.
 * All possible options are exposed up front for users to compare.
 */
const _Radio = forwardRef(Radio);

const Tabs = tasty(RadioGroup, {
  type: 'tabs',
});

const ButtonGroup = tasty(RadioGroup, {
  type: 'button',
});

const __Radio = Object.assign(
  _Radio as typeof _Radio & {
    Group: typeof RadioGroup;
    Tabs: typeof Tabs;
    ButtonGroup: typeof ButtonGroup;
  },
  {
    Group: RadioGroup,
    Tabs,
    ButtonGroup,
  },
);

__Radio.displayName = 'Radio';

export { __Radio as Radio };
