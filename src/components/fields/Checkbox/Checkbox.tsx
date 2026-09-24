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
import { forwardRef, ReactElement, useContext, useMemo, useRef } from 'react';
import {
  AriaCheckboxProps,
  useCheckbox,
  useCheckboxGroupItem,
  useHover,
} from 'react-aria';
import { useToggleState } from 'react-stately';

import { Icon } from '../../../icons/Icon';
import { FieldBaseProps, ToggleSelectionProps } from '../../../shared';
import { mergeProps } from '../../../utils/react';
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
  extends BaseProps,
    ContainerStyleProps,
    AriaCheckboxProps,
    ToggleSelectionProps,
    FieldBaseProps<boolean | null | undefined> {
  /**
   * The form instance. Redeclared so that it wins over react-aria's DOM
   * `form: string` attribute when a consumer resolves react-aria's types for
   * real; `Omit<AriaCheckboxProps, 'form'>` would erase every other prop
   * in-repo, where those types resolve to `any` (see tsconfig.json).
   */
  form?: FieldBaseProps['form'];
  /** Field name; modern forms also accept nested tuple paths. */
  name?: FieldBaseProps['name'];
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
  qa: 'Checkbox',
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
      focused: '1bw #primary-text',
    },
    outlineOffset: 1,
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
    isRequired,
    children,
    label,
    isInvalid,
    isValid,
    labelProps,
    labelStyles,
    labelPosition,
    inputStyles,
    isHidden,
    form,
    tooltip,
    // Pulled out so it stays off the `<label>` spread below. The Aria hooks read
    // it from `props` directly; `filterBaseProps` already dropped it at runtime,
    // but it typed as a DOM `FormEventHandler` there, which it is not.
    onChange,
    ...otherProps
  } = props;

  let styles: Styles = extractStyles(props, CONTAINER_STYLES);

  labelStyles = useMemo(
    () => ({
      ...(!groupState ? LABEL_STYLES : INLINE_LABEL_STYLES),
      ...labelStyles,
    }),
    [groupState, labelStyles],
  );

  let { isFocused, focusProps } = useFocus({ isDisabled }, true);
  let { hoverProps, isHovered } = useHover({ isDisabled });

  let inputRef = useRef(null);
  let domRef = useFocusableRef(ref, inputRef);

  // Triggered by the wrapper rather than the input, so a disabled checkbox —
  // whose input ignores the pointer — still shows it.
  let { renderWithTooltip } = useAutoTooltip({ tooltip, children: null });

  const toggleState = useToggleState(props);

  let { inputProps } = groupState
    ? useCheckboxGroupItem(
        {
          ...props,
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
    : useCheckbox(
        {
          ...props,
          ...(typeof label === 'string' && label.trim()
            ? { 'aria-label': label }
            : {}),
        },
        toggleState,
        inputRef,
      );

  let markIcon = isIndeterminate ? (
    <Icon size={12} stroke={3}>
      <IconMinus />
    </Icon>
  ) : (
    <Icon size={12} stroke={3}>
      <IconCheck />
    </Icon>
  );

  if (groupState) {
    for (let key of ['isSelected', 'defaultSelected', 'isEmphasized']) {
      if (originalProps[key] != null) {
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

  // The input, where keyboard focus lands, takes the tooltip's focus-side
  // trigger props; the wrapper keeps the hover side and positions the tooltip.
  const renderCheckbox = (tooltipFocusProps?: TooltipFocusProps) => (
    <>
      <HiddenInput
        qa={qa || 'Checkbox'}
        data-input-type="checkbox"
        {...mergeTooltipFocusProps(
          mergeProps(inputProps, focusProps),
          tooltipFocusProps,
        )}
        ref={inputRef}
      />
      <CheckboxElement mods={mods} styles={inputStyles}>
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
            styles={styles}
            isHidden={isHidden}
            mods={mods}
            {...pointerProps}
            ref={tooltipRef}
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
    return wrapWithField(checkboxField as ReactElement, domRef, {
      ...props,
      tooltip: undefined,
    });
  }

  return renderWithTooltip((tooltipTriggerProps, tooltipRef) => {
    const { pointerProps, focusProps: tooltipFocusProps } =
      splitTooltipTriggerProps(tooltipTriggerProps);

    return (
      <CheckboxWrapperElement
        styles={styles}
        isHidden={isHidden}
        {...mergeProps(hoverProps, pointerProps)}
        {...filterBaseProps(otherProps)}
        ref={
          tooltipRef
            ? // Written only when React attaches the node, never during render.
              (element: HTMLLabelElement | null) => {
                (domRef as { current: HTMLElement | null }).current = element;
                (tooltipRef as { current: HTMLElement | null }).current =
                  element;
              }
            : domRef
        }
      >
        {renderCheckbox(tooltipFocusProps)}
        {label ?? children ? (
          <Element
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
