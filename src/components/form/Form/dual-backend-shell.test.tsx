import { ReactElement, useContext } from 'react';

import {
  act,
  render,
  renderWithForm,
  renderWithRoot,
  userEvent,
  waitFor,
} from '../../../test/index';
import { Checkbox } from '../../fields/Checkbox/Checkbox';
import { CheckboxGroup } from '../../fields/Checkbox/CheckboxGroup';
import { NumberInput } from '../../fields/NumberInput/NumberInput';
import { Radio } from '../../fields/RadioGroup/Radio';
import { RadioGroup } from '../../fields/RadioGroup/RadioGroup';
import { Slider } from '../../fields/Slider/Slider';
import { TextInput } from '../../fields/TextInput/TextInput';

import { FORM_BACKEND, isModernFormController } from './backend';
import {
  FormContext,
  FormPresentationContext,
  LegacyFormRoot,
  useFormProps,
} from './Form';
import { RenderErrorBoundary } from './legacy-contract/helpers';
import { CubeFormInstance, useForm } from './use-form';

import { Form, FormScopeMask } from './index';

vi.mock('../../../_internal/hooks/use-warn');

/**
 * Dual-backend shell (modernization plan, Phase 3): branding, the `<Form>`
 * facade, the split contexts, group scope masking, rebinding after mount and
 * the development errors for a backend that is not available yet. Legacy
 * behaviour itself is frozen by `legacy-contract/`; this file covers only what
 * the shell adds or defines.
 */

const modernStub = {
  [FORM_BACKEND]: 'modern',
} as unknown as CubeFormInstance<any>;

function silenceConsoleError() {
  vi.spyOn(console, 'error').mockImplementation(() => {});
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('dual-backend shell: branding', () => {
  it('a legacy instance carries the legacy brand as a symbol property', () => {
    const instance = new CubeFormInstance();

    expect(instance[FORM_BACKEND]).toBe('legacy');
    expect(Object.getOwnPropertySymbols(instance)).toContain(FORM_BACKEND);
    // `Symbol.for`: two copies of the kit in one bundle agree on the brand.
    expect(FORM_BACKEND).toBe(Symbol.for('@cube-dev/ui-kit/form-backend'));
  });

  it('only the modern brand is recognised; an unbranded object still counts as legacy', () => {
    expect(isModernFormController(modernStub)).toBe(true);

    expect(isModernFormController(new CubeFormInstance())).toBe(false);
    expect(isModernFormController(undefined)).toBe(false);
    expect(isModernFormController(null)).toBe(false);
    // Cloud narrows form props structurally and its tests pass plain mocks.
    expect(isModernFormController({ getFieldValue() {} })).toBe(false);
  });
});

describe('dual-backend shell: <Form> facade', () => {
  it('renders the legacy root for a form without a controller and keeps its statics', () => {
    const { getByTestId } = renderWithRoot(
      <Form>
        <TextInput name="a" label="A" />
      </Form>,
    );

    expect(getByTestId('Form').tagName).toBe('FORM');
    expect((Form as any).displayName).toBe('Form');
    expect((LegacyFormRoot as any).displayName).toBe('LegacyFormRoot');
    expect(Form.useForm).toBe(useForm);
  });

  it('routes a legacy instance passed explicitly to the legacy root', () => {
    const { formInstance } = renderWithForm(<TextInput name="a" label="A" />);

    expect(formInstance[FORM_BACKEND]).toBe('legacy');
    expect(formInstance.getFieldNames()).toEqual(['a']);
  });

  it('a modern controller reaches the modern root boundary, which is an error in this version', () => {
    silenceConsoleError();

    const { getByTestId } = renderWithRoot(
      <RenderErrorBoundary>
        <Form form={modernStub}>
          <TextInput name="a" label="A" />
        </Form>
      </RenderErrorBoundary>,
    );

    expect(getByTestId('render-error')).toHaveTextContent(
      /<Form> received a modern form controller, but the modern Form backend is not available/,
    );
  });

  it('Form.useForm() refuses to adopt a modern controller', () => {
    silenceConsoleError();

    function Owner() {
      useForm(modernStub);

      return null;
    }

    const { getByTestId } = render(
      <RenderErrorBoundary>
        <Owner />
      </RenderErrorBoundary>,
    );

    expect(getByTestId('render-error')).toHaveTextContent(
      /Form\.useForm\(\) received a modern form controller/,
    );
  });

  it.each([
    ['an input', <TextInput name="a" label="A" form={modernStub} />],
    [
      'Form.Item',
      <Form.Item name="a" form={modernStub}>
        <TextInput label="A" />
      </Form.Item>,
    ],
  ])(
    '%s bound to a modern controller is the same development error',
    (_, bound) => {
      silenceConsoleError();

      const { getByTestId } = renderWithForm(
        <RenderErrorBoundary>{bound}</RenderErrorBoundary>,
      );

      expect(getByTestId('render-error')).toHaveTextContent(
        /The "a" field received a modern form controller/,
      );
    },
  );

  it('a standalone input ignores a modern controller: nothing to bind', () => {
    const { getByRole } = renderWithRoot(
      <TextInput label="A" form={modernStub} />,
    );

    expect(getByRole('textbox')).toBeInTheDocument();
  });
});

describe('dual-backend shell: contexts', () => {
  function Probe({ props = {} }: { props?: Record<string, unknown> }) {
    const merged = useFormProps(props);
    const legacy = useContext(FormContext) as Record<string, unknown>;
    const presentation = useContext(FormPresentationContext);

    return (
      <span
        data-qa="probe"
        data-label-position={String(merged.labelPosition)}
        data-has-form={String('form' in merged && merged.form != null)}
        data-legacy-keys={JSON.stringify(Object.keys(legacy).sort())}
        data-presentation-keys={JSON.stringify(
          Object.keys(presentation).sort(),
        )}
      />
    );
  }

  const PRESENTATION_KEYS = [
    'idPrefix',
    'labelPosition',
    'labelStyles',
    'necessityIndicator',
    'orientation',
    'requiredMark',
    'showValid',
    'validateTrigger',
  ].sort();

  it('the public FormContext keeps its full legacy value under a legacy root', () => {
    const { getByTestId } = renderWithForm(<Probe />, {
      formProps: { name: 'settings', labelPosition: 'side' },
    });
    const probe = getByTestId('probe');

    expect(JSON.parse(probe.dataset.legacyKeys!)).toEqual(
      [...PRESENTATION_KEYS, 'form', 'submitError'].sort(),
    );
    expect(JSON.parse(probe.dataset.presentationKeys!)).toEqual(
      PRESENTATION_KEYS,
    );
    expect(probe.dataset.labelPosition).toBe('side');
    expect(probe.dataset.hasForm).toBe('true');
  });

  it('useFormProps merges presentation, then FormContext, then props; an explicit undefined form detaches', () => {
    const { getAllByTestId } = renderWithForm(
      <>
        <Probe />
        <Probe props={{ labelPosition: 'top' }} />
        <Probe props={{ form: undefined }} />
      </>,
      { formProps: { labelPosition: 'side' } },
    );
    const [inherited, overridden, detached] = getAllByTestId('probe');

    expect(inherited.dataset.labelPosition).toBe('side');
    expect(overridden.dataset.labelPosition).toBe('top');
    expect(detached.dataset.hasForm).toBe('false');
    expect(detached.dataset.labelPosition).toBe('side');
  });

  it('outside any root both contexts are empty', () => {
    const { getByTestId } = renderWithRoot(<Probe />);
    const probe = getByTestId('probe');

    expect(JSON.parse(probe.dataset.legacyKeys!)).toEqual([]);
    expect(JSON.parse(probe.dataset.presentationKeys!)).toEqual([]);
  });

  it('the exported FormScopeMask masks the presentation context; a bare FormContext override does not', () => {
    const { getAllByTestId } = renderWithForm(
      <>
        <FormContext.Provider value={{ isInvalid: true }}>
          <Probe />
        </FormContext.Provider>
        <FormScopeMask value={{ isInvalid: true }}>
          <Probe />
        </FormScopeMask>
      </>,
      { formProps: { labelPosition: 'side' } },
    );
    const [bare, masked] = getAllByTestId('probe');

    expect(bare.dataset.hasForm).toBe('false');
    expect(bare.dataset.labelPosition).toBe('side');

    expect(masked.dataset.hasForm).toBe('false');
    expect(masked.dataset.labelPosition).toBe('undefined');
    expect(JSON.parse(masked.dataset.legacyKeys!)).toEqual(['isInvalid']);
  });

  it.each([
    {
      group: 'RadioGroup',
      render: (probe: ReactElement) => (
        <RadioGroup name="g" label="G">
          <Radio value="one">One</Radio>
          {probe}
        </RadioGroup>
      ),
      maskKeys: ['isDisabled', 'isInvalid', 'isRequired', 'isValid'],
    },
    {
      group: 'CheckboxGroup',
      render: (probe: ReactElement) => (
        <CheckboxGroup name="g" label="G">
          <Checkbox value="one">One</Checkbox>
          {probe}
        </CheckboxGroup>
      ),
      maskKeys: ['isDisabled', 'isInvalid', 'isValid'],
    },
  ])(
    '$group masks presentation and form for its options, exactly as the legacy FormContext override did',
    ({ render: renderGroup, maskKeys }) => {
      const { formInstance, getByTestId } = renderWithForm(
        renderGroup(<Probe />),
        { formProps: { labelPosition: 'side', name: 'outer' } },
      );
      const probe = getByTestId('probe');

      expect(JSON.parse(probe.dataset.legacyKeys!)).toEqual(maskKeys);
      expect(JSON.parse(probe.dataset.presentationKeys!)).toEqual([]);
      expect(probe.dataset.labelPosition).toBe('undefined');
      expect(probe.dataset.hasForm).toBe('false');
      expect(formInstance.getFieldNames()).toEqual(['g']);
    },
  );

  it('a named input inside a group does not register with the outer form', async () => {
    const { formInstance, getByRole } = renderWithForm(
      <RadioGroup name="g" label="G">
        <Radio value="one">One</Radio>
        <TextInput name="nested" label="Nested" />
      </RadioGroup>,
    );

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'x');
    });

    expect(formInstance.getFieldNames()).toEqual(['g']);
    expect(getByRole('textbox')).toHaveValue('x');
  });
});

/**
 * The legacy engine never supported changing an input's binding after mount:
 * `useFieldProps` returned early for a standalone input, so the switch threw a
 * hook-order error. The shell keeps every hook mounted and the legacy adapter
 * binds like a first mount whenever its `(form, name)` has no field yet, so
 * these are defined now. A `form` prop that changes still leaves the field in
 * the old form (legacy contract, row 4).
 */
describe('dual-backend shell: rebinding after mount', () => {
  const CONTROLLED_STATE_WARNING =
    /changed from (un)?controlled to (un)?controlled/;

  function controlledStateWarnings(warn: ReturnType<typeof vi.spyOn>) {
    return warn.mock.calls
      .map((call) => String(call[0]))
      .filter((message) => CONTROLLED_STATE_WARNING.test(message));
  }

  it('an input that loses its name releases the field and keeps what was typed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    function Fixture({ name }: { name?: string }) {
      return <TextInput name={name} label="A" />;
    }

    const { formInstance, rerender, getByRole } = renderWithForm(
      <RenderErrorBoundary>
        <Fixture name="a" />
      </RenderErrorBoundary>,
    );

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'x');
    });

    expect(formInstance.getFieldValue('a')).toBe('x');

    rerender(
      <RenderErrorBoundary>
        <Fixture />
      </RenderErrorBoundary>,
    );

    expect(formInstance.getFieldNames()).toEqual([]);
    // React Aria keeps the last value when a control becomes uncontrolled,
    // and says so in development.
    expect(getByRole('textbox')).toHaveValue('x');
    expect(controlledStateWarnings(warn)).toEqual([
      'WARN: A component changed from controlled to uncontrolled.',
    ]);

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'y');
    });

    expect(getByRole('textbox')).toHaveValue('xy');
    expect(formInstance.getFieldNames()).toEqual([]);
  });

  it('an input that gains a name binds like a first mount: typed text is dropped, the default seeds the field', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    function Fixture({ name }: { name?: string }) {
      return <TextInput name={name} label="A" defaultValue="init" />;
    }

    const { formInstance, rerender, getByRole, getByTestId } = renderWithForm(
      <RenderErrorBoundary>
        <Fixture />
      </RenderErrorBoundary>,
      { formProps: { name: 'shell' } },
    );

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'x');
    });

    expect(getByRole('textbox')).toHaveValue('initx');
    expect(formInstance.getFieldNames()).toEqual([]);

    rerender(
      <RenderErrorBoundary>
        <Fixture name="gained" />
      </RenderErrorBoundary>,
    );

    expect(formInstance.getFieldNames()).toEqual(['gained']);

    const input = getByRole('textbox');

    // The field, not the DOM, is the source of truth once bound: it starts
    // from `defaultValue`, which is also the dirty baseline.
    expect(input).toHaveValue('init');
    expect(formInstance.getFieldValue('gained')).toBe('init');
    expect(formInstance.isFieldDirty('gained')).toBe(false);
    expect(controlledStateWarnings(warn)).toEqual([
      'WARN: A component changed from uncontrolled to controlled.',
    ]);

    // The id is derived from the current binding, not from the standalone
    // seed, and the label follows it.
    expect(input).toHaveAttribute('id', 'shell_gained');
    expect(getByTestId('Label')).toHaveAttribute('for', 'shell_gained');

    await act(async () => {
      await userEvent.type(input, 'y');
    });

    expect(formInstance.getFieldValue('gained')).toBe('inity');
    expect(formInstance.isFieldDirty('gained')).toBe(true);

    act(() => {
      formInstance.resetFields();
    });

    expect(formInstance.getFieldValue('gained')).toBe('init');
    expect(formInstance.isFieldDirty('gained')).toBe(false);
  });

  it("a switch changes the id in one step: no commit carries the previous binding's id", async () => {
    function Fixture({ name }: { name?: string }) {
      return <TextInput name={name} label="A" />;
    }

    const { rerender, getByRole, getByTestId } = renderWithForm(<Fixture />, {
      formProps: { name: 'shell' },
    });

    const input = getByRole('textbox');
    const label = getByTestId('Label');
    const ids: string[] = [input.getAttribute('id')!];
    const fors: string[] = [label.getAttribute('for')!];
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const target = record.target as Element;

        if (target === input) ids.push(target.getAttribute('id')!);
        if (target === label) fors.push(target.getAttribute('for')!);
      }
    });

    observer.observe(input, { attributes: true, attributeFilter: ['id'] });
    observer.observe(label, { attributes: true, attributeFilter: ['for'] });

    for (const name of ['a', undefined, 'b']) {
      rerender(<Fixture name={name} />);
      // MutationObserver delivers records as microtasks.
      await act(async () => {});
    }

    observer.disconnect();

    // One transition per switch. Before the id was derived from the current
    // base, each switch committed the previous base first (`shell_`,
    // then `shell_a`), which can duplicate a sibling's live id.
    expect(ids).toEqual([
      expect.not.stringMatching(/^shell_/),
      'shell_a',
      expect.not.stringMatching(/^shell_/),
      'shell_b',
    ]);
    expect(fors).toEqual(ids);
  });

  it('switching a name back and forth reuses the same id instead of suffixing it', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    function Fixture({ name }: { name?: string }) {
      return <TextInput name={name} label="A" />;
    }

    const { rerender, getByRole } = renderWithForm(<Fixture name="flip" />, {
      formProps: { name: 'shell' },
    });

    expect(getByRole('textbox')).toHaveAttribute('id', 'shell_flip');

    rerender(<Fixture />);
    rerender(<Fixture name="flip" />);

    await waitFor(() =>
      expect(getByRole('textbox')).toHaveAttribute('id', 'shell_flip'),
    );
  });

  it.each([
    {
      component: 'NumberInput',
      render: (name?: string) => <NumberInput name={name} label="N" />,
      role: 'textbox',
    },
    {
      component: 'Slider',
      render: (name?: string) => (
        <Slider name={name} label="S" minValue={0} maxValue={10} />
      ),
      role: 'group',
    },
  ])(
    '$component keeps its label pointing at the element after the id changes',
    ({ render: renderInput, role }) => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { rerender, getByRole, getByTestId } = renderWithForm(
        renderInput(),
        { formProps: { name: 'shell' } },
      );

      const before = getByRole(role).getAttribute('id');

      expect(getByTestId('Label')).toHaveAttribute('for', before);

      rerender(renderInput('n'));

      // react-aria seeds its ids once; the components re-apply the current id.
      expect(getByRole(role)).toHaveAttribute('id', 'shell_n');
      expect(getByTestId('Label')).toHaveAttribute('for', 'shell_n');
    },
  );

  it('a field created after mount carries its rules, so a late form still validates it', async () => {
    let form!: CubeFormInstance<any>;

    function Owner({ late }: { late: boolean }) {
      [form] = useForm();

      return (
        <Form.Item
          name="a"
          rules={[{ required: true }]}
          form={late ? form : undefined}
        >
          <TextInput label="A" />
        </Form.Item>
      );
    }

    const { rerender } = renderWithRoot(<Owner late={false} />);

    expect(form.getFieldNames()).toEqual([]);

    rerender(<Owner late />);

    expect(form.getFieldNames()).toEqual(['a']);
    expect(form.getFieldInstance('a')?.rules).toEqual([{ required: true }]);

    await act(async () => {
      await form.validateFields().catch(() => {});
    });

    expect(form.isFieldInvalid('a')).toBe(true);
  });

  it('an input that receives a form prop after mount registers with it and re-renders the owner', async () => {
    let form!: CubeFormInstance<any>;
    let ownerRenders = 0;

    function Owner({ late }: { late: boolean }) {
      ownerRenders++;
      [form] = useForm();

      return (
        <TextInput
          id="fixed"
          name="a"
          label="A"
          defaultValue="init"
          rules={[{ required: true }]}
          form={late ? form : undefined}
        />
      );
    }

    const { rerender, getByRole } = renderWithRoot(<Owner late={false} />);

    expect(form.getFieldNames()).toEqual([]);

    const rendersBefore = ownerRenders;

    rerender(<Owner late />);

    expect(form.getFieldNames()).toEqual(['a']);
    expect(form.getFieldValue('a')).toBe('init');
    expect(form.isFieldDirty('a')).toBe(false);
    expect(form.getFieldInstance('a')?.rules).toEqual([{ required: true }]);
    // The rerender plus the owner re-render the adapter requests once the
    // registration is committed, so the owner's render-time reads catch up.
    expect(ownerRenders - rendersBefore).toBe(2);

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'x');
    });

    expect(form.getFieldValue('a')).toBe('initx');
  });

  it('unmounting releases the field from a form that arrived after mount', async () => {
    let form!: CubeFormInstance<any>;

    function Owner({ late }: { late: boolean }) {
      [form] = useForm();

      return (
        <TextInput
          name="a"
          label="A"
          rules={[{ required: true }]}
          form={late ? form : undefined}
        />
      );
    }

    const { rerender, unmount } = renderWithRoot(<Owner late={false} />);

    rerender(<Owner late />);

    expect(form.getFieldNames()).toEqual(['a']);

    unmount();

    // A ghost registration would keep failing the required rule.
    expect(form.getFieldNames()).toEqual([]);
    await expect(form.validateFields()).resolves.toBeDefined();
  });

  it('unmounting releases the field from every form it was bound to', () => {
    let first!: CubeFormInstance<any>;
    let second!: CubeFormInstance<any>;

    function Fixture({ useSecond }: { useSecond: boolean }) {
      [first] = useForm();
      [second] = useForm();

      return <TextInput form={useSecond ? second : first} name="a" label="A" />;
    }

    const { rerender, unmount } = renderWithRoot(<Fixture useSecond={false} />);

    rerender(<Fixture useSecond />);

    // While mounted the old form keeps the field (legacy contract, row 4).
    expect(first.getFieldNames()).toEqual(['a']);
    expect(second.getFieldNames()).toEqual(['a']);

    unmount();

    expect(first.getFieldNames()).toEqual([]);
    expect(second.getFieldNames()).toEqual([]);
  });

  it('a Form name change re-registers the id under the new prefix', () => {
    function Fixture({ prefix, twice }: { prefix: string; twice?: boolean }) {
      return (
        <Form name={prefix}>
          <TextInput name="a" label="A" />
          {twice ? <TextInput name="a" label="B" /> : null}
        </Form>
      );
    }

    const { rerender, getAllByRole, getAllByTestId } = renderWithRoot(
      <Fixture prefix="one" />,
    );

    expect(getAllByRole('textbox').map((el) => el.id)).toEqual(['one_a']);

    rerender(<Fixture prefix="two" />);
    rerender(<Fixture prefix="two" twice />);

    // The first input released `one_a` and registered `two_a`, so the
    // duplicate gets a suffix instead of the same id. Read the labels: the
    // inputs themselves both show `two_a_1` because of the legacy id-merging
    // bug recorded in legacy-contract row 31.
    expect(getAllByTestId('Label').map((el) => el.getAttribute('for'))).toEqual(
      ['two_a', 'two_a_1'],
    );
  });

  it('a renamed field is seeded like a first mount: its default is the new baseline', () => {
    function Fixture({ name }: { name: string }) {
      return <TextInput name={name} label="A" defaultValue="init" />;
    }

    const { formInstance, rerender } = renderWithForm(<Fixture name="a" />);

    act(() => {
      formInstance.setFieldValue('a', 'typed', true);
    });

    expect(formInstance.isFieldDirty('a')).toBe(true);

    rerender(<Fixture name="b" />);

    expect(formInstance.getFieldNames()).toEqual(['b']);
    expect(formInstance.getFieldValue('b')).toBe('init');
    expect(formInstance.isFieldDirty('b')).toBe(false);
  });

  it('a form prop whose identity changes on every render does not re-register the field', async () => {
    let form!: CubeFormInstance<any>;
    let renders = 0;

    function Owner() {
      renders++;

      // A render loop here is a synchronous effect cascade that no test
      // timeout can interrupt; fail instead of hanging the run.
      if (renders > 20) {
        throw new Error('render loop: the field is re-registered per render');
      }

      [form] = useForm();

      // A structural copy per render: the same store behind a new identity,
      // as a wrapper spreading the instance or an inline test mock would do.
      const copy = Object.assign(
        Object.create(Object.getPrototypeOf(form)),
        form,
      );

      return <TextInput name="a" label="A" form={copy} />;
    }

    const { getByRole } = renderWithRoot(<Owner />);
    const removeField = vi.spyOn(form, 'removeField');

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'x');
    });

    expect(form.getFieldValue('a')).toBe('x');
    expect(removeField).not.toHaveBeenCalled();
  });
});
