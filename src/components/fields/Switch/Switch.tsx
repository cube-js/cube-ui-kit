import { useFocusableRef } from '@react-spectrum/utils';
import { BaseProps, Styles, tasty } from '@tenphi/tasty';
import { forwardRef, ReactElement, useRef } from 'react';
import { AriaSwitchProps, useHover, useSwitch } from 'react-aria';
import { useToggleState } from 'react-stately';

import { LoadingIcon } from '../../../icons/LoadingIcon';
import { FieldBaseProps, ToggleSelectionProps } from '../../../shared';
import { mergeProps, mergeRefs } from '../../../utils/react';
import {
  getDisabledElementProps,
  getInertInputProps,
} from '../../../utils/react/disabledProps';
import { useFocus } from '../../../utils/react/interactions';
import {
  castNullableIsSelected,
  WithNullableSelected,
} from '../../../utils/react/nullableValue';
import { useId } from '../../../utils/react/useId';
import { Text } from '../../content/Text';
import { useAutoTooltip } from '../../content/use-auto-tooltip';
import { getValidationMods, useFieldProps, wrapWithField } from '../../form';
import {
  FieldLayoutStyleProps,
  splitFieldLayout,
} from '../../form/field-layout';
import { HiddenInput } from '../../HiddenInput';
import {
  mergeTooltipFocusProps,
  splitTooltipTriggerProps,
} from '../../overlays/Tooltip/split-trigger-props';

import type { CubeTooltipProviderProps } from '../../overlays/Tooltip/TooltipProvider';

const SwitchWrapperElement = tasty({
  as: 'label',
  styles: {
    display: 'flex',
    position: 'relative',
    placeItems: {
      '': 'center stretch',
      'side-label': 'baseline stretch',
    },
    gap: '1x',
    width: 'max max-content',
    color: '#dark-02',
  },
});

const SwitchElement = tasty({
  styles: {
    boxSizing: 'border-box',
    position: 'relative',
    verticalAlign: 'baseline',
    placeSelf: 'center',
    radius: 'round',
    fill: {
      '': '#surface',
      checked: '#primary',
      'invalid & checked': '#danger',
      'valid & checked': '#success',
      readonly: '#surface-2',
      disabled: '#border.5',
      'disabled & checked': '#border',
    },
    color: {
      '': '#dark-03',
      checked: '#white',
      'readonly & checked': '#dark-02',
    },
    border: {
      '': '#dark-05',
      checked: '#primary-text',
      readonly: '#dark-05',
      disabled: '#dark-05.5',
      invalid: '#danger',
      valid: '#success',
    },
    width: {
      '': '5x 5x',
      'size=medium': '4x 4x',
      'size=small': '3x 3x',
    },
    height: {
      '': '3x 3x',
      'size=medium': '2.5x 2.5x',
      'size=small': '2x 2x',
    },
    outline: {
      '': '#primary-text.0',
      focused: '$ring-width #primary-text',
    },
    outlineOffset: '$outline-offset',
    transition: 'theme',
    cursor: '$pointer',

    Thumb: {
      position: 'absolute',
      width: {
        '': '2x 2x',
        'size=medium': '1.5x 1.5x',
        'size=small': '1.25x 1.25x',
      },
      height: {
        '': '2x 2x',
        'size=medium': '1.5x 1.5x',
        'size=small': '1.25x 1.25x',
      },
      radius: 'round',
      fill: {
        '': '#current',
        disabled: '#current.5',
        'disabled & checked': '#white.8',
      },
      top: {
        '': '.375x',
        'size=medium': '.375x',
        'size=small': '.25x',
      },
      left: {
        '': '.375x',
        'size=medium': '.375x',
        'size=small': '.25x',
        checked: '2.25x',
        'checked & size=medium': '1.75x',
        'checked & size=small': '1.25x',
      },
      transition: 'left, theme',
      cursor: '$pointer',
    },
  },
});

export interface CubeSwitchProps
  extends
    BaseProps,
    FieldLayoutStyleProps,
    FieldBaseProps<boolean | null | undefined>,
    ToggleSelectionProps,
    Omit<AriaSwitchProps, 'form' | 'name'> {
  inputStyles?: Styles;
  isLoading?: boolean;
  size?: 'large' | 'medium' | 'small';
  /**
   * The switch's own tooltip, shown on hover over the switch and its inline
   * label and on keyboard focus, also while the switch is disabled: a disabled
   * switch with a tooltip stays focusable. A string, or `TooltipProvider` props
   * (`title`, `placement`, …). The info badge next to a field label is
   * `labelTooltip`.
   */
  tooltip?: string | Omit<CubeTooltipProviderProps, 'children'>;
}

function Switch(rawProps: WithNullableSelected<CubeSwitchProps>, ref) {
  rawProps = castNullableIsSelected(rawProps);
  let props = useFieldProps(rawProps, {
    defaultValidationTrigger: 'onChange',
    valuePropsMapper: ({ value, onChange }) => ({
      isSelected: value != null ? value : false,
      isIndeterminate: false,
      onChange: onChange,
    }),
  });

  let {
    qa,
    isDisabled = false,
    isReadOnly = false,
    children,
    label,
    insideForm,
    isLoading,
    labelPosition,
    inputStyles,
    isInvalid,
    isValid,
    size = 'medium',
    form,
    tooltip,
  } = props;

  const id = useId(props.id);

  const { styles, field } = splitFieldLayout(props);

  let { isFocused, focusProps } = useFocus(true);
  // A read-only switch takes no hover state: a press would change nothing.
  let { hoverProps, isHovered } = useHover({
    isDisabled: isDisabled || isReadOnly,
  });

  let inputRef = useRef(null);
  let domRef = useFocusableRef(ref, inputRef);

  let { renderWithTooltip, isTooltipActive } = useAutoTooltip({
    tooltip,
    children: null,
  });

  // React Aria writes `form` onto the input as the id of its `<form>`, so the
  // form instance would render as `form="[object Object]"` and detach it. It
  // reads `children` only to warn about a switch with no visible label; a
  // field `label` is one, named through its `<label for>`.
  let { inputProps, isDisabled: isInputDisabled } = useSwitch(
    { ...props, form: undefined, children: children ?? label },
    useToggleState(props),
    inputRef,
  );

  // A disabled switch with a tooltip keeps its focus, as `Checkbox` does: the
  // tooltip is usually the reason it is disabled, and focus is how the keyboard
  // opens it. It is `aria-disabled` and inert instead.
  if (
    getDisabledElementProps({
      isDisabled: isInputDisabled,
      keepEvents: isTooltipActive,
      as: 'input',
    }).isInert
  ) {
    inputProps = getInertInputProps(inputProps, {
      excludeFromTabOrder: props.excludeFromTabOrder,
    });
  }

  const mods = {
    checked: inputProps.checked,
    disabled: isDisabled,
    readonly: isReadOnly,
    hovered: isHovered,
    focused: isFocused,
    ...getValidationMods({ isInvalid, isValid }),
    'inside-form': insideForm,
    'side-label': labelPosition === 'side',
  };

  // The input, where keyboard focus lands, takes the tooltip's focus-side
  // trigger props; the wrapper keeps the hover side and positions the tooltip.
  // It shares the field's ref, which is the wrapper with or without chrome.
  const switchField = renderWithTooltip((tooltipTriggerProps, tooltipRef) => {
    const { pointerProps, focusProps: tooltipFocusProps } =
      splitTooltipTriggerProps(tooltipTriggerProps);

    return (
      <SwitchWrapperElement
        ref={tooltipRef ? mergeRefs(domRef, tooltipRef) : domRef}
        qa="SwitchWrapper"
        mods={mods}
        data-size={size}
        styles={styles}
        {...mergeProps(hoverProps, pointerProps)}
      >
        <HiddenInput
          qa={qa || 'Switch'}
          data-input-type="switch"
          // For a dialog kept mounted while closed, as on `Button`.
          {...(props.autoFocus ? { 'data-autofocus': '' } : undefined)}
          {...mergeTooltipFocusProps(
            mergeProps(inputProps, focusProps),
            tooltipFocusProps,
          )}
          ref={inputRef}
          id={id}
          // Not left to the native `disabled`, which an inert input drops.
          mods={{ disabled: isInputDisabled }}
        />
        <SwitchElement
          data-element="Input"
          mods={mods}
          data-size={size}
          styles={inputStyles}
        >
          <div data-element="Thumb" aria-hidden="true" />
        </SwitchElement>
        {/*
          Not `nowrap`: it inherits, so no label could wrap and a long one ran out
          of its container. The label inherits the wrapper's font and color, so
          a caller's `styles` reach it.
        */}
        {children ? <Text>{children}</Text> : null}
        {isLoading ? (
          <>
            {label ? <>&nbsp;</> : null}
            <LoadingIcon />
          </>
        ) : null}
      </SwitchWrapperElement>
    );
  }, 'top');

  // `renderWithTooltip` is typed for any node; here it returns an element.
  return wrapWithField(switchField as ReactElement, {
    ...props,
    ...field,
    // The switch's own, not the legacy spelling of `labelTooltip`.
    tooltip: undefined,
    id,
    labelProps: {
      ...props.labelProps,
      for: id,
    },
    children: null,
    inputStyles,
  });
}

/**
 * Switches allow users to turn an individual option on or off.
 * They are usually used to activate or deactivate a specific setting.
 */
let _Switch = forwardRef(Switch);

(_Switch as any).cubeInputType = 'Checkbox';
_Switch.displayName = 'Switch';

export { _Switch as Switch };
export type { AriaSwitchProps };
export { useSwitch };
