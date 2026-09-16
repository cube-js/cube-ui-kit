import { ReactElement, useContext } from 'react';

import {
  act,
  render,
  renderWithForm,
  renderWithRoot,
  screen,
  userEvent,
} from '../../../test/index';
import { Checkbox } from '../../fields/Checkbox/Checkbox';
import { CheckboxGroup } from '../../fields/Checkbox/CheckboxGroup';
import { Radio } from '../../fields/RadioGroup/Radio';
import { RadioGroup } from '../../fields/RadioGroup/RadioGroup';
import { TextInput } from '../../fields/TextInput/TextInput';

import {
  FORM_BACKEND,
  isLegacyFormInstance,
  isModernFormController,
  resolveFormBackend,
} from './backend';
import {
  FormContext,
  FormPresentationContext,
  LegacyFormBackendContext,
  LegacyFormRoot,
  useFormProps,
} from './Form';
import { RenderErrorBoundary } from './legacy-contract/helpers';
import { CubeFormInstance, useForm } from './use-form';

import { Form } from './index';

vi.mock('../../../_internal/hooks/use-warn');

/**
 * Dual-backend shell (modernization plan, Phase 3): branding, the `<Form>`
 * facade, the split contexts, group scope masking and the development errors
 * for a backend that is not available yet. Legacy behaviour itself is frozen
 * by `legacy-contract/`; this file covers only what the shell adds.
 */

const modernStub = {
  [FORM_BACKEND]: 'modern',
} as unknown as CubeFormInstance<any>;

function silenceConsoleError() {
  return vi.spyOn(console, 'error').mockImplementation(() => {});
}

describe('dual-backend shell: branding', () => {
  it('a legacy instance is branded, an unbranded object still counts as legacy, a modern brand is recognised', () => {
    const instance = new CubeFormInstance();

    expect(instance[FORM_BACKEND]).toBe('legacy');
    expect(isLegacyFormInstance(instance)).toBe(true);
    expect(isModernFormController(instance)).toBe(false);

    expect(resolveFormBackend(undefined).kind).toBe('none');
    expect(resolveFormBackend(null).kind).toBe('none');
    // Cloud narrows form props structurally and its tests pass plain mocks.
    expect(resolveFormBackend({ getFieldValue() {} }).kind).toBe('legacy');
    expect(resolveFormBackend(modernStub).kind).toBe('modern');
    expect(isModernFormController(modernStub)).toBe(true);
  });

  it('the brand is a symbol: it does not show up in keys or JSON', () => {
    const instance = new CubeFormInstance();

    expect(Object.keys(instance)).not.toContain(String(FORM_BACKEND));
    expect(JSON.stringify(instance)).not.toContain('legacy');
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
    let form!: CubeFormInstance<any>;

    function Owner() {
      [form] = useForm();

      return (
        <Form form={form}>
          <TextInput name="a" label="A" />
        </Form>
      );
    }

    renderWithRoot(<Owner />);

    expect(form.getFieldNames()).toEqual(['a']);
  });

  it('a modern controller reaches the modern root boundary, which is an error in this version', () => {
    const consoleError = silenceConsoleError();

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

    consoleError.mockRestore();
  });

  it('Form.useForm() refuses to adopt a modern controller', () => {
    const consoleError = silenceConsoleError();

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

    consoleError.mockRestore();
  });

  it('a field bound to a modern controller under a legacy root is a development error', () => {
    const consoleError = silenceConsoleError();

    const { getByTestId } = renderWithForm(
      <RenderErrorBoundary>
        <TextInput name="a" label="A" form={modernStub} />
      </RenderErrorBoundary>,
    );

    expect(getByTestId('render-error')).toHaveTextContent(
      /The "a" field received a modern form controller/,
    );

    consoleError.mockRestore();
  });

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
    const backend = useContext(LegacyFormBackendContext);

    return (
      <span
        data-qa="probe"
        data-merged={JSON.stringify(Object.keys(merged).sort())}
        data-label-position={String(merged.labelPosition)}
        data-has-form={String('form' in merged && merged.form != null)}
        data-legacy-keys={JSON.stringify(Object.keys(legacy).sort())}
        data-presentation-keys={JSON.stringify(
          Object.keys(presentation).sort(),
        )}
        data-backend={backend ? 'instance' : 'null'}
      />
    );
  }

  it('the public FormContext keeps its full legacy value under a legacy root', () => {
    let form!: CubeFormInstance<any>;

    function Owner() {
      [form] = useForm();

      return (
        <Form form={form} name="settings" labelPosition="side">
          <Probe />
        </Form>
      );
    }

    const { getByTestId } = renderWithRoot(<Owner />);
    const probe = getByTestId('probe');

    expect(JSON.parse(probe.dataset.legacyKeys!)).toEqual(
      [
        'form',
        'idPrefix',
        'labelPosition',
        'labelStyles',
        'necessityIndicator',
        'orientation',
        'requiredMark',
        'showValid',
        'submitError',
        'validateTrigger',
      ].sort(),
    );
    expect(JSON.parse(probe.dataset.presentationKeys!)).toEqual(
      [
        'idPrefix',
        'labelPosition',
        'labelStyles',
        'necessityIndicator',
        'orientation',
        'requiredMark',
        'showValid',
        'validateTrigger',
      ].sort(),
    );
    expect(probe.dataset.backend).toBe('instance');
    expect(probe.dataset.labelPosition).toBe('side');
    expect(probe.dataset.hasForm).toBe('true');
  });

  it('useFormProps merges presentation, then FormContext, then props; an explicit undefined form detaches', () => {
    const { getAllByTestId } = renderWithRoot(
      <Form labelPosition="side">
        <Probe />
        <Probe props={{ labelPosition: 'top' }} />
        <Probe props={{ form: undefined }} />
      </Form>,
    );
    const [inherited, overridden, detached] = getAllByTestId('probe');

    expect(inherited.dataset.labelPosition).toBe('side');
    expect(overridden.dataset.labelPosition).toBe('top');
    expect(detached.dataset.hasForm).toBe('false');
    expect(detached.dataset.labelPosition).toBe('side');
  });

  it('outside any root every context is empty', () => {
    const { getByTestId } = renderWithRoot(<Probe />);
    const probe = getByTestId('probe');

    expect(JSON.parse(probe.dataset.legacyKeys!)).toEqual([]);
    expect(JSON.parse(probe.dataset.presentationKeys!)).toEqual([]);
    expect(probe.dataset.backend).toBe('null');
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
    '$group masks presentation and backend for its options, exactly as the legacy FormContext override did',
    ({ render: renderGroup, maskKeys }) => {
      const { formInstance, getByTestId } = renderWithForm(
        renderGroup(<Probe />),
        { formProps: { labelPosition: 'side', name: 'outer' } },
      );
      const probe = getByTestId('probe');

      expect(JSON.parse(probe.dataset.legacyKeys!)).toEqual(maskKeys);
      expect(JSON.parse(probe.dataset.presentationKeys!)).toEqual([]);
      expect(probe.dataset.backend).toBe('null');
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
