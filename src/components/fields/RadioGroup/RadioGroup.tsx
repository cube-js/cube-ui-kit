import { getActiveElement, useObjectRef } from '@react-aria/utils';
import { BaseProps, Styles, tasty } from '@tenphi/tasty';
import { forwardRef, useRef } from 'react';
import { AriaRadioGroupProps, useFocusRing, useRadioGroup } from 'react-aria';
import { RadioGroupState, useRadioGroupState } from 'react-stately';

import { Provider } from '../../../provider';
import { FieldBaseProps } from '../../../shared';
import { mergeProps } from '../../../utils/react';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { CubeItemProps } from '../../content/Item/Item';
import { FormScopeMask, useFieldProps, wrapWithField } from '../../form';
import {
  FieldLayoutStyleProps,
  splitFieldLayout,
} from '../../form/field-layout';

import { RadioContext } from './context';

import type { KeyboardEvent } from 'react';

export interface CubeRadioGroupProps
  extends
    BaseProps,
    Omit<AriaRadioGroupProps, 'errorMessage' | 'form' | 'name'>,
    FieldLayoutStyleProps,
    FieldBaseProps<string | null | undefined> {
  groupStyles?: Styles;
  orientation?: 'horizontal' | 'vertical';
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /* Size for all radio buttons in the group */
  size?: Exclude<CubeItemProps['size'], 'inline'>;
  /* Button type for all button-style radios (ignored in tabs mode). When set to 'primary', selected buttons use 'primary' and non-selected use 'outline' with isSelected appearance */
  buttonType?: CubeItemProps['type'];
  /* Visual type for all radios in the group: radio (default), button, or tabs */
  type?: 'radio' | 'button' | 'tabs';
}

const RadioGroupElement = tasty({
  qa: 'RadioGroup',
  styles: {
    display: 'flex',
    placeItems: 'stretch',
    placeContent: 'stretch',
    flow: {
      '': 'column',
      horizontal: 'row wrap',
      'horizontal & tabs': 'row',
    },
    padding: {
      '': '0',
      tabs: '.5x',
    },
    // The tabs layout is the only one with padding, and a caller that gives the
    // group an explicit width (`width: 100%` inside a popover, say) means the
    // box it can see. Without this the padding is added on top and the group
    // overhangs its container by `1x`.
    boxSizing: 'border-box',
    radius: true,
    fill: {
      '': '#clear',
      'tabs | disabled': '#surface-4',
    },
    width: 'max-content max-content initial',
    flexShrink: 0,
    gap: {
      '': '1x',
      button: 0,
      tabs: '.5x',
    },
    whiteSpace: 'nowrap',
    // Keyboard focus ring on the group, shown only for button/tabs layouts
    // where individual items are visually merged (button-group) or share a
    // single chrome (tabs) — the classic vertical radio list already shows
    // a per-item focus ring on the radio circle.
    outline: {
      '': '$ring-width #primary-text.0 / $outline-offset',
      'focused & (button | tabs)':
        '$ring-width #primary-text / $outline-offset',
    },
  },
});

/**
 * Whether focus rests on the radio with this value while it is disabled. Only
 * a radio kept focusable for its tooltip can be: a natively disabled one never
 * takes focus (see `Radio`).
 */
function isFocusedDisabledRadio(value: string | null) {
  let element = getActiveElement();

  return (
    element instanceof HTMLInputElement &&
    element.type === 'radio' &&
    element.value === value &&
    element.getAttribute('aria-disabled') === 'true'
  );
}

function RadioGroup(rawProps: WithNullableValue<CubeRadioGroupProps>, ref) {
  let orientation = rawProps.orientation;

  // `null` is the radio group's own "nothing selected".
  rawProps = castNullableStringValue(rawProps, null);
  let props = useFieldProps(rawProps, { defaultValidationTrigger: 'onChange' });

  let {
    qa,
    id,
    isDisabled,
    isReadOnly,
    isRequired,
    labelPosition = 'top',
    isInvalid,
    isValid,
    children,
    styles,
    groupStyles,
    insideForm,
    // orientation, // ignore orientation since it came from the form context
    labelProps: baseLabelProps,
    size,
    buttonType,
    type,
    form,
  } = props;
  let domRef = useObjectRef(ref);

  const fieldLayout = splitFieldLayout(props);

  styles = fieldLayout.styles;

  let baseState = useRadioGroupState(props);
  // The arrow keys focus the next radio and select it. A disabled radio that
  // keeps focus for its tooltip is reached that way too, and has to stop the
  // selection the way a read-only group does: focus moves, the value stays.
  // Only the arrow keys: a click elsewhere or a form reset still selects.
  let isArrowKeyRef = useRef(false);
  let state: RadioGroupState = {
    ...baseState,
    setSelectedValue(value) {
      if (isArrowKeyRef.current && isFocusedDisabledRadio(value)) return;

      baseState.setSelectedValue(value);
    },
  };

  // Set default orientation based on type
  if (orientation == null) {
    orientation =
      type === 'button' || type === 'tabs' ? 'horizontal' : 'vertical';
  }

  // React Aria hands `form` to every radio's input as the id of its `<form>`,
  // so the form instance would render as `form="[object Object]"` on each.
  let { radioGroupProps, labelProps } = useRadioGroup(
    { ...props, orientation, form: undefined },
    state,
  );

  let { onKeyDown: onArrowKey, ...groupProps } = radioGroupProps;
  let onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    isArrowKeyRef.current = true;
    onArrowKey?.(event);
    isArrowKeyRef.current = false;
  };

  // Keyboard-only focus ring on the group container (button/tabs layouts).
  // `within: true` tracks focus on any descendant radio. We read
  // `isFocusVisible` (not `isFocused`), which is keyboard-gated — mouse
  // clicks on a radio focus the input but leave `isFocusVisible` false.
  let { isFocusVisible: isFocusWithinVisible, focusProps: groupFocusProps } =
    useFocusRing({ within: true });

  let radioGroup = (
    <RadioGroupElement
      ref={domRef}
      // Keep semantics and keyboard handling on the group: `isBare` omits
      // the field wrapper.
      {...mergeProps(groupProps, groupFocusProps)}
      onKeyDown={onKeyDown}
      // `useRadioGroup` seeds its id once; the current one follows the form
      // binding.
      id={id}
      qa={qa || 'RadioGroup'}
      styles={styles}
      data-input-type="radiogroup"
      data-radio-button-group={type === 'button' ? '' : undefined}
      mods={{
        horizontal: orientation === 'horizontal',
        'inside-form': insideForm,
        'side-label': labelPosition === 'side',
        button: type === 'button',
        tabs: type === 'tabs',
        focused: isFocusWithinVisible,
      }}
    >
      <FormScopeMask
        value={{
          isRequired,
          isInvalid,
          isValid,
          isDisabled,
        }}
      >
        {/* Each radio is a field that reads the provider before the form
            context, so the group's own state has to reach it here to beat an
            enclosing disabled form. `<Provider>` skips `undefined`, so a group
            that sets nothing keeps the form's state. */}
        <Provider isDisabled={isDisabled} isReadOnly={isReadOnly}>
          <RadioContext.Provider
            value={{
              state,
              name: props.name,
              size,
              buttonType,
              type,
            }}
          >
            {children}
          </RadioContext.Provider>
        </Provider>
      </FormScopeMask>
    </RadioGroupElement>
  );

  return wrapWithField(radioGroup, {
    ...props,
    ...fieldLayout.field,
    labelProps: mergeProps(baseLabelProps, labelProps),
  });
}

/**
 * Radio groups allow users to select a single option from a list of mutually exclusive options.
 * All possible options are exposed up front for users to compare.
 */
const _RadioGroup = forwardRef(RadioGroup);

(_RadioGroup as any).cubeInputType = 'RadioGroup';
_RadioGroup.displayName = 'RadioGroup';

export { _RadioGroup as RadioGroup };
