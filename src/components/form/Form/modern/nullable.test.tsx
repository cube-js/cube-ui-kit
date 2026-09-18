import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';

import { renderWithRoot } from '../../../../test/render';
import { Checkbox } from '../../../fields/Checkbox/Checkbox';
import { CheckboxGroup } from '../../../fields/Checkbox/CheckboxGroup';
import { FileInput } from '../../../fields/FileInput/FileInput';
import { NumberInput } from '../../../fields/NumberInput/NumberInput';
import { Radio } from '../../../fields/RadioGroup/Radio';
import { RadioGroup } from '../../../fields/RadioGroup/RadioGroup';
import { RangeSlider } from '../../../fields/Slider/RangeSlider';
import { Slider } from '../../../fields/Slider/Slider';
import { Switch } from '../../../fields/Switch/Switch';
import { TextInput } from '../../../fields/TextInput/TextInput';
import { TextInputMapper } from '../../../fields/TextInputMapper/TextInputMapper';
import { Form } from '../index';

import { createFormController } from './controller';

describe('nullable modern field models', () => {
  it('preserves API nulls until interaction and restores them on reset', async () => {
    const defaults = {
      enabled: null,
      confirmed: null,
      tags: null,
      choice: null,
    };
    const onValuesChange = vi.fn();
    const onSubmit = vi.fn();
    const form = createFormController<{
      enabled: boolean | null;
      confirmed: boolean | null;
      tags: string[] | null;
      choice: string | null;
    }>({ defaultValues: defaults, onValuesChange, onSubmit });
    const view = renderWithRoot(
      <StrictMode>
        <Form form={form}>
          <Switch field={form.field('enabled', { defaultValue: true })}>
            Enabled
          </Switch>
          <Checkbox field={form.field('confirmed')}>Confirmed</Checkbox>
          <CheckboxGroup
            field={form.field('tags', { defaultValue: ['news'] })}
            label="Tags"
          >
            <Checkbox value="news">News</Checkbox>
          </CheckboxGroup>
          <RadioGroup field={form.field('choice')} label="Choice">
            <Radio value="email">Email</Radio>
          </RadioGroup>
          <Form.Reset>Reset</Form.Reset>
        </Form>
      </StrictMode>,
    );
    const enabled = view.getByRole('switch', { name: 'Enabled' });
    const confirmed = view.getByRole('checkbox', { name: 'Confirmed' });
    const news = view.getByRole('checkbox', { name: 'News' });
    const email = view.getByRole('radio', { name: 'Email' });
    for (const input of [enabled, confirmed, news, email])
      expect(input).not.toBeChecked();
    expect(form.getValues()).toEqual(defaults);
    expect(onValuesChange).not.toHaveBeenCalled();
    expect(view.getByRole('button', { name: 'Reset' })).toBeDisabled();
    await act(async () => {
      await form.submit();
    });
    expect(onSubmit).toHaveBeenLastCalledWith(defaults, expect.anything());

    for (const input of [enabled, confirmed, news, email])
      await userEvent.click(input);
    expect(form.getValues()).toEqual({
      enabled: true,
      confirmed: true,
      tags: ['news'],
      choice: 'email',
    });
    await userEvent.click(view.getByRole('button', { name: 'Reset' }));
    expect(form.getValues()).toEqual(defaults);
    for (const input of [enabled, confirmed, news, email])
      expect(input).not.toBeChecked();
    expect(form.getFieldSnapshot('enabled')).toMatchObject({
      value: null,
      defaultValue: null,
      dirty: false,
      touched: false,
    });
  });

  it('keeps empty scalar, range, file, and mapping fields null in submitted values', async () => {
    const defaults = {
      text: null,
      number: null,
      slider: null,
      range: null,
      file: null,
      mapping: null,
    };
    const onValuesChange = vi.fn();
    const onSubmit = vi.fn();
    const form = createFormController<{
      text: string | null;
      number: number | null;
      slider: number | null;
      range: [number, number] | null;
      file: string | null;
      mapping: Record<string, string> | null;
    }>({ defaultValues: defaults, onValuesChange, onSubmit });
    renderWithRoot(
      <StrictMode>
        <Form form={form}>
          <TextInput field={form.field('text')} label="Text" />
          <NumberInput field={form.field('number')} label="Number" />
          <Slider field={form.field('slider')} label="Slider" />
          <RangeSlider field={form.field('range')} label="Range" />
          <FileInput field={form.field('file')} label="File" />
          <TextInputMapper field={form.field('mapping')} label="Mapping" />
        </Form>
      </StrictMode>,
    );
    expect(form.getValues()).toEqual(defaults);
    expect(onValuesChange).not.toHaveBeenCalled();
    await act(async () => {
      await form.submit();
    });
    expect(onSubmit).toHaveBeenLastCalledWith(defaults, expect.anything());

    act(() =>
      form.setValues({
        text: 'Hello',
        number: 5,
        slider: 10,
        range: [10, 20],
        file: 'example.txt',
        mapping: { a: 'b' },
      }),
    );
    act(() => form.reset());
    expect(form.getValues()).toEqual(defaults);
    await act(async () => {
      await form.submit();
    });
    expect(onSubmit).toHaveBeenLastCalledWith(defaults, expect.anything());
  });
});
