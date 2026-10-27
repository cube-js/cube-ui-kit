import { useFocusableRef } from '@react-spectrum/utils';
import { IconCheck, IconMinus } from '@tabler/icons-react';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  Element,
  filterBaseProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
import {
  forwardRef,
  ReactElement,
  RefObject,
  useContext,
  useMemo,
  useRef,
} from 'react';
import {
  AriaCheckboxProps,
  useCheckbox,
  useCheckboxGroupItem,
  useHover,
} from 'react-aria';
import { useToggleState } from 'react-stately';

import { Icon } from '../../../icons/Icon';
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
import { extractStyles } from '../../../utils/styles';
import { useAutoTooltip } from '../../content/use-auto-tooltip';
import {
  getValidationMods,
  INLINE_LABEL_STYLES,
  LABEL_STYLES,
  resolveValidationProps,
  useFieldProps,
  wrapWithField,
} from '../../form';
import { HiddenInput } from '../../HiddenInput';
import {
  mergeTooltipFocusProps,
  splitTooltipTriggerProps,
  TooltipFocusProps,
} from '../../overlays/Tooltip/split-trigger-props';

import { CheckboxGroup } from './CheckboxGroup';
import { CheckboxGroupContext } from './context';

import type { FocusableRef } from '@react-types/shared';
import type { CubeTooltipProviderProps } from '../../overlays/Tooltip/TooltipProvider';

export interface CubeCheckboxProps
  extends
    BaseProps,
    ContainerStyleProps,
    Omit<AriaCheckboxProps, 'form' | 'name'>,
    ToggleSelectionProps,
    FieldBaseProps<boolean | null | undefined> {
  inputStyles?: Styles;
  isIndeterminate?: boolean;
  value?: string;
  /**
   * The checkbox's own tooltip, shown on hover over the box and its inline
   * label — also while the checkbox is disabled — and on keyboard focus. A string, or `TooltipProvider` props
   * (`title`, `placement`, …). The info badge next to a field label is
   * `labelTooltip`.
   */
  tooltip?: string | Omit<CubeTooltipProviderProps, 'children'>;
}

const CheckboxWrapperElement = tasty({
  as: 'label',
  qa: 'CheckboxWrapper',
  styles: {
    position: 'relative',
    display: 'flex',
    placeItems: 'center start',
    placeContent: 'baseline',
    gap: '1x',
    flow: 'row',
    preset: 'default',
    cursor: '$pointer',
    width: 'max max-content',
    color: '#dark-02',
  },
});

const CheckboxElement = tasty({
  styles: {
    display: 'grid',
    placeItems: 'center',
    radius: '.5r',
    fill: {
      '': '#surface',
      'checked | indeterminate': '#primary',
      'invalid & !checked': '#surface',
      'invalid & checked': '#danger',
      'valid & !checked': '#surface',
      'valid & checked': '#success',
      disabled: '#dark.12',
    },
    // The check / minus icon is always rendered inside the box, so the
    // default color must be transparent when the checkbox is neither
    // checked nor indeterminate — otherwise the white stroke shows through
    // the dark `#surface` fill in dark schemes (it used to be hidden
    // accidentally by the legacy white-on-white `fill: '#white'`).
    color: {
      '': '#clear',
      'checked | indeterminate': '#white',
    },
    border: {
      '': '#dark.30',
      invalid: '#danger',
      valid: '#success',
      'disabled | ((indeterminate | checked) & !invalid & !valid)': '#clear',
    },
    width: '(2x - 2bw)',
    height: '(2x - 2bw)',
    outline: {
      '': '#primary-text.0',
      focused: '$ring-width #primary-text',
    },
    outlineOffset: '$outline-offset',
    transition: 'theme',
  },
});

function Checkbox(
  allProps: WithNullableSelected<CubeCheckboxProps>,
  ref: FocusableRef,
) {
  // Swap hooks depending on whether this checkbox is inside a CheckboxGroup.
  // This is a bit unorthodox. Typically, hooks cannot be called in a conditional,
  // but since the checkbox won't move in and out of a group, it should be safe.
  let groupState = useContext(CheckboxGroupContext);

  const originalProps = castNullableIsSelected(allProps);

  const props = useFieldProps(originalProps, {
    defaultValidationTrigger: 'onChange',
    valuePropsMapper: ({ value, onChange }) => ({
      isSelected: value ?? false,
      isIndeterminate: false,
      onChange: onChange,
    }),
    unsafe__isDisabled: !!groupState,
  });

  let {
    qa,
    isIndeterminate = false,
    isDisabled = false,
    insideForm,
    children,
    label,
    isInvalid,
    isValid,
    labelProps,
    labelRef,
    labelStyles,
    labelPosition,
    inputStyles,
    isHidden,
    tooltip,
  } = props;

  let styles: Styles = extractStyles(props, CONTAINER_STYLES);

  labelStyles = useMemo(
    () => ({
      ...(!groupState ? LABEL_STYLES : INLINE_LABEL_STYLES),
      ...labelStyles,
    }),
    [groupState, labelStyles],
  );

  let { isFocused, focusProps } = useFocus(true);
  let { hoverProps, isHovered } = useHover({ isDisabled });

  let inputRef = useRef(null);
  let domRef = useFocusableRef(ref, inputRef);

  let { renderWithTooltip, isTooltipActive } = useAutoTooltip({
    tooltip,
    children: null,
  });

  const toggleState = useToggleState(props);

  // React Aria writes `form` onto the input as the id of its `<form>`, so the
  // form instance would render as `form="[object Object]"` and detach it. It
  // reads `children` only to warn about a checkbox with no visible label; a
  // field `label` is one, named through its `<label for>`. Writing it into
  // `aria-label` instead used to drop the inline text from the name and
  // replace the caller's own `aria-label`.
  let ariaProps = { ...props, form: undefined, children: children ?? label };
  let { inputProps, isDisabled: isInputDisabled } = groupState
    ? useCheckboxGroupItem(
        {
          ...ariaProps,
          // Value is optional for standalone checkboxes, but required for CheckboxGroup items;
          // it's passed explicitly here to avoid typescript error (requires strictNullChecks disabled).
          value: props.value || '',
          // Only pass isRequired and the validation state to react-aria if they came from
          // the props for this individual checkbox, and not from the group via context.
          isRequired: originalProps.isRequired,
          isInvalid: resolveValidationProps(originalProps).isInvalid,
        },
        groupState,
        inputRef,
      )
    : useCheckbox(ariaProps, toggleState, inputRef);

  // A disabled checkbox with a tooltip to show keeps its focus, as a disabled
  // `Button` or `Radio` does: the tooltip is usually the reason it is disabled,
  // and focus is how the keyboard opens it. It is `aria-disabled` and inert
  // instead. React Aria's own result covers a disabled group too.
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

  // Decorative: the input already announces checked, unchecked and mixed.
  let markIcon = isIndeterminate ? (
    <Icon size={12} stroke={3} aria-hidden="true">
      <IconMinus />
    </Icon>
  ) : (
    <Icon size={12} stroke={3} aria-hidden="true">
      <IconCheck />
    </Icon>
  );

  if (groupState) {
    for (let key of ['isSelected', 'defaultSelected', 'isEmphasized']) {
      // The raw props: `castNullableIsSelected` turns `null` into `false`.
      if (allProps[key] != null) {
        console.warn(
          `CubeUIKit: ${key} is unsupported on individual <Checkbox> elements within a <CheckboxGroup>. Please apply these props to the group instead.`,
        );
      }
    }
    if (props.value == null) {
      console.warn(
        'CubeUIKit: A <Checkbox> element within a <CheckboxGroup> requires a `value` property.',
      );
    }
  }

  const mods = {
    checked: inputProps.checked,
    indeterminate: isIndeterminate,
    ...getValidationMods({ isInvalid, isValid }),
    disabled: isDisabled,
    hovered: isHovered,
    focused: isFocused,
    'side-label': labelPosition === 'side',
    'inside-form': insideForm,
  };

  // The wrapper's props, the same in both branches. React Aria puts `id`,
  // `aria-*` and `data-*` on the input, so they stay off the `<label>`: the
  // grouped one used to copy them, and `#id`, `for` and `aria-labelledby`
  // resolved to it. A caller's own `mods` stay, under the state ones.
  const wrapperProps = {
    className: props.className,
    style: props.style,
    qaVal: props.qaVal,
    styles,
    isHidden,
    mods: { ...props.mods, ...mods },
  };

  // The wrapper is the checkbox's element in both branches, so the field's ref
  // reaches it with or without the field chrome; a tooltip's ref shares it.
  const wrapperRefWith = (tooltipRef?: RefObject<HTMLElement>) =>
    tooltipRef ? mergeRefs(domRef, tooltipRef) : domRef;

  // The input, where keyboard focus lands, takes the tooltip's focus-side
  // trigger props; the wrapper keeps the hover side and positions the tooltip.
  const renderCheckbox = (tooltipFocusProps?: TooltipFocusProps) => (
    <>
      <HiddenInput
        qa={qa || 'Checkbox'}
        data-input-type="checkbox"
        // For a dialog kept mounted while closed, as on `Button`.
        {...(props.autoFocus ? { 'data-autofocus': '' } : undefined)}
        {...mergeTooltipFocusProps(
          mergeProps(inputProps, focusProps),
          tooltipFocusProps,
        )}
        ref={inputRef}
        // Not left to the native `disabled`, which an inert input drops.
        mods={{ disabled: isInputDisabled }}
      />
      <CheckboxElement data-element="Input" mods={mods} styles={inputStyles}>
        {markIcon}
      </CheckboxElement>
    </>
  );

  if (!groupState) {
    const checkboxField = renderWithTooltip(
      (tooltipTriggerProps, tooltipRef) => {
        const { pointerProps, focusProps: tooltipFocusProps } =
          splitTooltipTriggerProps(tooltipTriggerProps);

        return (
          // `styles` is forwarded here as well as in the in-group branch
          // below — it used to be extracted from props and then dropped on
          // this path, so `<Checkbox styles={{ … }}>` outside a group was a
          // silent no-op.
          <CheckboxWrapperElement
            {...wrapperProps}
            {...mergeProps(hoverProps, pointerProps)}
            ref={wrapperRefWith(tooltipRef)}
          >
            {renderCheckbox(tooltipFocusProps)}
            {children ? (
              // Same element and preset as the in-group branch. This path used
              // to force children through `<Text nowrap>`: `white-space:
              // nowrap` inherits, so a label longer than a few words — or any
              // custom node with two lines in it — could not wrap at all, and
              // the label also missed the preset a grouped one picks up.
              <Element
                styles={INLINE_LABEL_STYLES}
                mods={{
                  ...getValidationMods({ isInvalid, isValid }),
                  disabled: isDisabled,
                }}
              >
                {children}
              </Element>
            ) : null}
          </CheckboxWrapperElement>
        );
      },
      'top',
    );

    // `tooltip` is the checkbox's own here, not a legacy label badge.
    // `renderWithTooltip` is typed for any node; here it returns an element.
    // The field label names the input through `for`, which `useFieldProps`
    // leaves unset for a caller's own `id` and inside the legacy `<Field>`, as
    // `Switch` does.
    return wrapWithField(checkboxField as ReactElement, {
      ...props,
      tooltip: undefined,
      labelProps: { ...props.labelProps, for: props.id },
    });
  }

  return renderWithTooltip((tooltipTriggerProps, tooltipRef) => {
    const { pointerProps, focusProps: tooltipFocusProps } =
      splitTooltipTriggerProps(tooltipTriggerProps);

    return (
      <CheckboxWrapperElement
        {...wrapperProps}
        {...mergeProps(hoverProps, pointerProps)}
        ref={wrapperRefWith(tooltipRef)}
      >
        {renderCheckbox(tooltipFocusProps)}
        {(label ?? children) ? (
          <Element
            // Before `labelProps`, so a `ref` passed there still wins.
            ref={labelRef}
            styles={labelStyles}
            mods={{
              ...getValidationMods({ isInvalid, isValid }),
              disabled: isDisabled,
            }}
            {...(labelProps ? filterBaseProps(labelProps) : undefined)}
          >
            {label ?? children}
          </Element>
        ) : null}
      </CheckboxWrapperElement>
    );
  }, 'top');
}

/**
 * Checkboxes allow users to select multiple items from a list of individual items,
 * or to mark one individual item as selected.
 */
let _Checkbox = forwardRef(Checkbox);

(_Checkbox as any).cubeInputType = 'Checkbox';
let __Checkbox = Object.assign(
  _Checkbox as typeof _Checkbox & { Group: typeof CheckboxGroup },
  { Group: CheckboxGroup },
);

__Checkbox.displayName = 'Checkbox';

export { __Checkbox as Checkbox };
export type { AriaCheckboxProps };
export { useCheckbox };
