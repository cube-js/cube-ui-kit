import { useFocusableRef } from '@react-spectrum/utils';
import {
  BaseProps,
  filterBaseProps,
  OUTER_STYLES,
  OuterStyleProps,
  tasty,
} from '@tenphi/tasty';
import { forwardRef, useMemo, useRef } from 'react';
import { useHover, useRadio } from 'react-aria';

import { useProviderProps } from '../../../provider';
import { FieldBaseProps } from '../../../shared';
import { mergeProps } from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';
import { extractStyles } from '../../../utils/styles';
import { CubeItemProps, Item } from '../../content/Item/Item';
import { INLINE_LABEL_STYLES, useFieldProps, useFormProps } from '../../form';
import { HiddenInput } from '../../HiddenInput';
import { RADIO_SIZE_MAP } from '../../navigation/Tabs/types';

import { useRadioProvider } from './context';
import { RadioGroup } from './RadioGroup';

import type { AriaRadioProps } from 'react-aria';

export { AriaRadioProps };
export { useRadio };

const RadioButtonElement = tasty(Item, {
  qa: 'RadioButton',
  as: 'label',
  styles: {
    preset: 't3m',
    lineHeight: '1em',
    flexGrow: 1,
    gridTemplate:
      '"icon prefix label suffix rightIcon actions" auto / max-content max-content max-content max-content max-content max-content',
    placeContent: 'center',
    shadow: {
      '': false,
      'tabs & selected': '$item-shadow',
      'tabs & selected & disabled': false,
    },
    fill: {
      'selected & tabs': '#surface',
      'selected & tabs & disabled': '#surface.6',
    },
    color: {
      'selected & tabs': '#dark',
      'selected & tabs & disabled': '#dark.3',
    },

    // Mirror the ButtonSplit grouping: the corner radius is shared so the
    // first/last items keep only their outer-side radius and middle items go
    // square; a -1bw left margin overlaps adjacent borders into a single
    // continuous edge. The selected button is bumped above its siblings so its
    // brand-tinted border is visible from all four sides — without the bump
    // the right edge of an adjacent sibling would paint over the selected
    // button's left edge (and vice-versa). Hover / focus-visible bump higher
    // still so they always read on top of the selected highlight.
    radius: {
      '': true,
      '!tabs & !:last-child': '1r left',
      '!tabs & !:first-child': '1r right',
      '!tabs & !:first-child & !:last-child': 0,
    },
    margin: {
      '': 0,
      '!tabs & !:first-child': '-1bw left',
    },
    zIndex: {
      '!tabs & selected': 1,
    },

    Label: {
      placeSelf: {
        '': 'center start',
        '!has-prefix & !has-suffix & !has-icon & !has-right-icon': 'center',
      },
    },
  },
});

const RadioWrapperElement = tasty({
  as: 'label',
  qa: 'RadioWrapper',
  styles: {
    position: 'relative',
    display: 'grid',
    placeItems: 'center start',
    placeContent: 'center start',
    gap: '1x',
    flow: 'column',
    preset: 'default',
    width: 'min-content',
    radius: true,
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
      '': '#surface',
      disabled: '#disabled-surface',
    },
    color: {
      '': '#clear',
      checked: '#primary',
      'invalid & checked': '#danger-text',
      'disabled | !checked': '#clear',
      'disabled & checked': '#dark.12',
    },
    border: {
      '': '#dark-04',
      checked: '#primary-text',
      invalid: '#danger-text.50',
      disabled: '#dark.12',
    },
    width: '2x',
    height: '2x',
    outline: {
      '': '#primary-text.0 / 1bw',
      focused: '1bw #primary-text / 1bw',
    },
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
  'aria-label'?: string;
  /* The visual type of the radio button */
  type?: 'button' | 'radio';
  buttonType?: CubeItemProps['type'];
  value?: string;
  /* Whether the radio is invalid */
  isInvalid?: boolean;
  /* Size of the button (for button type only) */
  size?: Omit<CubeItemProps['size'], 'inline'>;
  /* Icon to display (for button type only) */
  icon?: CubeItemProps['icon'];
  /* Icon to display on the right (for button type only) */
  rightIcon?: CubeItemProps['rightIcon'];
  /* Prefix element (for button type only) */
  prefix?: CubeItemProps['prefix'];
  /* Suffix element (for button type only) */
  suffix?: CubeItemProps['suffix'];
  /* Description text (for button type only) */
  description?: CubeItemProps['description'];
  /* Tooltip configuration (for button type only) */
  tooltip?: CubeItemProps['tooltip'];
  /* Keyboard shortcut (for button type only) */
  hotkeys?: CubeItemProps['hotkeys'];
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
    prefix,
    suffix,
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
  let effectiveSize: CubeItemProps['size'] = (size ??
    contextSize ??
    'medium') as CubeItemProps['size'];

  // Apply size mapping for tabs mode button radios.
  // API sizes mapped to Item button sizes: large -> medium (40px), medium -> xsmall (32px).
  if (effectiveType === 'tabs' && isButton) {
    effectiveSize =
      RADIO_SIZE_MAP[effectiveSize === 'large' ? 'large' : 'medium'];
  }

  // Determine effective button type
  // In tabs mode, always use 'clear' and ignore buttonType prop.
  let effectiveButtonType: string;
  // When buttonType is 'primary', non-selected radios use 'outline' with a
  // visual-only `selected` mod (mods.selected=true) to render the brand-tinted
  // outline+selected look — this is the only place mods.selected intentionally
  // decouples from the aria/isSelected state.
  let forceSelectedMod = false;
  if (effectiveType === 'tabs') {
    effectiveButtonType = 'clear';
  } else {
    const baseButtonType = buttonType ?? contextButtonType ?? 'outline';
    if (baseButtonType === 'primary') {
      if (state.selectedValue === props.value) {
        effectiveButtonType = 'primary';
      } else {
        effectiveButtonType = 'outline';
        forceSelectedMod = true;
      }
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

  // Render button type using Item
  if (isButton) {
    return (
      <RadioButtonElement
        ref={domRef}
        type={effectiveButtonType}
        theme={isInvalid ? 'danger' : 'default'}
        size={effectiveSize}
        icon={icon}
        rightIcon={rightIcon}
        prefix={prefix}
        suffix={suffix}
        description={description}
        tooltip={tooltip}
        hotkeys={hotkeys}
        isSelected={isRadioSelected}
        isDisabled={isRadioDisabled}
        mods={{ ...mods, ...(forceSelectedMod ? { selected: true } : {}) }}
        styles={styles}
        {...mergeProps(hoverProps, focusProps)}
      >
        <HiddenInput
          qa={qa || 'Radio'}
          data-input-type="radio"
          aria-label={ariaLabel}
          {...inputProps}
          ref={inputRef}
          form={null}
          mods={{ button: isButton, disabled: isRadioDisabled }}
        />
        {label}
      </RadioButtonElement>
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
        qa={qa || 'Radio'}
        data-input-type="radio"
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
          {...(labelProps ? filterBaseProps(labelProps) : undefined)}
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
    Button: typeof _Radio;
  },
  {
    Group: RadioGroup,
    Tabs,
    ButtonGroup,
    Button: _Radio,
  },
);

__Radio.displayName = 'Radio';

export { __Radio as Radio };
