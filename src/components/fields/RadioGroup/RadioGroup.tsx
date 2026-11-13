import { getActiveElement, useObjectRef } from '@react-aria/utils';
import {
  BaseProps,
  filterBaseProps,
  mergeStyles,
  Styles,
  tasty,
} from '@tenphi/tasty';
import { forwardRef, useRef } from 'react';
import { AriaRadioGroupProps, useFocusRing, useRadioGroup } from 'react-aria';
import { RadioGroupState, useRadioGroupState } from 'react-stately';

import { Provider } from '../../../provider';
import { FieldBaseProps } from '../../../shared/form';
import { mergeProps } from '../../../utils/react/mergeProps';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { CubeItemProps } from '../../content/Item/Item';
import {
  FieldLayoutStyleProps,
  splitFieldLayout,
} from '../../form/field-layout';
import { FormScopeMask } from '../../form/Form/FormContext';
import { useFieldProps } from '../../form/Form/use-field/use-field-props';
import { wrapWithField } from '../../form/wrapper';
import {
  SEGMENTED_LIST_STYLES,
  SEGMENTED_TRACK_STYLES,
} from '../../navigation/Tabs/segmented-styles';

import { RadioContext } from './context';
import { JOINED_GROUP_STYLES } from './joined-styles';

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

// In button mode the group is the joined row `ToggleGroup` shares
// (`joined-styles.ts`); in tabs mode it is the track of the segmented control
// `Tabs type="radio"` shares (`segmented-styles.ts`). Both are merged in after
// its own styles.
const RadioGroupElement = tasty({
  qa: 'RadioGroup',
  styles: mergeStyles(
    {
      flow: {
        '': 'column',
        horizontal: 'row wrap',
        'horizontal & tabs': 'row',
      },
      padding: '0',
      // The tabs layout is the only one with padding, and a caller that gives the
      // group an explicit width (`width: 100%` inside a popover, say) means the
      // box it can see. Without this the padding is added on top and the group
      // overhangs its container by `1x`.
      boxSizing: 'border-box',
      radius: true,
      fill: {
        '': '#clear',
        disabled: '#surface-4',
      },
      gap: '1x',
      // Keyboard focus ring on the group, shown only for the button layout,
      // where the items merge into one control. A classic radio shows a ring
      // on its circle, and a tabs segment one of its own, as a tab does.
      outline: {
        '': '$ring-width #primary-text.0 / $outline-offset',
        'focused & button': '$ring-width #primary-text / $outline-offset',
      },
    },
    JOINED_GROUP_STYLES,
    SEGMENTED_TRACK_STYLES,
    SEGMENTED_LIST_STYLES,
  ),
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
    mods,
  } = props;
  let domRef = useObjectRef(ref);

  // The caller's base props (`qaVal`, `className`, `style`, `tokens`, `theme`,
  // `data-*`, event handlers) reach the group, as on `ToggleGroup`. Not the
  // ones `useRadioGroup` already handles: a native `change` bubbles up from
  // each radio, so a forwarded `onChange` would be called with an event, and
  // `isDisabled` would turn on a `disabled` fill the group never shows.
  let {
    onChange: _onChange,
    onFocus: _onFocus,
    onBlur: _onBlur,
    onFocusChange: _onFocusChange,
    isDisabled: _isDisabled,
    mods: _mods,
    ...baseProps
  } = filterBaseProps(props, { eventProps: true });

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
    // The caller's own handler, which the explicit prop below would replace.
    baseProps.onKeyDown?.(event);
  };

  // Keyboard-only focus ring on the group container (button layout).
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
      {...mergeProps(baseProps, groupProps, groupFocusProps)}
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
        joined: type === 'button',
        tabs: type === 'tabs',
        segmented: type === 'tabs',
        focused: isFocusWithinVisible,
        'fill-width': fieldLayout.fillWidth,
        ...mods,
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
