import { ReactElement, useContext } from 'react';

import {
  act,
  render,
  renderWithForm,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test/index';
import { Checkbox } from '../../fields/Checkbox/Checkbox';
import { CheckboxGroup } from '../../fields/Checkbox/CheckboxGroup';
import { Radio } from '../../fields/RadioGroup/Radio';
import { RadioGroup } from '../../fields/RadioGroup/RadioGroup';
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
    expect(screen.getByRole('textbox')).toHaveValue('x');
  });
});

/**
 * The legacy engine never supported changing an input's binding after mount:
 * `useFieldProps` returned early for a standalone input, so the switch threw a
 * hook-order error, and a `form` prop that changed left the field registered
 * in both forms. The shell keeps every hook mounted and keys the legacy
 * adapter on `(form, name)`, so these are defined now.
 */
describe('dual-backend shell: rebinding after mount', () => {
  it.each([
    ['named to standalone', 'a', undefined],
    ['standalone to named', undefined, 'a'],
  ])(
    'switching an input from %s keeps the hook order and rebinds',
    async (_, from, to) => {
      silenceConsoleError();

      function Fixture({ name }: { name?: string }) {
        return <TextInput name={name} label="A" />;
      }

      const { formInstance, rerender, queryByTestId, getByRole } =
        renderWithForm(
          <RenderErrorBoundary>
            <Fixture name={from} />
          </RenderErrorBoundary>,
        );

      rerender(
        <RenderErrorBoundary>
          <Fixture name={to} />
        </RenderErrorBoundary>,
      );

      expect(queryByTestId('render-error')).toBeNull();

      await act(async () => {
        await userEvent.type(getByRole('textbox'), 'x');
      });

      if (to) {
        expect(formInstance.getFieldNames()).toEqual(['a']);
        expect(formInstance.getFieldValue('a')).toBe('x');
      } else {
        // Unbinding released the field; typing stays local to the input.
        expect(formInstance.getFieldNames()).toEqual([]);
        expect(getByRole('textbox')).toHaveValue('x');
      }
    },
  );

  it('an input that gains a name gets the form-prefixed id and its default as the baseline', async () => {
    function Fixture({ name }: { name?: string }) {
      return <TextInput name={name} label="A" defaultValue="init" />;
    }

    const { formInstance, rerender, getByRole, getByTestId } = renderWithForm(
      <Fixture />,
      { formProps: { name: 'shell' } },
    );

    expect(formInstance.getFieldNames()).toEqual([]);

    rerender(<Fixture name="gained" />);

    await waitFor(() =>
      expect(formInstance.getFieldNames()).toEqual(['gained']),
    );

    const input = getByRole('textbox');

    // The id is derived from the current binding, not from the standalone
    // seed, and the label follows it.
    expect(input).toHaveAttribute('id', 'shell_gained');
    expect(getByTestId('Label')).toHaveAttribute('for', 'shell_gained');

    // The field default seeds the value and the dirty baseline, as on a
    // first mount.
    expect(formInstance.getFieldValue('gained')).toBe('init');
    expect(formInstance.isFieldDirty('gained')).toBe(false);

    await act(async () => {
      await userEvent.type(input, 'x');
    });

    expect(formInstance.isFieldDirty('gained')).toBe(true);

    act(() => {
      formInstance.resetFields();
    });

    expect(formInstance.getFieldValue('gained')).toBe('init');
    expect(formInstance.isFieldDirty('gained')).toBe(false);
  });

  it('switching a name back and forth reuses the same id instead of suffixing it', async () => {
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

  it('an input that receives a form prop after mount registers with it', async () => {
    let form!: CubeFormInstance<any>;

    function Owner({ late }: { late: boolean }) {
      [form] = useForm();

      return (
        <TextInput
          name="a"
          label="A"
          defaultValue="init"
          form={late ? form : undefined}
        />
      );
    }

    const { rerender, getByRole } = renderWithRoot(<Owner late={false} />);

    expect(form.getFieldNames()).toEqual([]);

    rerender(<Owner late />);

    await waitFor(() => expect(form.getFieldNames()).toEqual(['a']));
    expect(form.getFieldValue('a')).toBe('init');
    expect(form.isFieldDirty('a')).toBe(false);

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'x');
    });

    expect(form.getFieldValue('a')).toBe('initx');
  });

  it('an input whose form prop changes leaves the old form and registers with the new one', async () => {
    let first!: CubeFormInstance<any>;
    let second!: CubeFormInstance<any>;

    function Fixture({ useSecond }: { useSecond: boolean }) {
      [first] = useForm();
      [second] = useForm();

      return <TextInput form={useSecond ? second : first} name="a" label="A" />;
    }

    const { rerender, getByRole } = renderWithRoot(
      <Fixture useSecond={false} />,
    );

    expect(first.getFieldNames()).toEqual(['a']);
    expect(second.getFieldNames()).toEqual([]);

    rerender(<Fixture useSecond />);

    await waitFor(() => expect(second.getFieldNames()).toEqual(['a']));
    expect(first.getFieldNames()).toEqual([]);

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'x');
    });

    expect(second.getFieldValue('a')).toBe('x');
    expect(first.getFieldValue('a')).toBeUndefined();
  });
});
