import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, Suspense, useRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';

import { renderWithRoot } from '../../../../test/render';
import { Checkbox } from '../../../fields/Checkbox/Checkbox';
import { CheckboxGroup } from '../../../fields/Checkbox/CheckboxGroup';
import { CommandTextArea } from '../../../fields/CommandTextArea/CommandTextArea';
import { NumberInput } from '../../../fields/NumberInput/NumberInput';
import { Radio } from '../../../fields/RadioGroup/Radio';
import { RadioGroup } from '../../../fields/RadioGroup/RadioGroup';
import { Select } from '../../../fields/Select/Select';
import { TextInput } from '../../../fields/TextInput/TextInput';
import { TextInputMapper } from '../../../fields/TextInputMapper/TextInputMapper';
import { wrapWithField } from '../../wrapper';
import { Form } from '../index';
import { RenderErrorBoundary } from '../legacy-contract/helpers';
import { useFieldProps } from '../use-field/use-field-props';

import { createFormController, getControllerInternals } from './controller';

import type { FieldBaseProps } from '../../../../shared/form';
import type { FormController } from './controller';

function Control(
  input: FieldBaseProps & {
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    onBlur?: () => void;
    onRender?: () => void;
  },
) {
  const props = useFieldProps(input, {
    valuePropsMapper: ({ value, onChange }) => ({
      value: value ?? '',
      onChange,
    }),
  });
  props.onRender?.();
  const ref = useRef<HTMLInputElement>(null);
  return wrapWithField(
    <input
      ref={ref}
      id={props.id}
      aria-label={String(props.label ?? 'custom')}
      value={props.value ?? ''}
      onChange={(event) => props.onChange?.(event.target.value)}
      onBlur={props.onBlur}
      aria-invalid={props.isInvalid}
    />,
    ref,
    props,
  );
}

afterEach(() => vi.restoreAllMocks());

describe('modern field binding', () => {
  it('normalizes grouped input rules before required detection and validation', async () => {
    const form = createFormController({ defaultValues: { name: '' } });
    const view = renderWithRoot(
      <Form form={form}>
        <TextInput
          name="name"
          label="Name"
          isRequired
          rules={[[{ required: true, message: 'Choose a name' }]]}
        />
      </Form>,
    );
    await act(async () => {
      await form.validate();
    });
    expect(view.getByText('Choose a name')).toBeInTheDocument();
    expect(form.getFieldSnapshot('name')?.errors).toEqual(['Choose a name']);
  });

  it('renders only the changed input and affected selectors', () => {
    const owner = vi.fn();
    const shell = vi.fn();
    const a = vi.fn();
    const b = vi.fn();
    const selected = vi.fn();
    let form!: FormController<{ a: string; b: string }>;
    function Shell() {
      shell();
      return (
        <Form form={form}>
          <Control name="a" label="A" onRender={a} />
          <Control name="b" label="B" onRender={b} />
          <Form.Subscribe selector={(state) => state.values.a}>
            {(value) => {
              selected(value);
              return null;
            }}
          </Form.Subscribe>
        </Form>
      );
    }
    function Owner() {
      owner();
      form = Form.useController({ defaultValues: { a: 'a', b: 'b' } });
      return <Shell />;
    }
    const view = render(<Owner />);
    for (const spy of [owner, shell, a, b, selected]) spy.mockClear();
    act(() =>
      form.batch(() => {
        form.setValue('a', 'next');
        form.touch('a');
      }),
    );
    expect(a).toHaveBeenCalledTimes(1);
    expect(selected).toHaveBeenCalledExactlyOnceWith('next');
    expect(b).not.toHaveBeenCalled();
    expect(owner).not.toHaveBeenCalled();
    expect(shell).not.toHaveBeenCalled();
    a.mockClear();
    act(() => form.touch('a', false));
    expect(a).not.toHaveBeenCalled();
    view.unmount();
    expect(
      getControllerInternals(form, 'test').store.debug.listenerCount(),
    ).toBe(0);
    expect(
      getControllerInternals(form, 'test').store.debug.registrationCount(),
    ).toBe(0);
  });

  it('binds a custom control, preserves caller callbacks, and shows ReactNode errors', async () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    const notify = vi.fn();
    const form = createFormController({
      defaultValues: { a: '' },
      onValuesChange: notify,
    });
    const view = render(
      <Control
        form={form}
        name="a"
        label="A"
        onChange={onChange}
        onBlur={onBlur}
      />,
    );
    await userEvent.type(view.getByRole('textbox'), 'x');
    await userEvent.tab();
    expect(form.getValue('a')).toBe('x');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('x');
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledTimes(1);
    act(() =>
      form.setFieldErrors('a', [<strong key="error">Try again</strong>]),
    );
    expect(view.getByText('Try again')).toBeInTheDocument();
    expect(view.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(view.getByLabelText('A', { selector: 'input' })).toBe(
      view.getByRole('textbox'),
    );
  });

  it('keeps form defaults, including null and undefined, ahead of field defaults', () => {
    const form = createFormController({
      defaultValues: { a: null, b: undefined },
    });
    const view = render(
      <Form form={form}>
        <Control name="a" label="A" defaultValue="field" />
        <Control name="b" label="B" defaultValue="field" />
        <Control name="c" label="C" defaultValue="first" />
      </Form>,
    );
    expect(form.getValues()).toEqual({ a: null, b: undefined, c: 'first' });
    view.rerender(
      <Form form={form}>
        <Control name="c" label="C" defaultValue="later" />
      </Form>,
    );
    expect(form.getValue('c')).toBe('first');
    expect(form.getSnapshot().isDirty).toBe(false);
  });

  it('honors explicit controller precedence and explicit detachment', async () => {
    const context = createFormController({ defaultValues: { a: 'context' } });
    const explicit = createFormController({ defaultValues: { a: 'explicit' } });
    const changed = vi.fn();
    const view = render(
      <Form form={context}>
        <Control name="a" label="A" form={explicit} />
        <Control
          name="b"
          label="B"
          form={undefined}
          value="detached"
          onChange={changed}
        />
      </Form>,
    );
    expect(view.getByRole('textbox', { name: 'A' })).toHaveValue('explicit');
    await userEvent.type(view.getByRole('textbox', { name: 'B' }), 'x');
    expect(changed).toHaveBeenCalled();
    expect(context.getActiveValues()).toEqual({});
    expect(explicit.getActiveValues()).toEqual({ a: 'explicit' });
  });

  it('switches names, controllers, and standalone mode without stale registrations', () => {
    const a = createFormController({
      defaultValues: { first: 'one', second: 'two' },
    });
    const b = createFormController({ defaultValues: { second: 'other' } });
    const view = render(<Control form={a} name="first" />);
    const id = view.getByRole('textbox').id;
    view.rerender(<Control form={a} name="second" />);
    expect(a.getActiveValues()).toEqual({ second: 'two' });
    expect(a.getValue('first')).toBe('one');
    expect(view.getByRole('textbox').id).not.toBe(id);
    view.rerender(<Control form={b} name="second" />);
    expect(a.getActiveValues()).toEqual({});
    expect(view.getByRole('textbox')).toHaveValue('other');
    view.rerender(<Control form={b} value="standalone" />);
    expect(b.getActiveValues()).toEqual({});
    expect(view.getByRole('textbox')).toHaveValue('standalone');
    view.rerender(<Control form={a} name="first" />);
    expect(view.getByRole('textbox')).toHaveValue('one');
  });

  it('can move a mounted input between legacy and modern backends', () => {
    const modern = createFormController({ defaultValues: { a: 'modern' } });
    function Fixture({ mode }: { mode: 'legacy' | 'modern' | 'none' }) {
      const [legacy] = Form.useForm();
      return (
        <Control
          name="a"
          defaultValue="legacy"
          form={
            mode === 'modern' ? modern : mode === 'legacy' ? legacy : undefined
          }
        />
      );
    }
    const view = render(<Fixture mode="legacy" />);
    expect(view.getByRole('textbox')).toHaveValue('legacy');
    view.rerender(<Fixture mode="modern" />);
    expect(view.getByRole('textbox')).toHaveValue('modern');
    view.rerender(<Fixture mode="none" />);
    expect(modern.getActiveValues()).toEqual({});
    view.rerender(<Fixture mode="legacy" />);
    expect(view.getByRole('textbox')).toHaveValue('legacy');
  });

  it.each([true, false])(
    'retains values through Strict Mode replay with preserve=%s',
    async (preserve) => {
      const form = createFormController({ defaultValues: { a: 'seed' } });
      form.setValue('a', 'before mount');
      const view = render(
        <StrictMode>
          <Control form={form} name="a" preserve={preserve} />
        </StrictMode>,
      );
      await act(async () => {});
      expect(view.getByRole('textbox')).toHaveValue('before mount');
      expect(form.getFieldSnapshot('a')?.registrationCount).toBe(1);
      await userEvent.type(view.getByRole('textbox'), '!');
      view.unmount();
      await act(async () => {});
      expect(form.getActiveValues()).toEqual({});
      expect(form.getValue('a')).toBe(preserve ? 'before mount!' : undefined);
      expect(
        getControllerInternals(form, 'test').store.debug.listenerCount(),
      ).toBe(0);
      expect(
        getControllerInternals(form, 'test').store.debug.registrationCount(),
      ).toBe(0);
    },
  );

  it('does not let deferred removal delete a value written after unmount', async () => {
    const form = createFormController({ defaultValues: { a: 'seed' } });
    const view = render(<Control form={form} name="a" preserve={false} />);
    act(() => {
      view.unmount();
      form.setValue('a', 'new owner');
    });
    await act(async () => {});
    expect(form.getValue('a')).toBe('new owner');
  });

  it('shares duplicate values but gives every input a unique accessible id', () => {
    const form = createFormController({ defaultValues: { a: 'shared' } });
    const other = createFormController({ defaultValues: { a: 'other' } });
    const view = render(
      <StrictMode>
        <Form form={form} name="settings">
          <Control name="a" label="First" />
          <Control name="a" label="Second" />
        </Form>
        <Form form={other} name="settings">
          <Control name="a" label="Other" />
        </Form>
      </StrictMode>,
    );
    const inputs = view.getAllByRole('textbox');
    expect(new Set(inputs.map((input) => input.id)).size).toBe(3);
    for (const label of ['First', 'Second', 'Other'])
      expect(
        view.getByLabelText(label, { selector: 'input' }),
      ).toBeInTheDocument();
    expect(form.getFieldSnapshot('a')?.registrationCount).toBe(2);
    view.rerender(
      <Form form={form}>
        <Control name="a" id="authored" label="One" />
      </Form>,
    );
    expect(view.getByLabelText('One', { selector: 'input' })).toHaveAttribute(
      'id',
      'authored',
    );
    expect(form.getValue('a')).toBe('shared');
  });

  it('does not register or seed an abandoned render', () => {
    const form = createFormController();
    const pending = new Promise(() => {});
    function Suspended(): never {
      useFieldProps({ form, name: 'a', defaultValue: 'never committed' });
      throw pending;
    }
    const before = form.getSnapshot();
    const view = render(
      <Suspense fallback="loading">
        <Suspended />
      </Suspense>,
    );
    expect(view.getByText('loading')).toBeInTheDocument();
    expect(form.getSnapshot()).toBe(before);
    expect(
      getControllerInternals(form, 'test').store.debug.registrationCount(),
    ).toBe(0);
    expect(
      getControllerInternals(form, 'test').store.debug.listenerCount(),
    ).toBe(0);
  });

  it('hydrates stable input ids without mutating the server controller', async () => {
    const form = createFormController({ defaultValues: { a: 'server' } });
    function Fixture() {
      const props = useFieldProps({
        form,
        name: 'a',
        id: undefined as string | undefined,
        value: undefined as string | undefined,
      });
      return <input id={props.id} value={props.value} readOnly />;
    }
    const before = form.getSnapshot();
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Fixture />);
    document.body.append(container);
    const id = container.querySelector('input')!.id;
    expect(form.getSnapshot()).toBe(before);
    expect(
      getControllerInternals(form, 'test').store.debug.registrationCount(),
    ).toBe(0);
    form.setValue('a', 'client');
    const onRecoverableError = vi.fn();
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, <Fixture />, { onRecoverableError });
    });
    expect(container.querySelector('input')).toHaveValue('client');
    expect(container.querySelector('input')!.id).toBe(id);
    expect(onRecoverableError).not.toHaveBeenCalled();
    act(() => root.unmount());
    container.remove();
  });

  it('honors shouldUpdate without touching or notifying a rejected change', async () => {
    const notify = vi.fn();
    const form = createFormController({
      defaultValues: { a: 'one' },
      onValuesChange: notify,
    });
    const shouldUpdate = vi.fn(() => false);
    const view = render(
      <Control form={form} name="a" shouldUpdate={shouldUpdate} />,
    );
    await userEvent.type(view.getByRole('textbox'), '!');
    expect(shouldUpdate).toHaveBeenCalledWith({ a: 'one' }, { a: 'one!' });
    expect(form.getValue('a')).toBe('one');
    expect(form.getSnapshot().isTouched).toBe(false);
    expect(notify).not.toHaveBeenCalled();
  });

  it('keeps duplicate fields active until their last cleanup and restores dropped defaults on reset', async () => {
    const form = createFormController({ defaultValues: { a: 'baseline' } });
    const view = render(
      <>
        <Control key="first" form={form} name="a" preserve={false} />
        <Control key="second" form={form} name="a" preserve={false} />
      </>,
    );
    act(() => form.setValue('a', 'edited'));
    view.rerender(
      <>
        <Control key="second" form={form} name="a" preserve={false} />
      </>,
    );
    await act(async () => {});
    expect(form.getActiveValues()).toEqual({ a: 'edited' });
    view.unmount();
    await act(async () => {});
    expect(form.getValue('a')).toBeUndefined();
    act(() => form.reset());
    expect(form.getValue('a')).toBe('baseline');
  });

  it('keeps Form.Item legacy-only with a migration error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const form = createFormController();
    const view = render(
      <Form form={form}>
        <RenderErrorBoundary>
          <Form.Item name="a">
            <TextInput label="A" />
          </Form.Item>
        </RenderErrorBoundary>
      </Form>,
    );
    expect(view.getByTestId('render-error')).toHaveTextContent(
      /Form.Item.*legacy-only/,
    );
  });
});

describe('modern built-in input integration', () => {
  it('binds text, number, checkbox, and editor inputs and filters form-only DOM props', async () => {
    const form = createFormController({
      defaultValues: { text: '', number: 3, check: false, editor: '' },
    });
    const view = renderWithRoot(
      <Form form={form}>
        <TextInput name="text" label="Text" preserve={false} />
        <NumberInput name="number" label="Number" />
        <Checkbox name="check" label="Check" />
        <CommandTextArea name="editor" label="Editor" />
      </Form>,
    );
    await userEvent.type(view.getByRole('textbox', { name: 'Text' }), 'hello');
    await userEvent.clear(view.getByRole('textbox', { name: 'Number' }));
    await userEvent.type(view.getByRole('textbox', { name: 'Number' }), '7');
    await userEvent.tab();
    await userEvent.click(view.getByRole('checkbox', { name: 'Check' }));
    await userEvent.type(
      view.getByRole('combobox', { name: 'Editor' }),
      'message',
    );
    expect(form.getActiveValues()).toEqual({
      text: 'hello',
      number: 7,
      check: true,
      editor: 'message',
    });
    expect(
      view.container.querySelector(
        '[form],[preserve],[rules],[isequal],[validatetrigger]',
      ),
    ).toBeNull();
  });

  it('binds selection controls without registering group options', async () => {
    const form = createFormController({
      defaultValues: { pick: 'a', radio: 'a', checks: ['a'] },
    });
    const view = renderWithRoot(
      <Form form={form}>
        <Select name="pick" label="Pick">
          <Select.Item key="a">Alpha</Select.Item>
          <Select.Item key="b">Beta</Select.Item>
        </Select>
        <RadioGroup name="radio" label="Radio">
          <Radio value="a" name="option-a">
            First
          </Radio>
          <Radio value="b" name="option-b">
            Second
          </Radio>
        </RadioGroup>
        <CheckboxGroup name="checks" label="Checks">
          <Checkbox value="a" name="check-a">
            One
          </Checkbox>
          <Checkbox value="b" name="check-b">
            Two
          </Checkbox>
        </CheckboxGroup>
      </Form>,
    );
    await userEvent.click(view.getByRole('button', { name: /Pick/ }));
    await userEvent.click(await screen.findByRole('option', { name: 'Beta' }));
    await userEvent.click(view.getByRole('radio', { name: 'Second' }));
    await userEvent.click(view.getByRole('checkbox', { name: 'Two' }));
    expect(form.getActiveValues()).toEqual({
      pick: 'b',
      radio: 'b',
      checks: ['a', 'b'],
    });
    expect(
      getControllerInternals(form, 'test').store.debug.registrationCount(),
    ).toBe(3);
  });

  it('binds object mapper values and keeps nested controls detached', async () => {
    const form = createFormController({
      defaultValues: { mapping: { first: 'one' } },
    });
    const view = renderWithRoot(
      <Form form={form}>
        <TextInputMapper
          name="mapping"
          keyProps={{ placeholder: 'Key' }}
          valueProps={{ placeholder: 'Value' }}
        />
      </Form>,
    );
    const input = view.getByPlaceholderText('Value');
    await userEvent.clear(input);
    await userEvent.type(input, 'two');
    await userEvent.tab();
    await waitFor(() =>
      expect(form.getValue('mapping')).toEqual({ first: 'two' }),
    );
    expect(
      getControllerInternals(form, 'test').store.debug.registrationCount(),
    ).toBe(1);
  });
});
