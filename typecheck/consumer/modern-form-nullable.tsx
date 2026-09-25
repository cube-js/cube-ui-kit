import {
  Checkbox,
  CheckboxGroup,
  FileInput,
  Form,
  NumberInput,
  RadioGroup,
  RangeSlider,
  Slider,
  Switch,
  TagInput,
  TextInput,
  TextInputMapper,
} from '@cube-dev/ui-kit';

import type { FormController } from '@cube-dev/ui-kit';

interface NullableModel {
  enabled?: boolean | null;
  tags?: string[] | null;
  text?: string | null;
  amount?: number | null;
  range?: [number, number] | null;
  mapping?: Record<string, string> | null;
}

export function NullableFields({
  form,
}: {
  form: FormController<NullableModel>;
}) {
  const enabled = form.field('enabled', {
    defaultValue: null,
    validate: (value) => {
      const nullable: boolean | null | undefined = value;
      // @ts-expect-error validation must handle API nulls
      const nonNullable: boolean | undefined = value;
      void nonNullable;
      return nullable === null ? 'Choose a value' : undefined;
    },
  });
  const value: boolean | null | undefined = Form.useValue(form, 'enabled');
  void value;

  // @ts-expect-error nullable string models still cannot bind to toggles
  const wrongToggle = <Switch field={form.field('text')} />;
  // @ts-expect-error nullable booleans still cannot bind to text inputs
  const wrongText = <TextInput field={enabled} />;
  // @ts-expect-error nullable arrays must still have the right element type
  const wrongGroup = <CheckboxGroup field={form.field('range')} />;
  // @ts-expect-error nullable arrays must still hold strings
  const wrongTags = <TagInput field={form.field('range')} />;
  // @ts-expect-error nullable string models still cannot bind to numeric inputs
  const wrongSlider = <Slider field={form.field('text')} />;
  // @ts-expect-error nullable scalar models cannot bind to range inputs
  const wrongRange = <RangeSlider field={form.field('amount')} />;
  // @ts-expect-error nullable numbers cannot bind to mapping inputs
  const wrongMapping = <TextInputMapper field={form.field('amount')} />;

  return (
    <>
      <Switch field={enabled} />
      <Checkbox field={enabled} />
      <CheckboxGroup field={form.field('tags')} />
      <TagInput field={form.field('tags')} />
      <RadioGroup field={form.field('text')} />
      <FileInput field={form.field('text')} />
      <Slider field={form.field('amount')} />
      <RangeSlider field={form.field('range')} />
      <TextInputMapper field={form.field('mapping')} />
      <TextInput field={form.field('text')} />
      <NumberInput field={form.field('amount')} />
      {wrongToggle}
      {wrongText}
      {wrongGroup}
      {wrongTags}
      {wrongSlider}
      {wrongRange}
      {wrongMapping}
    </>
  );
}
