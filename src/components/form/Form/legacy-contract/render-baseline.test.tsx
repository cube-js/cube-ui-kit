import { StrictMode } from 'react';

import { act, render, userEvent, waitFor } from '../../../../test/index';
import { TextInput } from '../../../fields/TextInput/TextInput';
import { Root } from '../../../Root';
import { Form, useFormProps } from '../index';
import { CubeFormInstance, useForm } from '../use-form';

import { createRenderCounter, FieldProbe, tick } from './helpers';

vi.mock('../../../../_internal/hooks/use-warn');

/**
 * Legacy Form characterization — render baselines and lifecycle.
 *
 * Records how many times the legacy engine renders the form owner, a context
 * consumer directly under `<Form>`, and each field for one mutation. These are
 * *recorded* numbers, not budgets (plan §9 Phase 1 step 3): the modern backend
 * is measured against §11, the legacy backend only against these.
 *
 * Also covers Strict Mode mounting and the lifecycle leaks listed in plan §2.2
 * for the legacy side (Phase 1 step 4).
 */

function createFixture({ strict = false } = {}) {
  const counter = createRenderCounter();
  let formInstance!: CubeFormInstance<any>;

  // A consumer of the Form context that sits directly under <Form>. It renders
  // whenever the Form shell republishes its context value.
  function Leaf() {
    counter.count('leaf');
    useFormProps({});

    return null;
  }

  function Owner() {
    const [form] = useForm();

    formInstance = form;
    counter.count('owner');

    return (
      <Root>
        <Form form={form}>
          <counter.Counted id="fieldA">
            <TextInput name="a" label="A" />
          </counter.Counted>
          <counter.Counted id="fieldB">
            <TextInput name="b" label="B" />
          </counter.Counted>
          <Leaf />
        </Form>
      </Root>
    );
  }

  const ui = strict ? (
    <StrictMode>
      <Owner />
    </StrictMode>
  ) : (
    <Owner />
  );

  const result = render(ui);

  return {
    ...result,
    counter,
    get form() {
      return formInstance;
    },
  };
}

describe('legacy render baseline (plan §9 Phase 1 step 3, §11)', () => {
  it('[frozen] mounting two fields renders the owner three times', async () => {
    const { counter } = createFixture();

    await act(async () => {});

    // 1: mount — fields are created during this render, after the `[field]`
    //    effect has already captured `undefined` as its dependency.
    // 2: the fields' mount effects call `forceReRender()` (batched into one).
    // 3: the `[field]` dependency flipped from `undefined` to the field object
    //    created later in render 1, so the effect runs again and calls
    //    `forceReRender()` once more.
    expect(counter.snapshot()).toEqual({
      owner: 3,
      fieldA: 3,
      fieldB: 3,
      leaf: 3,
    });
  });

  it('[frozen] one programmatic user-style change rerenders the owner, the Form subtree and every field once', async () => {
    const { counter, form } = createFixture();

    await act(async () => {});

    const before = counter.snapshot();

    await act(async () => {
      form.setFieldValue('a', 'x', true);
    });

    expect(counter.since(before)).toEqual({
      owner: 1,
      fieldA: 1,
      fieldB: 1,
      leaf: 1,
    });
  });

  it('[frozen] one keystroke into one field rerenders the owner and every other field once', async () => {
    const { counter, getByRole } = createFixture();

    await act(async () => {});

    const before = counter.snapshot();

    await act(async () => {
      await userEvent.type(getByRole('textbox', { name: 'A' }), 'x');
    });

    expect(counter.since(before)).toEqual({
      owner: 1,
      fieldA: 1,
      fieldB: 1,
      leaf: 1,
    });
  });

  it('[frozen] publishing a validation result rerenders the whole owner subtree', async () => {
    const { counter, form } = createFixture();

    await act(async () => {});

    // Rules live on the field object; give `a` one so validation has work to do.
    form.getFieldInstance('a')!.rules = [{ required: true, message: 'R' }];

    const before = counter.snapshot();

    await act(async () => {
      await form.validateField('a').catch(() => {});
    });

    expect(counter.since(before)).toEqual({
      owner: 1,
      fieldA: 1,
      fieldB: 1,
      leaf: 1,
    });
  });

  it('[frozen] setSubmitting() and setFieldError() each cost one owner render', async () => {
    const { counter, form } = createFixture();

    await act(async () => {});

    const before = counter.snapshot();

    await act(async () => {
      form.setSubmitting(true);
    });

    await act(async () => {
      form.setFieldError('a', 'Bad');
    });

    expect(counter.since(before).owner).toBe(2);
  });

  it('[frozen] the component that created the instance rerenders even when <Form> is rendered by a child', async () => {
    const counter = createRenderCounter();
    let formInstance!: CubeFormInstance<any>;

    function Child({ form }: { form: CubeFormInstance<any> }) {
      counter.count('child');

      return (
        <Form form={form}>
          <TextInput name="a" label="A" />
        </Form>
      );
    }

    function Grandparent() {
      const [form] = useForm();

      formInstance = form;
      counter.count('grandparent');

      return (
        <Root>
          <Child form={form} />
        </Root>
      );
    }

    render(<Grandparent />);

    await act(async () => {});

    const before = counter.snapshot();

    await act(async () => {
      formInstance.setFieldValue('a', 'x', true);
    });

    expect(counter.since(before)).toEqual({ grandparent: 1, child: 1 });
  });
});

describe('legacy lifecycle (plan §9 Phase 1 step 4)', () => {
  it('[frozen] Strict Mode mounting settles with one registration per field', async () => {
    const { form } = createFixture({ strict: true });

    await waitFor(() => expect(form.getFieldNames()).toEqual(['a', 'b']));

    await act(async () => {
      await tick(20);
    });

    expect(form.getFieldNames()).toEqual(['a', 'b']);
  });

  it('[frozen] unmounting the owner removes every registration', async () => {
    const { form, unmount } = createFixture();

    await act(async () => {});

    expect(form.getFieldNames()).toEqual(['a', 'b']);

    unmount();

    expect(form.getFieldNames()).toEqual([]);
  });

  it('[undefined] an instance reused by a new owner after its creator unmounted is no longer reactive', async () => {
    const { form, unmount } = createFixture();

    await act(async () => {});
    unmount();

    const counter = createRenderCounter();

    function SecondOwner() {
      useForm(form);
      counter.count('second');

      return (
        <Root>
          <Form form={form}>
            <TextInput name="a" label="A" />
          </Form>
        </Root>
      );
    }

    const { getByRole } = render(<SecondOwner />);

    await act(async () => {});

    const before = counter.snapshot();

    await act(async () => {
      form.setFieldValue('a', 'x', true);
    });

    expect(form.getFieldValue('a')).toBe('x');
    expect(counter.since(before).second).toBe(0);
    expect(getByRole('textbox')).toHaveValue('');
  });

  it('[undefined] a delayed validation started before unmount still runs its validator afterwards, without throwing', async () => {
    const validator = vi.fn(async () => {});
    let mounted = true;
    const counter = createRenderCounter();
    let formInstance!: CubeFormInstance<any>;

    function Owner() {
      const [form] = useForm();

      formInstance = form;
      counter.count('owner');

      return (
        <Root>
          <Form form={form}>
            {mounted ? (
              <FieldProbe
                name="a"
                validationDelay={50}
                rules={[{ validator }]}
              />
            ) : null}
          </Form>
        </Root>
      );
    }

    const { rerender } = render(<Owner />);

    await act(async () => {});

    let pending!: Promise<unknown>;

    await act(async () => {
      pending = formInstance.validateField('a').catch((e) => e);
    });

    mounted = false;
    rerender(<Owner />);

    expect(formInstance.getFieldNames()).toEqual([]);
    expect(validator).not.toHaveBeenCalled();

    await act(async () => {
      await pending;
    });

    // The timer was owned by the rule closure, not by the field's lifetime.
    expect(validator).toHaveBeenCalledTimes(1);
  });
});
