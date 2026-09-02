/**
 * Phase 2 spike — the shared field-binding boundary across backends.
 *
 * One hook, one hook order, three backends: modern controller, legacy
 * instance, none. Real UI Kit inputs, untouched.
 */
import { ReactNode, useState } from 'react';

import { Radio } from '../../../src/components/fields/RadioGroup/Radio';
import { Field } from '../../../src/components/form/Form/Field';
import { FormContext } from '../../../src/components/form/Form/Form';
import { useForm } from '../../../src/components/form/Form/use-form';
import {
  act,
  renderWithForm,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../src/test/index';

import {
  BoundCheckbox,
  BoundRadioGroup,
  BoundSelect,
  BoundTextInput,
  CustomSwitch,
} from './bound-inputs';
import {
  FormController,
  ModernControllerContext,
  ModernForm,
  useFormController,
} from './react';

import type { CubeFormInstance } from '../../../src/components/form/Form/use-form';

vi.mock('../../../src/_internal/hooks/use-warn');

function renderModern(
  children: ReactNode,
  defaultValues?: Record<string, unknown>,
) {
  let controller!: FormController<any>;
  function Owner() {
    controller = useFormController({ defaultValues });
    return <ModernForm controller={controller}>{children}</ModernForm>;
  }
  const utils = renderWithRoot(<Owner />);
  return { ...utils, controller };
}

describe('binding boundary: legacy backend', () => {
  it('binds TextInput, Checkbox and a custom control to a legacy Form through the shared hook', async () => {
    const { formInstance, getByRole } = renderWithForm(
      <>
        <BoundTextInput
          name="a"
          label="A"
          rules={[{ min: 3, message: 'short' }]}
        />
        <BoundCheckbox name="c" label="C">
          C
        </BoundCheckbox>
        <CustomSwitch name="s" label="S" />
      </>,
    );
    const setFieldValue = vi.spyOn(formInstance, 'setFieldValue');

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'ab');
    });
    expect(formInstance.getFieldValue('a')).toBe('ab');
    expect(setFieldValue).toHaveBeenCalledTimes(2);

    await act(async () => {
      await userEvent.tab();
    });
    await waitFor(() =>
      expect(formInstance.getFieldError('a')).toEqual(['short']),
    );
    expect(await screen.findByText('short')).toBeTruthy();

    await act(async () => {
      await userEvent.click(getByRole('checkbox'));
    });
    expect(formInstance.getFieldValue('c')).toBe(true);

    await act(async () => {
      await userEvent.click(getByRole('switch'));
    });
    expect(formInstance.getFieldValue('s')).toBe(true);
    expect(formInstance.getFieldNames().sort()).toEqual(['a', 'c', 's']);
    expect(document.getElementById('a')).toBe(getByRole('textbox'));
  });

  it('inside the deprecated <Field>, the hook is inert and Field keeps driving the input', async () => {
    const { formInstance, getByRole } = renderWithForm(
      <Field name="a" label="A">
        <BoundTextInput />
      </Field>,
    );
    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'x');
    });
    expect(formInstance.getFieldValue('a')).toBe('x');
    expect(formInstance.getFieldNames()).toEqual(['a']);
  });

  it('an explicit legacy `form` prop binds outside a legacy <Form>', async () => {
    let form!: CubeFormInstance<any>;
    function Owner() {
      [form] = useForm();
      return <BoundTextInput name="a" label="A" form={form} />;
    }
    const { getByRole } = renderWithRoot(<Owner />);
    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'q');
    });
    expect(form.getFieldValue('a')).toBe('q');
  });
});

describe('binding boundary: modern backend', () => {
  it('binds TextInput, Select, Checkbox and a custom control to a modern controller', async () => {
    const { controller, getByRole } = renderModern(
      <>
        <BoundTextInput
          name="a"
          label="A"
          rules={[{ min: 3, message: 'short' }]}
        />
        <BoundSelect name="sel" label="Sel">
          <BoundSelect.Item key="one">One</BoundSelect.Item>
          <BoundSelect.Item key="two">Two</BoundSelect.Item>
        </BoundSelect>
        <BoundCheckbox name="c" label="C">
          C
        </BoundCheckbox>
        <CustomSwitch
          name="s"
          label="S"
          rules={[{ required: true, message: 'turn it on' }]}
        />
      </>,
    );

    expect(Object.keys(controller.getSnapshot().fields).sort()).toEqual([
      'a',
      'c',
      's',
      'sel',
    ]);

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'ab');
      await userEvent.tab();
    });
    expect(controller.getSnapshot().values.a).toBe('ab');
    await waitFor(() =>
      expect(controller.getSnapshot().fields.a.status).toBe('invalid'),
    );
    expect(await screen.findByText('short')).toBeTruthy();
    expect(document.getElementById('a')).toBe(getByRole('textbox'));

    await act(async () => {
      await userEvent.click(getByRole('button', { name: /Sel/ }));
      await userEvent.click(await screen.findByRole('option', { name: 'Two' }));
    });
    expect(controller.getSnapshot().values.sel).toBe('two');

    await act(async () => {
      await userEvent.click(getByRole('checkbox'));
    });
    expect(controller.getSnapshot().values.c).toBe(true);

    await act(async () => {
      await controller.validate(['s']);
    });
    expect(screen.getByText('turn it on')).toBeTruthy();
    await act(async () => {
      await userEvent.click(getByRole('switch'));
    });
    await waitFor(() =>
      expect(controller.getSnapshot().fields.s.status).toBe('valid'),
    );
    expect(screen.queryByText('turn it on')).toBeNull();

    // No Form-only prop leaks to the DOM.
    for (const attr of [
      'rules',
      'controller',
      'validationdelay',
      'validatetrigger',
    ]) {
      expect(document.querySelector(`[${attr}]`)).toBeNull();
    }
  });

  it('an explicit `controller` prop binds outside a modern root', async () => {
    let controller!: FormController<any>;
    function Owner() {
      controller = useFormController();
      return <BoundTextInput name="a" label="A" controller={controller} />;
    }
    const { getByRole } = renderWithRoot(<Owner />);
    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'q');
    });
    expect(controller.getSnapshot().activeValues).toEqual({ a: 'q' });
  });

  it('a RadioGroup registers one field; its options do not become fields', async () => {
    const { controller, getByRole } = renderModern(
      <BoundRadioGroup name="mode" label="Mode">
        <Radio value="one">One</Radio>
        <Radio value="two">Two</Radio>
      </BoundRadioGroup>,
    );
    await act(async () => {
      await userEvent.click(getByRole('radio', { name: 'Two' }));
    });
    expect(controller.getSnapshot().values).toEqual({ mode: 'two' });
    expect(Object.keys(controller.getSnapshot().fields)).toEqual(['mode']);
  });

  it('a standalone input without name stays uncontrolled/controlled as before', async () => {
    const onChange = vi.fn();
    const { getByRole } = renderWithRoot(
      <BoundTextInput label="A" onChange={onChange} />,
    );
    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'ab');
    });
    expect((getByRole('textbox') as HTMLInputElement).value).toBe('ab');
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe('binding boundary: hook order is independent of the backend', () => {
  type Mode = 'none' | 'modern' | 'legacy';

  function Host({
    mode,
    controller,
    form,
  }: {
    mode: Mode;
    controller: FormController<any>;
    form: CubeFormInstance<any>;
  }) {
    return (
      <ModernControllerContext.Provider
        value={mode === 'modern' ? controller : null}
      >
        <FormContext.Provider value={mode === 'legacy' ? { form } : {}}>
          <BoundTextInput name={mode === 'none' ? undefined : 'a'} label="A" />
        </FormContext.Provider>
      </ModernControllerContext.Provider>
    );
  }

  it('the same mounted input can move between none, modern and legacy backends without a hook-order error', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    let controller!: FormController<any>;
    let form!: CubeFormInstance<any>;
    let setMode!: (mode: Mode) => void;

    function Owner() {
      controller = useFormController();
      [form] = useForm();
      const [mode, set] = useState<Mode>('none');
      setMode = set;
      return <Host mode={mode} controller={controller} form={form} />;
    }

    const { getByRole } = renderWithRoot(<Owner />);
    const input = () => getByRole('textbox') as HTMLInputElement;

    await act(async () => {
      await userEvent.type(input(), 'n');
    });
    expect(input().value).toBe('n');
    expect(controller.getSnapshot().fields.a).toBeUndefined();

    act(() => setMode('modern'));
    expect(controller.getSnapshot().fields.a.active).toBe(true);
    await act(async () => {
      await userEvent.clear(input());
      await userEvent.type(input(), 'm');
    });
    expect(controller.getSnapshot().values.a).toBe('m');

    act(() => setMode('legacy'));
    expect(controller.getSnapshot().fields.a.active).toBe(false);
    expect(controller.getSnapshot().values.a).toBe('m'); // retained
    await act(async () => {
      await userEvent.type(input(), 'l');
    });
    expect(form.getFieldValue('a')).toContain('l');

    act(() => setMode('none'));
    expect(form.getFieldNames()).toEqual([]);

    expect(
      errors.mock.calls.filter((call) =>
        String(call[0]).includes('order of Hooks'),
      ),
    ).toHaveLength(0);
    errors.mockRestore();
  });
});
