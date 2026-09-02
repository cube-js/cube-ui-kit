/**
 * Phase 2 spike — React adapter exercises and measurements.
 *
 * Render counts here are the "modern requirement" column of plan §11:
 * owner 0, shell 0, unrelated field 0, changed field ≤ 1 per transaction,
 * equal selection 0.
 */
import { ReactNode, StrictMode, useState } from 'react';

import {
  act,
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
} from '../../../src/test/index';

import {
  FormController,
  FormSubscribe,
  ModernForm,
  shallowEqual,
  useFormController,
  useFormControllerContext,
  useFormField,
  useFormSelector,
  useOptionalFormController,
} from './react';
import { FormStoreOptions, ValidationRule } from './store';

const renders: Record<string, number> = {};
const count = (id: string) => {
  renders[id] = (renders[id] ?? 0) + 1;
};
const snapshot = () => ({ ...renders });
const since = (before: Record<string, number>) => {
  const delta: Record<string, number> = {};
  for (const key of new Set([
    ...Object.keys(before),
    ...Object.keys(renders),
  ])) {
    const d = (renders[key] ?? 0) - (before[key] ?? 0);
    if (d !== 0) delta[key] = d;
  }
  return delta;
};

beforeEach(() => {
  for (const key of Object.keys(renders)) delete renders[key];
});

function Field({
  name,
  rules,
  validationDelay,
  validateTrigger,
  preserve,
  defaultValue,
  controller,
}: {
  name: string;
  rules?: ValidationRule[];
  validationDelay?: number;
  validateTrigger?: 'onChange' | 'onBlur';
  preserve?: boolean;
  defaultValue?: unknown;
  controller?: FormController<any>;
}) {
  const contextController = useOptionalFormController();
  const fromContext = controller ?? contextController!;
  const options: Record<string, unknown> = {
    rules,
    validationDelay,
    validateTrigger,
    preserve,
  };
  if (defaultValue !== undefined) options.defaultValue = defaultValue;
  const field = useFormField<string>(fromContext, name, options);
  count(`field:${name}`);

  return (
    <label>
      {name}
      <input
        data-qa={`input-${name}`}
        value={field.value ?? ''}
        onChange={(event) => field.onChange(event.target.value)}
        onBlur={field.onBlur}
      />
      {field.errorMessage ? (
        <span data-qa={`error-${name}`}>{field.errorMessage}</span>
      ) : null}
    </label>
  );
}

function Status({ isEqual }: { isEqual?: (a: any, b: any) => boolean }) {
  const controller = useFormControllerContext();
  const status = useFormSelector(
    controller,
    (state) => ({ isDirty: state.isDirty, isSubmitting: state.isSubmitting }),
    { isEqual },
  );
  count('status');
  return <span data-qa="status">{JSON.stringify(status)}</span>;
}

function Shell({ children }: { children: ReactNode }) {
  count('shell');
  return <>{children}</>;
}

function renderModern(
  children: ReactNode,
  options: FormStoreOptions<any> & {
    strict?: boolean;
    rootProps?: Record<string, unknown>;
  } = {},
) {
  const { strict, rootProps, ...storeOptions } = options;
  let controller!: FormController<any>;

  function Owner() {
    const c = useFormController(storeOptions);
    controller = c;
    count('owner');
    return (
      <ModernForm controller={c} {...rootProps}>
        <Shell>{children}</Shell>
      </ModernForm>
    );
  }

  const ui = strict ? (
    <StrictMode>
      <Owner />
    </StrictMode>
  ) : (
    <Owner />
  );

  const utils = render(ui);
  return { ...utils, controller };
}

describe('modern React adapter', () => {
  it('defaults are visible to a colocated selector on the first render', () => {
    let firstRenderValue: unknown = 'unset';
    function Owner() {
      const controller = useFormController({ defaultValues: { a: 'seeded' } });
      const a = useFormSelector(controller, (state) => state.values.a);
      if (firstRenderValue === 'unset') firstRenderValue = a;
      count('owner');
      return <span data-qa="a">{String(a)}</span>;
    }
    render(<Owner />);
    expect(firstRenderValue).toBe('seeded');
    expect(screen.getByTestId('a').textContent).toBe('seeded');
    expect(renders.owner).toBe(1);
  });

  it('mount renders each component once; a keystroke rerenders only the changed field', async () => {
    const { controller } = renderModern(
      <>
        <Field name="a" />
        <Field name="b" />
        <Status isEqual={shallowEqual} />
      </>,
    );

    expect(snapshot()).toEqual({
      owner: 1,
      shell: 1,
      'field:a': 1,
      'field:b': 1,
      status: 1,
    });
    expect(controller.getSnapshot().fields.a.active).toBe(true);

    const before = snapshot();
    const publishesBefore = controller.debug.publishCount();
    await act(async () => {
      await userEvent.type(screen.getByTestId('input-a'), 'x');
    });
    // Field a: 1 render. Status: dirty flipped false→true, 1 render. Nothing else.
    expect(since(before)).toEqual({ 'field:a': 1, status: 1 });
    expect(controller.debug.publishCount() - publishesBefore).toBe(1);

    const again = snapshot();
    await act(async () => {
      await userEvent.type(screen.getByTestId('input-a'), 'yz');
    });
    expect(since(again)).toEqual({ 'field:a': 2 });
    expect(controller.getSnapshot().values).toEqual({ a: 'xyz' });
  });

  it('an allocating selector with isEqual does not rerender on equal results; without it, it does', async () => {
    renderModern(
      <>
        <Field name="a" />
        <Status isEqual={shallowEqual} />
      </>,
    );
    await act(async () => {
      await userEvent.type(screen.getByTestId('input-a'), 'a');
    });
    const before = snapshot();
    await act(async () => {
      await userEvent.type(screen.getByTestId('input-a'), 'bc');
    });
    expect(since(before)).toEqual({ 'field:a': 2 });

    // Same scenario with the default Object.is equality.
    const second = renderModern(
      <>
        <Field name="a" />
        <Status />
      </>,
    );
    await act(async () => {
      await userEvent.type(second.getAllByTestId('input-a')[1], 'a');
    });
    const before2 = snapshot();
    await act(async () => {
      await userEvent.type(second.getAllByTestId('input-a')[1], 'bc');
    });
    expect(since(before2).status).toBe(2);
  });

  it('Form.Subscribe rerenders only its own subtree', async () => {
    function Amount() {
      count('amount-subtree');
      return null;
    }
    renderModern(
      <>
        <Field name="amount" />
        <Field name="other" />
        <FormSubscribe
          selector={(state) => (state.values as Record<string, unknown>).amount}
        >
          {(amount) => (
            <>
              <span data-qa="mirror">{String(amount ?? '')}</span>
              <Amount />
            </>
          )}
        </FormSubscribe>
      </>,
    );
    // `fireEvent.change` keeps focus where it is: moving focus with
    // `userEvent.type` would blur the other field, and blur validation is a
    // legitimate status change (and rerender) of that field.
    const before = snapshot();
    act(() => {
      fireEvent.change(screen.getByTestId('input-other'), {
        target: { value: 'x' },
      });
    });
    expect(since(before)).toEqual({ 'field:other': 1 });

    const before2 = snapshot();
    act(() => {
      fireEvent.change(screen.getByTestId('input-amount'), {
        target: { value: '5' },
      });
    });
    expect(since(before2)).toEqual({ 'field:amount': 1, 'amount-subtree': 1 });
    expect(screen.getByTestId('mirror').textContent).toBe('5');
  });

  it('Strict Mode leaves exactly one registration per field and seeds a field default once', () => {
    const { controller, unmount } = renderModern(
      <Field name="a" defaultValue="d" />,
      {
        strict: true,
      },
    );
    expect(controller.getSnapshot().fields.a.registrationCount).toBe(1);
    expect(controller.getSnapshot().values).toEqual({ a: 'd' });
    expect(controller.getSnapshot().defaultValues).toEqual({ a: 'd' });
    expect(controller.debug.registrationCount()).toBe(1);
    unmount();
    expect(controller.debug.registrationCount()).toBe(0);
    expect(controller.debug.listenerCount()).toBe(0);
  });

  it('conditional unmount keeps the retained value out of active values; remount restores it; preserve=false drops it', async () => {
    function Conditional({ preserve }: { preserve?: boolean }) {
      const [show, setShow] = useState(true);
      return (
        <>
          <button
            type="button"
            data-qa="toggle"
            onClick={() => setShow((v) => !v)}
          >
            toggle
          </button>
          {show ? <Field name="cond" preserve={preserve} /> : null}
        </>
      );
    }
    const { controller } = renderModern(<Conditional />);
    await act(async () => {
      await userEvent.type(screen.getByTestId('input-cond'), 'typed');
    });
    await act(async () => {
      await userEvent.click(screen.getByTestId('toggle'));
    });
    expect(controller.getSnapshot().values).toEqual({ cond: 'typed' });
    expect(controller.getSnapshot().activeValues).toEqual({});
    await act(async () => {
      await userEvent.click(screen.getByTestId('toggle'));
    });
    expect(controller.getSnapshot().activeValues).toEqual({ cond: 'typed' });
    expect((screen.getByTestId('input-cond') as HTMLInputElement).value).toBe(
      'typed',
    );

    const dropped = renderModern(<Conditional preserve={false} />);
    await act(async () => {
      await userEvent.type(dropped.getAllByTestId('input-cond')[1], 'gone');
    });
    await act(async () => {
      await userEvent.click(dropped.getAllByTestId('toggle')[1]);
    });
    expect(dropped.controller.getSnapshot().values).toEqual({});
  });

  it('duplicate registrations share the value and the field stays active until the last one unmounts', async () => {
    function Twice() {
      const [both, setBoth] = useState(true);
      return (
        <>
          <button type="button" data-qa="drop" onClick={() => setBoth(false)}>
            drop
          </button>
          <Field name="dup" />
          {both ? <Field name="dup" /> : null}
        </>
      );
    }
    const { controller } = renderModern(<Twice />);
    expect(controller.getSnapshot().fields.dup.registrationCount).toBe(2);
    await act(async () => {
      await userEvent.type(screen.getAllByTestId('input-dup')[0], 'v');
    });
    expect(
      screen
        .getAllByTestId('input-dup')
        .map((el) => (el as HTMLInputElement).value),
    ).toEqual(['v', 'v']);
    await act(async () => {
      await userEvent.click(screen.getByTestId('drop'));
    });
    expect(controller.getSnapshot().fields.dup.registrationCount).toBe(1);
    expect(controller.getSnapshot().fields.dup.active).toBe(true);
  });

  it('root callbacks: a mounted onSubmit wins over the controller default and is released with the root', async () => {
    const defaultSubmit = vi.fn();
    const rootSubmit = vi.fn();
    let controller!: FormController<any>;

    function Owner({
      withRoot,
      withCallback,
    }: {
      withRoot: boolean;
      withCallback: boolean;
    }) {
      controller = useFormController({
        callbacks: { onSubmit: defaultSubmit },
      });
      if (!withRoot) return null;
      return (
        <ModernForm
          controller={controller}
          onSubmit={withCallback ? rootSubmit : undefined}
        >
          <button type="submit">go</button>
        </ModernForm>
      );
    }

    const { rerender } = render(<Owner withRoot withCallback />);
    await act(async () => {
      await userEvent.click(screen.getByText('go'));
    });
    expect(rootSubmit).toHaveBeenCalledTimes(1);
    expect(defaultSubmit).not.toHaveBeenCalled();

    // Updating the prop to undefined removes the callback this root owned:
    // the controller default applies again.
    rerender(<Owner withRoot withCallback={false} />);
    await act(async () => {
      await userEvent.click(screen.getByText('go'));
    });
    expect(defaultSubmit).toHaveBeenCalledTimes(1);

    rerender(<Owner withRoot withCallback />);
    rerender(<Owner withRoot={false} withCallback />);
    await act(async () => {
      await controller.submit();
    });
    expect(defaultSubmit).toHaveBeenCalledTimes(2);
    expect(rootSubmit).toHaveBeenCalledTimes(1);
  });

  it('a second callback-owning root for one controller is a development error', () => {
    const onDevelopmentError = vi.fn();
    function Owner() {
      const controller = useFormController({ onDevelopmentError });
      return (
        <>
          <ModernForm controller={controller} onSubmit={() => {}} />
          <ModernForm controller={controller} onSubmit={() => {}} />
        </>
      );
    }
    render(<Owner />);
    expect(onDevelopmentError).toHaveBeenCalledTimes(1);
    expect(onDevelopmentError.mock.calls[0][0]).toMatch(/second Form root/);
  });

  it('a native action form is not intercepted; a JS form is', () => {
    const { controller } = renderModern(<button type="submit">go</button>, {
      rootProps: { action: '/oauth', method: 'post' },
    });
    const form = document.querySelector('form[action="/oauth"]')!;
    const event = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(controller.getSnapshot().isSubmitting).toBe(false);

    const js = renderModern(<button type="submit">go2</button>);
    const jsForm = js.container.querySelector('form')!;
    const jsEvent = new Event('submit', { bubbles: true, cancelable: true });
    jsForm.dispatchEvent(jsEvent);
    expect(jsEvent.defaultPrevented).toBe(true);
  });

  it('useFormControllerContext throws outside a modern root and useFormSelector rejects a legacy-looking object', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Orphan() {
      useFormControllerContext();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow(/modern <Form> root/);

    function Wrong() {
      useFormSelector({ getFieldValue() {} } as any, (state) => state.values);
      return null;
    }
    expect(() => render(<Wrong />)).toThrow(
      /requires a modern form controller/,
    );
    spy.mockRestore();
  });

  it('a field explicitly connected outside the root still subscribes to the controller', async () => {
    let controller!: FormController<any>;
    function Owner() {
      controller = useFormController();
      return (
        <>
          <ModernForm controller={controller}>
            <Field name="inside" />
          </ModernForm>
          <Field name="outside" controller={controller} />
        </>
      );
    }
    render(<Owner />);
    await act(async () => {
      await userEvent.type(screen.getByTestId('input-outside'), 'o');
    });
    expect(controller.getSnapshot().activeValues).toEqual({ outside: 'o' });
    act(() => controller.setValue('outside', 'programmatic'));
    expect(
      (screen.getByTestId('input-outside') as HTMLInputElement).value,
    ).toBe('programmatic');
  });

  it('inline rule arrays recreated by an unrelated parent rerender do not rerun or reset validation', async () => {
    const validator = vi.fn(async () => undefined);
    function Parent() {
      const [tick, setTick] = useState(0);
      return (
        <>
          <button
            type="button"
            data-qa="tick"
            onClick={() => setTick((t) => t + 1)}
          >
            {tick}
          </button>
          <Field
            name="a"
            validateTrigger="onChange"
            rules={[{ required: true }, { validator }]}
          />
        </>
      );
    }
    const { controller } = renderModern(<Parent />);
    await act(async () => {
      await userEvent.type(screen.getByTestId('input-a'), 'v');
    });
    await waitFor(() =>
      expect(controller.getSnapshot().fields.a.status).toBe('valid'),
    );
    expect(validator).toHaveBeenCalledTimes(1);
    const revision = controller.getSnapshot().fields.a.validationRevision;

    await act(async () => {
      await userEvent.click(screen.getByTestId('tick'));
      await userEvent.click(screen.getByTestId('tick'));
    });
    expect(validator).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot().fields.a.status).toBe('valid');
    expect(controller.getSnapshot().fields.a.validationRevision).toBe(revision);
  });

  it('async errors render as ReactNodes and blur-triggered validation shows them once', async () => {
    const { controller } = renderModern(
      <Field name="a" rules={[{ validator: async () => <b>Rich</b> }]} />,
    );
    await act(async () => {
      await userEvent.type(screen.getByTestId('input-a'), 'x');
      await userEvent.tab();
    });
    await waitFor(() =>
      expect(screen.getByTestId('error-a').innerHTML).toBe('<b>Rich</b>'),
    );
    expect(controller.getSnapshot().fields.a.status).toBe('invalid');
  });

  it('unmounting the owner disposes pending validation timers and listeners', async () => {
    const { controller, unmount } = renderModern(
      <Field
        name="a"
        validateTrigger="onChange"
        validationDelay={500}
        rules={[{ required: true }]}
      />,
    );
    await act(async () => {
      await userEvent.type(screen.getByTestId('input-a'), 'x');
    });
    expect(controller.debug.pendingTimerCount()).toBe(1);
    unmount();
    expect(controller.debug.pendingTimerCount()).toBe(0);
    expect(controller.debug.listenerCount()).toBe(0);
    expect(controller.debug.registrationCount()).toBe(0);
  });
});
