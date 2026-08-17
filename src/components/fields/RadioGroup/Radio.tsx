import { useFocusableRef } from '@react-spectrum/utils';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  OUTER_STYLES,
  tasty,
} from '@tenphi/tasty';
import { forwardRef, useMemo, useRef } from 'react';
import { useHover, useRadio } from 'react-aria';

import { FieldBaseProps } from '../../../shared';
import { mergeProps } from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';
import { extractStyles } from '../../../utils/styles';
import { CubeItemProps, Item } from '../../content/Item/Item';
import {
  getValidationMods,
  getValidationTheme,
  INLINE_LABEL_STYLES,
  useFieldProps,
} from '../../form';
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
    // Same areas as `Item`, but every column is `max-content` — a radio button
    // is sized by its content, not stretched like a list item. The
    // `description` rows have to be repeated here because a plain string would
    // replace `Item`'s whole state map and leave the description without a
    // grid area to land in.
    gridTemplate: {
      '': '"icon prefix label suffix rightIcon actions" auto / max-content max-content max-content max-content max-content max-content',
      'description=inline':
        '"icon prefix description suffix rightIcon actions" auto / max-content max-content max-content max-content max-content max-content',
      'description=inline & has-label':
        '"icon prefix label suffix rightIcon actions" auto "icon prefix description suffix rightIcon actions" auto / max-content max-content max-content max-content max-content max-content',
      'description=block':
        '"icon prefix label suffix rightIcon actions" auto "description description description description description description" auto / max-content max-content max-content max-content max-content max-content',
    },
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
      checked: '#primary-text',
      'invalid & checked': '#danger-text',
      'valid & checked': '#success-text',
      'disabled | !checked': '#clear',
      'disabled & checked': '#dark.12',
    },
    border: {
      '': '#dark-04',
      checked: '#primary-text',
      invalid: '#danger-text.50',
      valid: '#success-text.50',
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
      fill: '#current',
    },
  },
});

const RadioCircleElement = <div data-element="RadioCircle" />;

const RadioLabelElement = tasty({
  qa: 'RadioLabel',
  styles: INLINE_LABEL_STYLES,
});

/**
 * `Item` props a button-type radio hands straight to the `Item` it renders, so
 * `Radio.Button` accepts the same content and presentation API as an
 * `ItemButton`. Kept as a runtime list so a new `Item` prop only has to be
 * added in one place.
 *
 * Deliberately absent:
 * - `size`, `type`, `theme`, `isSelected`, `isDisabled`, `mods`, `styles` —
 *   owned by the radio (they come from the prop/context/validation resolution
 *   below).
 * - `shape` — the radius is owned by the button-group layout below, which keeps
 *   only the outer-side radius on the first/last radio so the group reads as one
 *   continuous control. Forwarding `shape` would have no effect.
 * - `htmlType`, `as`, `insideWrapper`, `showActions` — internal to `Item` /
 *   `ItemButton`.
 * - `actions`, `autoHideActions`, `preserveActionsSpace`,
 *   `disableActionsFocus` — a button radio renders as a `<label>`, and a click
 *   anywhere inside a label activates its control, so nested action buttons
 *   would select the radio (and nested interactive content is invalid inside a
 *   label to begin with).
 */
const ITEM_PROPS = [
  'icon',
  'rightIcon',
  'prefix',
  'suffix',
  'description',
  'descriptionPlacement',
  'descriptionProps',
  'tooltip',
  'hotkeys',
  'keyboardShortcutProps',
  'level',
  'isLoading',
  'loadingSlot',
  'highlight',
  'highlightCaseSensitive',
  'highlightStyles',
  'labelRef',
] as const;

type RadioItemProps = Pick<CubeItemProps, (typeof ITEM_PROPS)[number]>;

export interface CubeRadioProps
  extends BaseProps,
    AriaRadioProps,
    Omit<FieldBaseProps, 'tooltip'>,
    /**
     * Container style props apply to button-type radios (they style the `Item`
     * the radio renders). A classic radio only reads the outer subset —
     * everything else belongs to its inner circle and label.
     */
    ContainerStyleProps,
    /** All of these apply to button/tabs-type radios only. */
    RadioItemProps {
  'aria-label'?: string;
  /* The visual type of the radio button */
  type?: 'button' | 'radio';
  buttonType?: CubeItemProps['type'];
  value?: string;
  /* Size of the button (for button type only) */
  size?: Omit<CubeItemProps['size'], 'inline'>;
}

function Radio(props: CubeRadioProps, ref) {
  props = useFieldProps(props, { defaultValidationTrigger: 'onChange' });

  let {
    qa,
    isDisabled,
    isInvalid,
    isValid,
    children,
    label,
    autoFocus,
    labelStyles,
    labelProps,
    type,
    buttonType,
    size,
    'aria-label': ariaLabel,
    form,
    ...otherProps
  } = props;

  label = label || children;

  // Only the props the caller actually passed, so an unset one keeps `Item`'s
  // own default instead of being overridden with `undefined`.
  const itemProps: Record<string, unknown> = {};

  for (const itemPropName of ITEM_PROPS) {
    if (itemPropName in props) {
      itemProps[itemPropName] = (props as Record<string, unknown>)[
        itemPropName
      ];
    }
  }

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

  // A button radio *is* an `Item`, so it takes the same container style props an
  // `ItemButton` does. A classic radio only exposes the outer subset: the rest
  // would land on the wrapper that holds the circle and the label, where
  // `padding` / `fill` / `preset` mean something entirely different.
  let styles = extractStyles(
    otherProps,
    isButton ? CONTAINER_STYLES : OUTER_STYLES,
  );

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
  let baseIsDisabled = isDisabled ?? contextIsDisabled ?? false;

  // Loading has to disable the radio here, not inside `Item`. `useRadio` and the
  // `HiddenInput` covering the button own the actual selection, so leaving it to
  // `Item` would render a spinner on an option that still takes clicks and arrow
  // keys. And because this component always passes a resolved `isDisabled` down,
  // an unresolved `isLoading` would additionally read to `Item` as an explicit
  // `isDisabled={false}` and cancel its own loading-disables-the-item rule.
  //
  // Same precedence as `Item` / `ItemButton`: an explicit `isDisabled={false}`
  // still wins over loading. Button-type only — a classic radio has no spinner,
  // so disabling it on `isLoading` would leave no visible reason why.
  let isLoadingButton = isButton && props.isLoading === true;
  let effectiveIsDisabled =
    baseIsDisabled === true || (isLoadingButton && isDisabled !== false);

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
      ...getValidationMods({ isInvalid, isValid }),
      disabled: isRadioDisabled,
      hovered: isHovered,
      button: isButton,
      focused: isFocused,
      tabs: effectiveType === 'tabs',
    }),
    [
      isRadioSelected,
      isInvalid,
      isValid,
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
        theme={getValidationTheme(
          'default',
          { isInvalid, isValid },
          { includeValid: true },
        )}
        size={effectiveSize}
        {...itemProps}
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
