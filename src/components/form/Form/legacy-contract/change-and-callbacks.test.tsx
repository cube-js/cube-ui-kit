import { act, render, renderWithForm, userEvent } from '../../../../test/index';
import { TextInput } from '../../../fields/TextInput/TextInput';
import { Root } from '../../../Root';
import { Form, SubmitButton } from '../index';
import { CubeFormInstance, useForm } from '../use-form';

import { createRenderCounter, FieldProbe, renderOwnedForm } from './helpers';

vi.mock('../../../../_internal/hooks/use-warn');

/**
 * Legacy Form characterization — change notification and callbacks.
 *
 * Covers plan §7.1 items 15 (user vs programmatic touched/dirty), 16 (equal-value
 * setters), 17 (`onValuesChange` payload and timing), 18 (changing and removing
 * callbacks) and 28 (direct `submitError` / `forceReRender` usage).
 */

describe('legacy contract: touched, dirty and change notifications (§7.1 #15–#17)', () => {
  it('[frozen] a user change marks the field touched and notifies onValuesChange; programmatic setFieldValue does neither', async () => {
    const onValuesChange = vi.fn();
    const { formInstance, getByRole } = renderWithForm(
      <>
        <TextInput name="a" label="A" />
        <TextInput name="b" label="B" />
      </>,
      { formProps: { onValuesChange } },
    );

    await act(async () => {
      await userEvent.type(getByRole('textbox', { name: 'A' }), 'x');
    });

    expect(formInstance.isFieldTouched('a')).toBe(true);
    expect(formInstance.isFieldDirty('a')).toBe(true);
    expect(onValuesChange).toHaveBeenCalledTimes(1);
    expect(onValuesChange).toHaveBeenCalledWith({ a: 'x', b: undefined });

    onValuesChange.mockClear();

    await act(async () => {
      formInstance.setFieldValue('b', 'y');
    });

    expect(formInstance.isFieldTouched('b')).toBe(false);
    expect(formInstance.isFieldDirty('b')).toBe(true);
    expect(formInstance.isTouched).toBe(true);
    expect(onValuesChange).not.toHaveBeenCalled();
  });

  it('[frozen] setFieldValue(name, value, true) behaves like a user change', async () => {
    const onValuesChange = vi.fn();
    const { formInstance } = renderWithForm(<FieldProbe name="a" />, {
      formProps: { onValuesChange },
    });

    await act(async () => {
      formInstance.setFieldValue('a', 'x', true);
    });

    expect(formInstance.isFieldTouched('a')).toBe(true);
    expect(onValuesChange).toHaveBeenCalledTimes(1);
    expect(onValuesChange).toHaveBeenCalledWith({ a: 'x' });
  });

  it('[frozen] setFieldsValue(values, true) notifies once for the batch; setFieldsValue(values, false) clears touched', async () => {
    const onValuesChange = vi.fn();
    const { formInstance } = renderWithForm(
      <>
        <FieldProbe name="a" />
        <FieldProbe name="b" />
      </>,
      { formProps: { onValuesChange } },
    );

    await act(async () => {
      formInstance.setFieldsValue({ a: 1, b: 2 }, true);
    });

    expect(onValuesChange).toHaveBeenCalledTimes(1);
    expect(onValuesChange).toHaveBeenCalledWith({ a: 1, b: 2 });
    expect(formInstance.isFieldTouched('a')).toBe(true);
    expect(formInstance.isFieldTouched('b')).toBe(true);

    onValuesChange.mockClear();

    await act(async () => {
      formInstance.setFieldsValue({ a: 3 }, false);
    });

    expect(onValuesChange).not.toHaveBeenCalled();
    expect(formInstance.isFieldTouched('a')).toBe(false);
    expect(formInstance.getFieldValue('a')).toBe(3);
  });

  it('[frozen] setFieldValue() with an equal value is a no-op that keeps existing errors', async () => {
    const onValuesChange = vi.fn();
    const { formInstance } = renderWithForm(<FieldProbe name="a" />, {
      formProps: { defaultValues: { a: 'same' }, onValuesChange },
    });

    await act(async () => {
      formInstance.setFieldError('a', 'Bad');
      formInstance.setFieldValue('a', 'same', true);
    });

    expect(formInstance.getFieldError('a')).toEqual(['Bad']);
    expect(formInstance.getFieldInstance('a')!.status).toBe('invalid');
    expect(onValuesChange).not.toHaveBeenCalled();
    expect(formInstance.isFieldTouched('a')).toBe(false);
  });

  it("[frozen] setFieldsValue() with an equal value clears that field's errors without notifying or rendering", async () => {
    const onValuesChange = vi.fn();
    const counter = createRenderCounter();
    const { formInstance } = renderOwnedForm(() => <FieldProbe name="a" />, {
      formProps: { defaultValues: { a: 'same' }, onValuesChange },
      counter,
    });

    await act(async () => {
      formInstance.setFieldError('a', 'Bad');
    });

    const before = counter.snapshot();

    await act(async () => {
      formInstance.setFieldsValue({ a: 'same' }, true);
    });

    expect(formInstance.getFieldError('a')).toEqual([]);
    expect(formInstance.getFieldInstance('a')!.status).toBeUndefined();
    expect(onValuesChange).not.toHaveBeenCalled();
    expect(counter.since(before).owner).toBe(0);
  });

  it('[frozen] onValuesChange receives the nested getFormData() payload synchronously on every keystroke', async () => {
    const onValuesChange = vi.fn();
    const { getByRole } = renderWithForm(
      <TextInput name="user.name" label="Name" />,
      { formProps: { onValuesChange } },
    );

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'ab');
    });

    expect(onValuesChange.mock.calls).toEqual([
      [{ user: { name: 'a' } }],
      [{ user: { name: 'ab' } }],
    ]);
  });
});

describe('legacy contract: changing and removing callbacks (§7.1 #18)', () => {
  function Fixture({
    onValuesChange,
    onSubmit,
    form,
  }: {
    onValuesChange?: (values: any) => void;
    onSubmit?: (values: any) => void;
    form: CubeFormInstance<any>;
  }) {
    return (
      <Root>
        <Form form={form} onValuesChange={onValuesChange} onSubmit={onSubmit}>
          <FieldProbe name="a" />
        </Form>
      </Root>
    );
  }

  it('[frozen] a new onValuesChange passed on rerender replaces the previous one', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const form = new CubeFormInstance<any>();

    const { rerender } = render(<Fixture form={form} onValuesChange={first} />);

    rerender(<Fixture form={form} onValuesChange={second} />);

    await act(async () => {
      form.setFieldValue('a', 'x', true);
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith({ a: 'x' });
  });

  it('[bug-eligible] passing onValuesChange={undefined} after mount leaves the previous callback installed', async () => {
    const first = vi.fn();
    const form = new CubeFormInstance<any>();

    const { rerender } = render(<Fixture form={form} onValuesChange={first} />);

    rerender(<Fixture form={form} />);

    await act(async () => {
      form.setFieldValue('a', 'x', true);
    });

    expect(first).toHaveBeenCalledWith({ a: 'x' });
  });

  it('[bug-eligible] removing onSubmit after mount leaves the previous submit handler installed on the instance', async () => {
    const first = vi.fn();
    const form = new CubeFormInstance<any>();

    const { rerender } = render(<Fixture form={form} onSubmit={first} />);

    rerender(<Fixture form={form} />);

    await act(async () => {
      await form.submit();
    });

    expect(first).toHaveBeenCalledTimes(1);
  });
});

describe('legacy contract: direct property writes (§7.1 #28)', () => {
  it('[frozen] assigning form.submitError shows nothing until forceReRender() republishes the context', async () => {
    const { formInstance, queryByText } = renderOwnedForm(() => (
      <>
        <FieldProbe name="a" />
        <Form.SubmitError />
      </>
    ));

    await act(async () => {
      formInstance.submitError = 'Boom';
    });

    expect(queryByText('Boom')).toBeNull();

    await act(async () => {
      formInstance.forceReRender();
    });

    expect(queryByText('Boom')).toBeInTheDocument();
  });

  it('[frozen] writing form.isSubmitting directly is invisible until a rerender; setSubmitting() rerenders', async () => {
    const { formInstance, getByRole } = renderOwnedForm(() => (
      <>
        <FieldProbe name="a" />
        <SubmitButton>Submit</SubmitButton>
      </>
    ));

    const button = getByRole('button', { name: 'Submit' });

    expect(button).toBeEnabled();

    await act(async () => {
      formInstance.isSubmitting = true;
    });

    expect(button).toBeEnabled();

    await act(async () => {
      formInstance.forceReRender();
    });

    expect(button).toBeDisabled();

    await act(async () => {
      formInstance.setSubmitting(false);
    });

    expect(button).toBeEnabled();
  });
});
