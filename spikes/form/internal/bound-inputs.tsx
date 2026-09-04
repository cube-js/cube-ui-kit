/**
 * Phase 2 spike — real UI Kit inputs behind the shared binding boundary.
 *
 * The inputs themselves are untouched. Each wrapper resolves the binding with
 * `useBoundField` and hands the input backend-neutral props (value, change
 * handler, error, id); with `name` stripped the input's own `useFieldProps`
 * runs in standalone mode. In Phase 3 this is what `useFieldProps` itself
 * becomes, so no wrapper layer ships.
 */
import { ReactNode } from 'react';

import { Checkbox } from '../../../src/components/fields/Checkbox/Checkbox';
import { RadioGroup } from '../../../src/components/fields/RadioGroup/RadioGroup';
import { Select } from '../../../src/components/fields/Select/Select';
import { TextInput } from '../../../src/components/fields/TextInput/TextInput';

import { BoundFieldProps, useBoundField } from './binding';

export function BoundTextInput(props: BoundFieldProps & { label?: ReactNode }) {
  const bound = useBoundField(props, {
    defaultValidationTrigger: 'onBlur',
    mapper: (value, onChange) => ({
      value: value?.toString() ?? '',
      onChange,
    }),
  });

  return <TextInput {...(bound as any)} />;
}

export function BoundSelect(
  props: BoundFieldProps & { label?: ReactNode; children?: ReactNode },
) {
  const bound = useBoundField(props, {
    defaultValidationTrigger: 'onChange',
    mapper: (value, onChange) => ({
      selectedKey: value ?? null,
      onSelectionChange: onChange,
    }),
  });

  return <Select {...(bound as any)} />;
}

BoundSelect.Item = Select.Item;

export function BoundCheckbox(
  props: BoundFieldProps & { label?: ReactNode; children?: ReactNode },
) {
  const bound = useBoundField(props, {
    defaultValidationTrigger: 'onChange',
    mapper: (value, onChange) => ({
      isSelected: value ?? false,
      isIndeterminate: false,
      onChange,
    }),
  });

  return <Checkbox {...(bound as any)} />;
}

export function BoundRadioGroup(
  props: BoundFieldProps & { label?: ReactNode; children?: ReactNode },
) {
  const bound = useBoundField(props, { defaultValidationTrigger: 'onChange' });

  return <RadioGroup {...(bound as any)} />;
}

/** A custom control: no UI Kit input at all, just the binding hook. */
export function CustomSwitch(props: BoundFieldProps & { label?: ReactNode }) {
  const bound = useBoundField(props, { defaultValidationTrigger: 'onChange' });
  const { label, value, onChange, onBlur, errorMessage, id } =
    bound as BoundFieldProps & {
      label?: ReactNode;
      value?: boolean;
      onChange?: (value: boolean) => void;
      onBlur?: () => void;
    };

  return (
    <div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={!!value}
        aria-label={typeof label === 'string' ? label : undefined}
        onClick={() => onChange?.(!value)}
        onBlur={onBlur}
      >
        {label}
      </button>
      {errorMessage ? <span role="alert">{errorMessage}</span> : null}
    </div>
  );
}
