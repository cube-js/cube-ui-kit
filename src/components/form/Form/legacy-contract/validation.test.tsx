import {
  act,
  renderWithForm,
  userEvent,
  waitFor,
} from '../../../../test/index';
import { TextInput } from '../../../fields/TextInput/TextInput';

import {
  createRenderCounter,
  deferred,
  Deferred,
  FieldProbe,
  renderOwnedForm,
  tick,
} from './helpers';

vi.mock('../../../../_internal/hooks/use-warn');

/**
 * Legacy Form characterization — validation.
 *
 * Covers plan §7.1 items 20 (triggers and status tri-state), 21 (delayed and
 * overlapping async validation), 22 (value/rule/reset/unmount changes during
 * validation) and 23 (error ordering and ReactNode errors).
 */

describe('legacy contract: validation triggers and status (§7.1 #20)', () => {
  it('[frozen] a text input validates on blur by default, not on change', async () => {
    const { formInstance, getByRole } = renderWithForm(
      <TextInput
        name="a"
        label="A"
        rules={[{ min: 3, message: 'Too short' }]}
      />,
    );

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'ab');
    });

    expect(formInstance.getFieldError('a')).toEqual([]);
    expect(formInstance.getFieldInstance('a')!.status).toBeUndefined();

    await act(async () => {
      await userEvent.tab();
    });

    await waitFor(() =>
      expect(formInstance.getFieldError('a')).toEqual(['Too short']),
    );
    expect(formInstance.getFieldInstance('a')!.status).toBe('invalid');
  });

  it('[frozen] validateTrigger="onChange" validates on every change (twice per change, see below)', async () => {
    const validator = vi.fn(async () => {});
    const { formInstance, getByRole } = renderWithForm(
      <TextInput
        name="a"
        label="A"
        validateTrigger="onChange"
        rules={[{ validator }]}
      />,
    );

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'ab');
    });

    await waitFor(() =>
      expect(formInstance.getFieldInstance('a')!.status).toBe('valid'),
    );
    expect(validator.mock.calls.map((call: any[]) => call[1])).toEqual([
      'a',
      'a',
      'ab',
      'ab',
    ]);
  });

  it('[bug-eligible] every user change runs the field change handler twice, so onChange validation validates twice per change', async () => {
    // `useFieldProps` merges `useField`'s own `onChange` with the mapped
    // `onChange` through `mergeProps`, which chains same-named handlers. The
    // second `setFieldValue` is an equal-value no-op, but `validateField` runs
    // again and only its result is published.
    const validator = vi.fn(async () => {});
    const { formInstance, getByTestId } = renderWithForm(
      <FieldProbe name="a" next="v" rules={[{ validator }]} />,
    );
    const setFieldValue = vi.spyOn(formInstance, 'setFieldValue');
    const validateField = vi.spyOn(formInstance, 'validateField');

    await act(async () => {
      await userEvent.click(getByTestId('probe-a-change'));
    });

    await waitFor(() =>
      expect(formInstance.getFieldInstance('a')!.status).toBe('valid'),
    );
    expect(setFieldValue).toHaveBeenCalledTimes(2);
    expect(validateField).toHaveBeenCalledTimes(2);
    expect(validator).toHaveBeenCalledTimes(2);
  });

  it('[bug-eligible] changing an invalid field clears its errors without revalidating; the next trigger revalidates', async () => {
    // The change handler means to revalidate a field that already has errors,
    // but `setFieldValue` has cleared them by the time it looks.
    const { formInstance, getByRole } = renderWithForm(
      <TextInput
        name="a"
        label="A"
        rules={[{ min: 3, message: 'Too short' }]}
      />,
    );

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'ab');
      await userEvent.tab();
    });

    await waitFor(() =>
      expect(formInstance.getFieldError('a')).toEqual(['Too short']),
    );

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'c');
      await tick(30);
    });

    expect(formInstance.getFieldValue('a')).toBe('abc');
    expect(formInstance.getFieldError('a')).toEqual([]);
    expect(formInstance.getFieldInstance('a')!.status).toBeUndefined();

    await act(async () => {
      await userEvent.tab();
    });

    await waitFor(() =>
      expect(formInstance.getFieldInstance('a')!.status).toBe('valid'),
    );
  });

  it('[frozen] status is undefined until validated; isValid needs every field valid and isInvalid needs one invalid', async () => {
    const { formInstance } = renderWithForm(
      <>
        <FieldProbe name="a" rules={[{ required: true, message: 'A' }]} />
        <FieldProbe name="b" rules={[{ required: true, message: 'B' }]} />
      </>,
      { formProps: { defaultValues: { a: 'ok' } } },
    );

    expect(formInstance.getFieldInstance('a')!.status).toBeUndefined();
    expect(formInstance.isValid).toBe(false);
    expect(formInstance.isInvalid).toBe(false);

    await act(async () => {
      await formInstance.validateField('a');
    });

    expect(formInstance.getFieldInstance('a')!.status).toBe('valid');
    expect(formInstance.isValid).toBe(false);
    expect(formInstance.isInvalid).toBe(false);

    await act(async () => {
      await formInstance.validateField('b').catch(() => {});
    });

    expect(formInstance.getFieldInstance('b')!.status).toBe('invalid');
    expect(formInstance.isValid).toBe(false);
    expect(formInstance.isInvalid).toBe(true);
    expect(formInstance.getInvalidFieldNames()).toEqual(['b']);
    expect(formInstance.getValidFieldNames()).toEqual(['a']);
  });

  it('[frozen] validateField() reuses a cached status and only reruns after the value changes', async () => {
    const validator = vi.fn(async () => {});
    const { formInstance } = renderWithForm(
      <FieldProbe name="a" rules={[{ validator }]} />,
      { formProps: { defaultValues: { a: 'x' } } },
    );

    await act(async () => {
      await formInstance.validateField('a');
      await formInstance.validateField('a');
    });

    expect(validator).toHaveBeenCalledTimes(1);

    await act(async () => {
      formInstance.setFieldValue('a', 'y');
    });

    expect(formInstance.getFieldInstance('a')!.status).toBeUndefined();

    await act(async () => {
      await formInstance.validateField('a');
    });

    expect(validator).toHaveBeenCalledTimes(2);
  });

  it('[frozen] a fresh validateField() rejects with a one-element array; validateFields() rejects with a name/errors list', async () => {
    const { formInstance } = renderWithForm(
      <>
        <FieldProbe name="a" rules={[{ required: true, message: 'A!' }]} />
        <FieldProbe name="b" />
      </>,
    );

    await expect(formInstance.validateFields()).rejects.toEqual([
      { name: 'a', errors: ['A!'] },
    ]);

    await act(async () => {
      formInstance.resetFieldsValidation();
    });

    await expect(formInstance.validateField('a')).rejects.toEqual(['A!']);
  });

  it('[bug-eligible] a cached invalid status rejects with the bare error instead of the array', async () => {
    const { formInstance } = renderWithForm(
      <FieldProbe name="a" rules={[{ required: true, message: 'A!' }]} />,
    );

    await expect(formInstance.validateField('a')).rejects.toEqual(['A!']);
    // Second call: `status === 'invalid'` short-circuits and rejects `errors[0]`.
    await expect(formInstance.validateField('a')).rejects.toBe('A!');
    await expect(formInstance.validateFields()).rejects.toEqual([
      { name: 'a', errors: 'A!' },
    ]);
  });
});

describe('legacy contract: overlapping, delayed and stale validation (§7.1 #21, #22)', () => {
  function queuedValidator(queue: Deferred<void>[]) {
    return vi.fn(() => {
      const next = deferred<void>();

      queue.push(next);

      return next.promise;
    });
  }

  it('[frozen] when validateField() calls overlap, only the latest run publishes', async () => {
    const queue: Deferred<void>[] = [];
    const validator = queuedValidator(queue);
    const { formInstance } = renderWithForm(
      <FieldProbe name="a" rules={[{ validator }]} />,
      { formProps: { defaultValues: { a: 'x' } } },
    );

    let first!: Promise<unknown>;
    let second!: Promise<unknown>;

    await act(async () => {
      first = formInstance.validateField('a').catch((e) => e);
      second = formInstance.validateField('a').catch((e) => e);
    });

    expect(queue).toHaveLength(2);

    await act(async () => {
      queue[0].reject('first');
      await first;
    });

    // The first run lost the race: its rejection reaches the caller but the field
    // keeps waiting for the newer run.
    expect(formInstance.getFieldError('a')).toEqual([]);
    expect(formInstance.getFieldInstance('a')!.status).toBeUndefined();

    await act(async () => {
      queue[1].reject('second');
      await second;
    });

    expect(formInstance.getFieldError('a')).toEqual(['second']);
    expect(formInstance.getFieldInstance('a')!.status).toBe('invalid');
  });

  it('[bug-eligible] a value change during an in-flight validation does not discard its result', async () => {
    const queue: Deferred<void>[] = [];
    const validator = queuedValidator(queue);
    const { formInstance } = renderWithForm(
      <FieldProbe name="a" rules={[{ validator }]} />,
      { formProps: { defaultValues: { a: 'x' } } },
    );

    let pending!: Promise<unknown>;

    await act(async () => {
      pending = formInstance.validateField('a').catch((e) => e);
    });

    await act(async () => {
      formInstance.setFieldValue('a', 'changed');
    });

    expect(formInstance.getFieldInstance('a')!.status).toBeUndefined();

    await act(async () => {
      queue[0].reject('stale');
      await pending;
    });

    // The result for the old value is published against the new one.
    expect(formInstance.getFieldValue('a')).toBe('changed');
    expect(formInstance.getFieldError('a')).toEqual(['stale']);
    expect(formInstance.getFieldInstance('a')!.status).toBe('invalid');
  });

  it('[frozen] resetFieldsValidation() or resetFields() during an in-flight validation discards its result', async () => {
    const queue: Deferred<void>[] = [];
    const validator = queuedValidator(queue);
    const { formInstance } = renderWithForm(
      <FieldProbe name="a" rules={[{ validator }]} />,
      { formProps: { defaultValues: { a: 'x' } } },
    );

    let pending!: Promise<unknown>;

    await act(async () => {
      pending = formInstance.validateField('a').catch((e) => e);
    });

    await act(async () => {
      formInstance.resetFieldsValidation(['a']);
    });

    await act(async () => {
      queue[0].reject('stale');
      await pending;
    });

    expect(formInstance.getFieldError('a')).toEqual([]);
    expect(formInstance.getFieldInstance('a')!.status).toBeUndefined();
  });

  it('[frozen] delayed validation coalesces rapid user changes into a single validator run', async () => {
    const validator = vi.fn(async () => {});
    const { formInstance, getByRole } = renderWithForm(
      <TextInput
        name="a"
        label="A"
        validateTrigger="onChange"
        validationDelay={200}
        rules={[{ validator }]}
      />,
    );

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'abc');
    });

    await waitFor(() =>
      expect(formInstance.getFieldInstance('a')!.status).toBe('valid'),
    );
    expect(validator).toHaveBeenCalledTimes(1);
  });

  it('[undefined] a validation that settles after its field unmounted still publishes into the detached field and rerenders the owner', async () => {
    const queue: Deferred<void>[] = [];
    const validator = queuedValidator(queue);
    const counter = createRenderCounter();
    let showField = true;
    const { formInstance, rerenderOwner } = renderOwnedForm(
      () =>
        showField ? <FieldProbe name="a" rules={[{ validator }]} /> : null,
      { formProps: { defaultValues: { a: 'x' } }, counter },
    );
    const detached = formInstance.getFieldInstance('a');

    let pending!: Promise<unknown>;

    await act(async () => {
      pending = formInstance.validateField('a').catch((e) => e);
    });

    showField = false;
    rerenderOwner();

    expect(formInstance.getFieldNames()).toEqual([]);

    const before = counter.snapshot();

    await act(async () => {
      queue[0].reject('late');
      await pending;
    });

    expect(detached!.errors).toEqual(['late']);
    expect(detached!.status).toBe('invalid');
    expect(counter.since(before).owner).toBe(1);
  });

  it('[frozen] inline rule arrays recreated on unrelated rerenders do not trigger validation', async () => {
    const validator = vi.fn(async () => {});
    let renders = 0;

    function Fixture() {
      renders++;

      return (
        <TextInput
          name="a"
          label="A"
          rules={[{ validator }, { min: 1, message: 'Min' }]}
        />
      );
    }

    const { rerender } = renderWithForm(<Fixture />);

    rerender(<Fixture />);
    rerender(<Fixture />);

    await act(async () => {
      await tick(30);
    });

    expect(renders).toBeGreaterThanOrEqual(3);
    expect(validator).not.toHaveBeenCalled();
  });

  it('[frozen] rules are re-read from the latest render, so a changed rule applies to the next validation', async () => {
    function Fixture({ min }: { min: number }) {
      return <FieldProbe name="a" rules={[{ min, message: `Min ${min}` }]} />;
    }

    const { formInstance, rerender } = renderWithForm(<Fixture min={5} />, {
      formProps: { defaultValues: { a: 'abc' } },
    });

    await expect(formInstance.validateField('a')).rejects.toEqual(['Min 5']);

    rerender(<Fixture min={2} />);

    // The cached `invalid` status short-circuits (with the bare-error shape)
    // until validation is reset.
    await expect(formInstance.validateField('a')).rejects.toBe('Min 5');

    await act(async () => {
      formInstance.resetFieldsValidation(['a']);
    });

    await expect(formInstance.validateField('a')).resolves.toBeUndefined();
  });
});

describe('legacy contract: error shape (§7.1 #23)', () => {
  it('[frozen] only the first failing rule reports, in rule order', async () => {
    const { formInstance } = renderWithForm(
      <FieldProbe
        name="a"
        rules={[
          { required: true, message: 'Required' },
          { min: 5, message: 'Min 5' },
        ]}
      />,
    );

    await expect(formInstance.validateField('a')).rejects.toEqual(['Required']);

    await act(async () => {
      formInstance.setFieldValue('a', 'ab');
    });

    await expect(formInstance.validateField('a')).rejects.toEqual(['Min 5']);
    expect(formInstance.getFieldError('a')).toEqual(['Min 5']);
  });

  it('[frozen] ReactNode errors render as-is', async () => {
    const { formInstance, getByTestId } = renderWithForm(
      <TextInput
        name="a"
        label="A"
        rules={[
          {
            validator: () => Promise.reject(<b data-qa="rich-error">Rich</b>),
          },
        ]}
      />,
    );

    await act(async () => {
      await formInstance.validateField('a').catch(() => {});
    });

    expect(getByTestId('rich-error')).toHaveTextContent('Rich');
  });

  it('[frozen] Error rejections use their message; empty rejections fall back to rule.message; other values pass through', async () => {
    const { formInstance } = renderWithForm(
      <>
        <FieldProbe
          name="error"
          rules={[
            {
              validator: () => Promise.reject(new Error('From error')),
              message: 'Ignored',
            },
          ]}
        />
        <FieldProbe
          name="empty"
          rules={[{ validator: () => Promise.reject(), message: 'Fallback' }]}
        />
        <FieldProbe
          name="literal"
          rules={[
            { validator: () => Promise.reject('literal'), message: 'Ignored' },
          ]}
        />
      </>,
    );

    await expect(formInstance.validateField('error')).rejects.toEqual([
      'From error',
    ]);
    await expect(formInstance.validateField('empty')).rejects.toEqual([
      'Fallback',
    ]);
    await expect(formInstance.validateField('literal')).rejects.toEqual([
      'literal',
    ]);
  });
});
