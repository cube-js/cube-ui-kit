import {
  act,
  render,
  renderWithForm,
  screen,
  userEvent,
  waitFor,
} from '../../../../test/index';
import { TextInput } from '../../../fields/TextInput/TextInput';
import { Root } from '../../../Root';
import { Form } from '../index';
import { CubeFormInstance, useForm } from '../use-form';

import { FieldProbe } from './helpers';

vi.mock('../../../../_internal/hooks/use-warn');

/**
 * Legacy Form characterization — defaults, values and registration lifetime.
 *
 * Covers plan §7.1 items 7 (first-mount defaults), 8 (Form default changes),
 * 9 (field-level defaultValue), 10 (reset after default changes), 11 (value
 * kinds), 12 (setters before registration / after unmount), 13 (registered-only
 * getters) and 14 (conditional unmount / remount).
 */

describe('legacy contract: Form defaults (§7.1 #7, #8, #10)', () => {
  it('[frozen] Form defaultValues seed a field on first mount without making it dirty', () => {
    const { formInstance, getByRole } = renderWithForm(
      <TextInput name="a" label="A" />,
      { formProps: { defaultValues: { a: 'form' } } },
    );

    expect(getByRole('textbox')).toHaveValue('form');
    expect(formInstance.isFieldDirty('a')).toBe(false);
    expect(formInstance.isFieldTouched('a')).toBe(false);
  });

  it('[frozen] changing defaultValues after mount leaves current values alone but moves the dirty baseline', async () => {
    let form!: CubeFormInstance<any>;

    function Fixture({ defaults }: { defaults: Record<string, unknown> }) {
      [form] = useForm();

      return (
        <Root>
          <Form form={form} defaultValues={defaults}>
            <TextInput name="a" label="A" />
          </Form>
        </Root>
      );
    }

    const { rerender, getByRole } = render(<Fixture defaults={{ a: 'one' }} />);

    expect(getByRole('textbox')).toHaveValue('one');

    rerender(<Fixture defaults={{ a: 'two' }} />);

    // Current value is untouched…
    expect(getByRole('textbox')).toHaveValue('one');
    // …but it is now compared against the new baseline.
    expect(form.isFieldDirty('a')).toBe(true);

    await act(async () => {
      form.resetFields();
    });

    expect(getByRole('textbox')).toHaveValue('two');
    expect(form.isFieldDirty('a')).toBe(false);
  });

  it('[frozen] resetFields() restores Form defaults and clears touched, errors and status', async () => {
    const { formInstance, getByRole } = renderWithForm(
      <TextInput
        name="a"
        label="A"
        rules={[{ required: true, message: 'Required' }]}
      />,
      { formProps: { defaultValues: { a: 'seed' } } },
    );

    await act(async () => {
      await userEvent.clear(getByRole('textbox'));
      await formInstance.validateField('a').catch(() => {});
    });

    expect(formInstance.isFieldTouched('a')).toBe(true);
    expect(formInstance.getFieldError('a')).toEqual(['Required']);
    expect(formInstance.getFieldInstance('a')!.status).toBe('invalid');

    await act(async () => {
      formInstance.resetFields();
    });

    expect(getByRole('textbox')).toHaveValue('seed');
    expect(formInstance.isFieldTouched('a')).toBe(false);
    expect(formInstance.getFieldError('a')).toEqual([]);
    expect(formInstance.getFieldInstance('a')!.status).toBeUndefined();
  });

  it('[frozen] resetFields(names) resets only the named fields', async () => {
    const { formInstance, getByRole } = renderWithForm(
      <>
        <TextInput name="a" label="A" />
        <TextInput name="b" label="B" />
      </>,
      { formProps: { defaultValues: { a: 'one', b: 'two' } } },
    );

    await act(async () => {
      await userEvent.type(getByRole('textbox', { name: 'A' }), '!');
      await userEvent.type(getByRole('textbox', { name: 'B' }), '!');
    });

    await act(async () => {
      formInstance.resetFields(['a']);
    });

    expect(formInstance.getFieldValue('a')).toBe('one');
    expect(formInstance.getFieldValue('b')).toBe('two!');
  });
});

describe('legacy contract: field-level defaultValue (§7.1 #7, #9)', () => {
  it('[frozen] a field-level defaultValue fills a field the Form left empty and becomes its baseline', async () => {
    const { formInstance, getByRole } = renderWithForm(
      <TextInput name="a" label="A" defaultValue="field" />,
    );

    expect(getByRole('textbox')).toHaveValue('field');
    expect(formInstance.isFieldDirty('a')).toBe(false);

    await act(async () => {
      await userEvent.type(getByRole('textbox'), '!');
      formInstance.resetFields();
    });

    expect(formInstance.getFieldValue('a')).toBe('field');
  });

  it('[undefined] a field-level defaultValue overrides a Form default for an untouched field and leaves it dirty', () => {
    const { formInstance, getByRole } = renderWithForm(
      <TextInput name="a" label="A" defaultValue="field" />,
      { formProps: { defaultValues: { a: 'form' } } },
    );

    // The field default is written into the value on every untouched render,
    // but the Form default stays the dirty baseline.
    expect(getByRole('textbox')).toHaveValue('field');
    expect(formInstance.isFieldDirty('a')).toBe(true);
  });

  it('[frozen] a changed field-level defaultValue applies while untouched and is ignored after touch, without moving the baseline', async () => {
    function Fixture({ defaultValue }: { defaultValue: string }) {
      return <TextInput name="a" label="A" defaultValue={defaultValue} />;
    }

    const { formInstance, rerender, getByRole } = renderWithForm(
      <Fixture defaultValue="one" />,
    );

    rerender(<Fixture defaultValue="two" />);

    expect(getByRole('textbox')).toHaveValue('two');
    // Only the first field default reached the baseline.
    expect(formInstance.isFieldDirty('a')).toBe(true);

    await act(async () => {
      await userEvent.type(getByRole('textbox'), '!');
    });

    rerender(<Fixture defaultValue="three" />);

    expect(getByRole('textbox')).toHaveValue('two!');
  });
});

describe('legacy contract: value kinds (§7.1 #11)', () => {
  it('[bug-eligible] a null Form default is kept on mount but becomes undefined (and dirty) after reset', async () => {
    const { formInstance, getByTestId } = renderWithForm(
      <FieldProbe name="a" />,
      { formProps: { defaultValues: { a: null } } },
    );

    expect(formInstance.getFieldValue('a')).toBeNull();
    expect(getByTestId('probe-a')).toHaveTextContent('null');

    await act(async () => {
      formInstance.resetFields();
    });

    expect(formInstance.getFieldValue('a')).toBeUndefined();
    expect(formInstance.isFieldDirty('a')).toBe(true);
  });

  it('[frozen] an empty-string default survives mount and reset', async () => {
    const { formInstance } = renderWithForm(<FieldProbe name="a" />, {
      formProps: { defaultValues: { a: '' } },
    });

    expect(formInstance.getFieldValue('a')).toBe('');

    await act(async () => {
      formInstance.setFieldValue('a', 'x');
      formInstance.resetFields();
    });

    expect(formInstance.getFieldValue('a')).toBe('');
  });

  it('[design-input] arrays and objects are compared by JSON: setting an equal copy is not a change', async () => {
    const onValuesChange = vi.fn();
    const initial = ['a'];
    const { formInstance } = renderWithForm(<FieldProbe name="tags" />, {
      formProps: { defaultValues: { tags: initial }, onValuesChange },
    });

    await act(async () => {
      formInstance.setFieldValue('tags', ['a'], true);
    });

    expect(onValuesChange).not.toHaveBeenCalled();
    expect(formInstance.getFieldValue('tags')).toBe(initial);

    await act(async () => {
      formInstance.setFieldValue('tags', ['a', 'b'], true);
    });

    expect(onValuesChange).toHaveBeenCalledTimes(1);
    expect(formInstance.isFieldDirty('tags')).toBe(true);
  });

  it('[frozen] dot-path defaults register as flat fields and nest back in getFormData()', () => {
    const { formInstance } = renderWithForm(<FieldProbe name="user.name" />, {
      formProps: { defaultValues: { user: { name: 'Ann' } } },
    });

    expect(formInstance.getFieldValue('user.name')).toBe('Ann');
    expect(formInstance.getFieldsValue()).toEqual({ 'user.name': 'Ann' });
    expect(formInstance.getFormData()).toEqual({ user: { name: 'Ann' } });
  });

  it('[frozen] setting an object on a parent path fans out to registered child paths, with null for missing keys', async () => {
    const { formInstance } = renderWithForm(
      <>
        <FieldProbe name="user" />
        <FieldProbe name="user.name" />
        <FieldProbe name="user.age" />
      </>,
    );

    await act(async () => {
      formInstance.setFieldValue('user', { name: 'Bob' });
    });

    expect(formInstance.getFieldValue('user.name')).toBe('Bob');
    expect(formInstance.getFieldValue('user.age')).toBeNull();
    expect(formInstance.getFormData()).toEqual({
      user: { name: 'Bob', age: null },
    });
  });
});

describe('legacy contract: setters before registration and after unmount (§7.1 #12)', () => {
  it('[frozen] setFieldValue() and setFieldsValue() before registration are ignored', async () => {
    let form!: CubeFormInstance<any>;

    function Fixture({ mounted }: { mounted: boolean }) {
      [form] = useForm();

      return (
        <Root>
          <Form form={form}>{mounted ? <FieldProbe name="a" /> : null}</Form>
        </Root>
      );
    }

    const { rerender } = render(<Fixture mounted={false} />);

    await act(async () => {
      form.setFieldValue('a', 'x');
      form.setFieldsValue({ a: 'y' });
    });

    expect(form.getFieldValue('a')).toBeUndefined();
    expect(form.getFieldNames()).toEqual([]);

    rerender(<Fixture mounted />);

    expect(form.getFieldValue('a')).toBeUndefined();
  });

  it('[frozen] setInitialFieldsValue() before registration seeds the field on mount', async () => {
    let form!: CubeFormInstance<any>;

    function Fixture({ mounted }: { mounted: boolean }) {
      [form] = useForm();

      return (
        <Root>
          <Form form={form}>{mounted ? <FieldProbe name="a" /> : null}</Form>
        </Root>
      );
    }

    const { rerender } = render(<Fixture mounted={false} />);

    await act(async () => {
      form.setInitialFieldsValue({ a: 'seed' });
    });

    rerender(<Fixture mounted />);

    expect(form.getFieldValue('a')).toBe('seed');
    expect(form.isFieldDirty('a')).toBe(false);
  });

  it('[frozen] setFields() creates an unregistered field whose value a later mount adopts', async () => {
    let form!: CubeFormInstance<any>;

    function Fixture({ mounted }: { mounted: boolean }) {
      [form] = useForm();

      return (
        <Root>
          <Form form={form}>{mounted ? <FieldProbe name="a" /> : null}</Form>
        </Root>
      );
    }

    const { rerender, getByTestId } = render(<Fixture mounted={false} />);

    await act(async () => {
      form.setFields([{ name: 'a', value: 'pre', errors: [] }]);
    });

    expect(form.getFieldNames()).toEqual(['a']);
    expect(form.getFieldsValue()).toEqual({ a: 'pre' });

    rerender(<Fixture mounted />);

    expect(getByTestId('probe-a')).toHaveTextContent('"pre"');
  });

  it('[frozen] setters after unmount are ignored and the value is gone', async () => {
    function Fixture({ mounted }: { mounted: boolean }) {
      return mounted ? <FieldProbe name="a" /> : null;
    }

    const { formInstance, rerender } = renderWithForm(<Fixture mounted />);

    await act(async () => {
      formInstance.setFieldValue('a', 'x');
    });

    rerender(<Fixture mounted={false} />);

    await act(async () => {
      formInstance.setFieldValue('a', 'y');
    });

    expect(formInstance.getFieldNames()).toEqual([]);
    expect(formInstance.getFieldValue('a')).toBeUndefined();
  });
});

describe('legacy contract: registered-only getters and submission (§7.1 #13, #14)', () => {
  it('[frozen] getFieldsValue(), getFormData() and submission only include mounted fields', async () => {
    const onSubmit = vi.fn();

    function Fixture({ withB }: { withB: boolean }) {
      return (
        <>
          <FieldProbe name="a" />
          {withB ? <FieldProbe name="b" /> : null}
        </>
      );
    }

    const { formInstance, rerender } = renderWithForm(<Fixture withB />, {
      formProps: { defaultValues: { a: 1, b: 2 }, onSubmit },
    });

    expect(formInstance.getFieldsValue()).toEqual({ a: 1, b: 2 });

    rerender(<Fixture withB={false} />);

    expect(formInstance.getFieldsValue()).toEqual({ a: 1 });
    expect(formInstance.getFormData()).toEqual({ a: 1 });

    await act(async () => {
      await formInstance.submit();
    });

    expect(onSubmit).toHaveBeenCalledWith({ a: 1 });
  });

  it('[frozen] a conditionally unmounted field loses its value and remounts with its default', async () => {
    function Fixture({ withB }: { withB: boolean }) {
      return (
        <>
          <TextInput name="a" label="A" />
          {withB ? <TextInput name="b" label="B" /> : null}
        </>
      );
    }

    const { formInstance, rerender } = renderWithForm(<Fixture withB />, {
      formProps: { defaultValues: { b: 'default' } },
    });

    await act(async () => {
      await userEvent.clear(screen.getByRole('textbox', { name: 'B' }));
      await userEvent.type(screen.getByRole('textbox', { name: 'B' }), 'typed');
    });

    expect(formInstance.getFieldValue('b')).toBe('typed');

    rerender(<Fixture withB={false} />);

    expect(formInstance.getFieldValue('b')).toBeUndefined();

    rerender(<Fixture withB />);

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'B' })).toHaveValue('default'),
    );
    expect(formInstance.isFieldTouched('b')).toBe(false);
  });
});
