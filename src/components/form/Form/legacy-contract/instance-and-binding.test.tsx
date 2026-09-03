import { createRef, StrictMode } from 'react';

import {
  act,
  render,
  renderWithForm,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../../test/index';
import { Checkbox } from '../../../fields/Checkbox/Checkbox';
import { CheckboxGroup } from '../../../fields/Checkbox/CheckboxGroup';
import { Radio } from '../../../fields/RadioGroup/Radio';
import { RadioGroup } from '../../../fields/RadioGroup/RadioGroup';
import { TextInput } from '../../../fields/TextInput/TextInput';
import { Root } from '../../../Root';
import { Form } from '../index';
import { CubeFormInstance, useForm } from '../use-form';

import {
  createRenderCounter,
  FieldProbe,
  RenderErrorBoundary,
  renderOwnedForm,
} from './helpers';

vi.mock('../../../../_internal/hooks/use-warn');

/**
 * Legacy Form characterization — instance creation and binding.
 *
 * Covers plan §7.1 items 1 (creation), 2 (context binding), 3 (explicit form
 * precedence), 4 (identity changes), 5 (registration order / duplicates),
 * 6 (dynamic names), 19 (instance created above the root), 30 (refs) and
 * 31 (ids). Items 3 and 6 are also covered by `explicit-form-prop.test.tsx`
 * and `unbind-form-prop.test.tsx`; only the gaps are filled here.
 *
 * Each assertion is labelled with its contract class — see README.md.
 */

describe('legacy contract: instance creation (§7.1 #1)', () => {
  it('[frozen] Form.useForm() returns the same instance on every render of its owner', () => {
    const seen: CubeFormInstance<any>[] = [];

    function Owner() {
      const [form] = useForm();

      seen.push(form);

      return null;
    }

    const { rerender } = render(<Owner />);

    rerender(<Owner />);

    expect(seen).toHaveLength(2);
    expect(seen[0]).toBe(seen[1]);
    expect(seen[0]).toBeInstanceOf(CubeFormInstance);
  });

  it('[frozen] Form.useForm() installs forceReRender on the component that created the instance', async () => {
    const counter = createRenderCounter();
    const { formInstance } = renderOwnedForm(
      () => <TextInput name="a" label="A" />,
      { counter },
    );
    const before = counter.snapshot();

    await act(async () => {
      formInstance.setFieldValue('a', 'x');
    });

    expect(counter.since(before).owner).toBe(1);
  });

  it('[undefined] a directly constructed CubeFormInstance never rerenders anything', async () => {
    const form = new CubeFormInstance<any>();
    const counter = createRenderCounter();

    function Owner() {
      counter.count('owner');

      return (
        <Root>
          <Form form={form}>
            <TextInput name="a" label="A" />
          </Form>
        </Root>
      );
    }

    const { getByRole } = render(<Owner />);
    const before = counter.snapshot();

    await act(async () => {
      form.setFieldValue('a', 'x');
    });

    // The value landed in the instance, but nothing observes it: `useForm(instance)`
    // adopts the instance without installing a rerender hook, so the default
    // no-op `forceReRender` stays in place.
    expect(form.getFieldValue('a')).toBe('x');
    expect(counter.since(before).owner).toBe(0);
    expect(getByRole('textbox')).toHaveValue('');
  });

  it('[frozen] useForm(instance) adopts the given instance instead of creating a new one', () => {
    const external = new CubeFormInstance<any>();
    let inner!: CubeFormInstance<any>;

    function Owner() {
      [inner] = useForm(external);

      return null;
    }

    render(<Owner />);

    expect(inner).toBe(external);
  });
});

describe('legacy contract: form context binding (§7.1 #2, #3)', () => {
  it('[frozen] a named input inside <Form> registers with the context form; an unnamed one does not', () => {
    const { formInstance } = renderWithForm(
      <>
        <TextInput name="a" label="A" />
        <TextInput label="B" />
      </>,
    );

    expect(formInstance.getFieldNames()).toEqual(['a']);
  });

  it('[frozen] group inputs register once; their options never register, even when given a name', () => {
    const { formInstance } = renderWithForm(
      <>
        <CheckboxGroup name="checks" label="Checks">
          <Checkbox value="one" name="leak">
            One
          </Checkbox>
          <Checkbox value="two">Two</Checkbox>
        </CheckboxGroup>
        <RadioGroup name="radios" label="Radios">
          <Radio value="one">One</Radio>
          <Radio value="two">Two</Radio>
        </RadioGroup>
      </>,
    );

    expect(formInstance.getFieldNames()).toEqual(['checks', 'radios']);
  });

  it('[frozen] form={null} detaches an input from the surrounding form like form={undefined} does', async () => {
    const { formInstance, getByRole } = renderWithForm(
      <TextInput form={null as any} name="a" label="A" />,
    );

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'x');
    });

    expect(formInstance.getFieldNames()).toEqual([]);
    expect(getByRole('textbox')).toHaveValue('x');
  });
});

describe('legacy contract: form identity changes after mount (§7.1 #4)', () => {
  it('[undefined] <Form> keeps the first form it saw and ignores a different form prop later', async () => {
    const first = new CubeFormInstance<any>();
    const second = new CubeFormInstance<any>();

    function Fixture({ form }: { form: CubeFormInstance<any> }) {
      return (
        <Root>
          <Form form={form}>
            <TextInput name="a" label="A" />
          </Form>
        </Root>
      );
    }

    const { rerender, getByRole } = render(<Fixture form={first} />);

    rerender(<Fixture form={second} />);

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'x');
    });

    expect(first.getFieldValue('a')).toBe('x');
    expect(second.getFieldNames()).toEqual([]);
  });

  it('[undefined] an input given a new form prop registers with the new form but stays registered in the old one', async () => {
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
    expect(first.getFieldNames()).toEqual(['a']);

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'x');
    });

    expect(second.getFieldValue('a')).toBe('x');
    expect(first.getFieldValue('a')).toBeUndefined();
  });
});

describe('legacy contract: registration order and duplicate names (§7.1 #5)', () => {
  it('[frozen] getFieldNames() lists fields in mount order', () => {
    const { formInstance } = renderWithForm(
      <>
        <TextInput name="b" label="B" />
        <TextInput name="a" label="A" />
        <TextInput name="c" label="C" />
      </>,
    );

    expect(formInstance.getFieldNames()).toEqual(['b', 'a', 'c']);
  });

  it('[undefined] two inputs with one name share a field; unmounting either one drops the value for the other', async () => {
    function Fixture({ both }: { both: boolean }) {
      return (
        <>
          {both ? <TextInput name="a" label="First" /> : null}
          <TextInput name="a" label="Second" />
        </>
      );
    }

    const { formInstance, rerender, getByRole } = renderWithForm(
      <Fixture both />,
    );

    expect(formInstance.getFieldNames()).toEqual(['a']);

    await act(async () => {
      await userEvent.type(getByRole('textbox', { name: 'First' }), 'x');
    });

    expect(getByRole('textbox', { name: 'Second' })).toHaveValue('x');

    rerender(<Fixture both={false} />);

    // The unmounting duplicate deletes the shared field; the survivor
    // re-registers a fresh one on its next effect, with the default value.
    await waitFor(() => expect(formInstance.getFieldNames()).toEqual(['a']));
    expect(formInstance.getFieldValue('a')).toBeUndefined();
    expect(getByRole('textbox', { name: 'Second' })).toHaveValue('');
  });
});

describe('legacy contract: dynamic field names (§7.1 #6)', () => {
  it('[frozen] renaming an input re-registers it under the new name and drops the old value', async () => {
    function Fixture({ name }: { name: string }) {
      return <TextInput name={name} label="A" />;
    }

    const { formInstance, rerender, getByRole } = renderWithForm(
      <Fixture name="first" />,
    );

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'x');
    });

    expect(formInstance.getFieldValue('first')).toBe('x');

    rerender(<Fixture name="second" />);

    await waitFor(() =>
      expect(formInstance.getFieldNames()).toEqual(['second']),
    );
    expect(formInstance.getFieldValue('second')).toBeUndefined();
    expect(formInstance.getFieldValue('first')).toBeUndefined();
  });

  it.each([
    // Dropping `name` skips `useField`: React reports conditional hook calls.
    ['named to standalone', 'a', undefined, /calling hooks conditionally/i],
    // Adding `name` appends hooks; React fails inside its hook bookkeeping
    // ("Cannot read properties of undefined") before it can name the cause.
    ['standalone to named', undefined, 'a', /./],
  ])(
    '[undefined] switching an input from %s changes the hook order and throws',
    (_, from, to, expectedMessage) => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      function Fixture({ name }: { name?: string }) {
        return <TextInput name={name} label="A" />;
      }

      const { rerender, queryByTestId } = renderWithForm(
        <RenderErrorBoundary>
          <Fixture name={from} />
        </RenderErrorBoundary>,
      );

      expect(queryByTestId('render-error')).toBeNull();

      rerender(
        <RenderErrorBoundary>
          <Fixture name={to} />
        </RenderErrorBoundary>,
      );

      expect(queryByTestId('render-error')).toHaveTextContent(expectedMessage);

      consoleError.mockRestore();
    },
  );
});

describe('legacy contract: instance created above the Form root (§7.1 #19)', () => {
  it('[frozen] <Form> installs its callbacks on an instance created by a parent component', async () => {
    const onSubmit = vi.fn();
    const onValuesChange = vi.fn();
    let form!: CubeFormInstance<any>;

    function Owner() {
      [form] = useForm();

      return (
        <Root>
          <Form form={form} onSubmit={onSubmit} onValuesChange={onValuesChange}>
            <TextInput name="a" label="A" />
          </Form>
        </Root>
      );
    }

    const { getByRole } = render(<Owner />);

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'x');
    });

    expect(onValuesChange).toHaveBeenCalledWith({ a: 'x' });

    await act(async () => {
      await form.submit();
    });

    expect(onSubmit).toHaveBeenCalledWith({ a: 'x' });
  });
});

describe('legacy contract: refs (§7.1 #30)', () => {
  it('[frozen] the Form ref receives the <form> element', () => {
    const ref = createRef<HTMLFormElement>();

    renderWithRoot(
      <Form ref={ref}>
        <TextInput name="a" label="A" />
      </Form>,
    );

    expect(ref.current).toBeInstanceOf(HTMLFormElement);
  });

  it('[undefined] form.ref is copied from ref.current during the first render, so it is null', () => {
    const ref = createRef<HTMLFormElement>();
    let form!: CubeFormInstance<any>;

    function Owner() {
      [form] = useForm();

      return (
        <Root>
          <Form ref={ref} form={form}>
            <TextInput name="a" label="A" />
          </Form>
        </Root>
      );
    }

    render(<Owner />);

    expect(ref.current).toBeInstanceOf(HTMLFormElement);
    expect(form.ref).toBeNull();
  });
});

describe('legacy contract: field ids (§7.1 #31)', () => {
  it('[frozen] ids derive from the field name and are deduplicated across mounted fields', async () => {
    renderWithRoot(
      <>
        <Form>
          <FieldProbe name="contract_email" qa="first" />
        </Form>
        <Form>
          <FieldProbe name="contract_email" qa="second" />
        </Form>
      </>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('second')).toHaveAttribute(
        'id',
        'contract_email_1',
      ),
    );
    expect(screen.getByTestId('first')).toHaveAttribute('id', 'contract_email');
  });

  it('[bug-eligible] two TextInputs sharing a base id both render the deduplicated id, orphaning the first label', async () => {
    // The allocator hands out `contract_dup` and `contract_dup_1` (see the
    // probe test above). The inputs still collide: `utils/react/useId` keeps a
    // module-global updater map keyed by id string, both inputs start from the
    // same base id, and merging `contract_dup_1` back through `mergeIds` renames
    // the wrong element. The first label keeps pointing at an id no element has.
    const { container } = renderWithRoot(
      <Form>
        <TextInput name="contract_dup" label="First" />
        <TextInput name="contract_dup" label="Second" />
      </Form>,
    );

    await act(async () => {});

    const inputs = Array.from(container.querySelectorAll('input'));
    const labels = Array.from(container.querySelectorAll('label'));

    expect(inputs.map((input) => input.id)).toEqual([
      'contract_dup_1',
      'contract_dup_1',
    ]);
    expect(
      labels.map((label) => [label.textContent, label.getAttribute('for')]),
    ).toEqual([
      ['First', 'contract_dup'],
      ['Second', 'contract_dup_1'],
    ]);
  });

  it('[frozen] the Form name prefixes generated ids', async () => {
    renderWithRoot(
      <Form name="login">
        <TextInput name="contract_email" label="Email" />
      </Form>,
    );

    await waitFor(() =>
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'id',
        'login_contract_email',
      ),
    );
  });

  it('[frozen] an explicit id is used verbatim and is not deduplicated', async () => {
    renderWithRoot(
      <Form>
        <TextInput id="contract_custom" name="a" label="First" />
        <TextInput id="contract_custom" name="b" label="Second" />
      </Form>,
    );

    await act(async () => {});

    expect(screen.getByRole('textbox', { name: 'First' })).toHaveAttribute(
      'id',
      'contract_custom',
    );
    expect(screen.getByRole('textbox', { name: 'Second' })).toHaveAttribute(
      'id',
      'contract_custom',
    );
  });

  it('[frozen] unmounting releases the id so a remount reuses the base id', async () => {
    function Fixture({ mounted }: { mounted: boolean }) {
      return mounted ? <TextInput name="contract_reuse" label="A" /> : null;
    }

    const { rerender } = renderWithForm(<Fixture mounted />);

    await waitFor(() =>
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'id',
        'contract_reuse',
      ),
    );

    rerender(<Fixture mounted={false} />);
    rerender(<Fixture mounted />);

    await act(async () => {});

    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'contract_reuse');
  });

  it('[frozen] Strict Mode double effects do not leak ids or registrations', async () => {
    let form!: CubeFormInstance<any>;

    function Owner() {
      [form] = useForm();

      return (
        <Root>
          <Form form={form}>
            <TextInput name="contract_strict" label="A" />
          </Form>
        </Root>
      );
    }

    const { unmount } = render(
      <StrictMode>
        <Owner />
      </StrictMode>,
    );

    await waitFor(() =>
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'id',
        'contract_strict',
      ),
    );
    expect(form.getFieldNames()).toEqual(['contract_strict']);

    unmount();

    expect(form.getFieldNames()).toEqual([]);

    render(
      <StrictMode>
        <Owner />
      </StrictMode>,
    );

    await waitFor(() =>
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'id',
        'contract_strict',
      ),
    );
  });
});
