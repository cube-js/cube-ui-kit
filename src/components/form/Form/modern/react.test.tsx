import { act, render, renderHook } from '@testing-library/react';
import {
  memo,
  startTransition,
  StrictMode,
  Suspense,
  useLayoutEffect,
  useState,
} from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';

import { CubeFormInstance } from '../use-form';

import { createFormController, getControllerInternals } from './controller';
import { useFormController, useFormSelector } from './react';

import type { FormController } from './controller';

describe('modern React creation and selection', () => {
  it('seeds defaults once and commits fresh creation callbacks', () => {
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();
    const { result, rerender } = renderHook(
      ({ value, callback }) => {
        const form = useFormController({
          defaultValues: { a: value },
          onValuesChange: callback,
        });
        const selected = useFormSelector(form, (state) => state.values.a);
        return { form, selected };
      },
      { initialProps: { value: 1, callback: firstCallback } },
    );
    const initial = result.current.form;
    expect(result.current.selected).toBe(1);
    act(() => initial.setValue('a', 2));
    rerender({ value: 3, callback: secondCallback });
    expect(result.current.form).toBe(initial);
    expect(result.current.selected).toBe(2);
    expect(initial.getSnapshot().defaultValues.a).toBe(1);
    act(() => initial.setValue('a', 4, { source: 'user' }));
    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledTimes(1);
  });

  it('does not rerender the creator or an unchanged selection', () => {
    const owner = vi.fn();
    const subscriber = vi.fn();
    let form!: FormController<{ a: number; b: number }>;
    function Selection({ controller }: { controller: typeof form }) {
      subscriber(useFormSelector(controller, (state) => state.values.a));
      return null;
    }
    function Owner() {
      owner();
      form = useFormController({ defaultValues: { a: 1, b: 1 } });
      return <Selection controller={form} />;
    }
    render(<Owner />);
    owner.mockClear();
    subscriber.mockClear();
    act(() => form.setValue('b', 2));
    expect(owner).not.toHaveBeenCalled();
    expect(subscriber).not.toHaveBeenCalled();
    act(() => form.setValue('a', 2));
    expect(owner).not.toHaveBeenCalled();
    expect(subscriber).toHaveBeenCalledExactlyOnceWith(2);
  });

  it('caches allocating selections with equality and never loops without it', () => {
    const form = createFormController({ defaultValues: { a: 1, b: 1 } });
    const renders = vi.fn();
    const { result } = renderHook(() => {
      const selected = useFormSelector(
        form,
        (state) => ({ a: state.values.a }),
        { isEqual: (a, b) => a.a === b.a },
      );
      renders();
      return selected;
    });
    const first = result.current;
    act(() => form.setValue('b', 2));
    expect(result.current).toBe(first);
    expect(renders).toHaveBeenCalledTimes(1);
    const allocating = renderHook(() =>
      useFormSelector(form, (state) => ({ b: state.values.b })),
    );
    act(() => form.setValue('b', 3));
    expect(allocating.result.current).toEqual({ b: 3 });
  });

  it('reselects changed closures and equality functions without a store update', () => {
    const form = createFormController({ defaultValues: { a: 1, b: 2 } });
    const { result, rerender } = renderHook(
      ({ name, equal }) =>
        useFormSelector(form, (state) => state.values[name], {
          isEqual: equal,
        }),
      {
        initialProps: {
          name: 'a' as 'a' | 'b',
          equal: (_a: unknown, _b: unknown) => true,
        },
      },
    );
    rerender({ name: 'b', equal: Object.is });
    expect(result.current).toBe(2);
    rerender({ name: 'a', equal: Object.is });
    expect(result.current).toBe(1);
  });

  it('switches controllers and releases only the old subscription', () => {
    const first = createFormController({ defaultValues: { a: 1 } });
    const second = createFormController({ defaultValues: { a: 2 } });
    const firstStore = getControllerInternals(first, 'test').store;
    const secondStore = getControllerInternals(second, 'test').store;
    const { result, rerender, unmount } = renderHook(
      ({ form }) => useFormSelector(form, (state) => state.values.a),
      { initialProps: { form: first } },
    );
    expect(firstStore.debug.listenerCount()).toBe(1);
    rerender({ form: second });
    expect(result.current).toBe(2);
    expect(firstStore.debug.listenerCount()).toBe(0);
    expect(secondStore.debug.listenerCount()).toBe(1);
    act(() => first.setValue('a', 10));
    expect(result.current).toBe(2);
    act(() => second.setValue('a', 20));
    expect(result.current).toBe(20);
    unmount();
    expect(secondStore.debug.listenerCount()).toBe(0);
  });

  it('catches a write between render and subscription', () => {
    const form = createFormController({ defaultValues: { a: 1 } });
    function ChangeBeforeSubscription() {
      useLayoutEffect(() => form.setValue('a', 2), []);
      return null;
    }
    function Read() {
      return <span>{useFormSelector(form, (state) => state.values.a)}</span>;
    }
    const view = render(
      <>
        <ChangeBeforeSubscription />
        <Read />
      </>,
    );
    expect(view.getByText('2')).toBeInTheDocument();
  });

  it('publishes a batch as one coherent selection', () => {
    const form = createFormController({ defaultValues: { a: 1, b: 1 } });
    const reads = vi.fn();
    renderHook(() => reads(useFormSelector(form, (state) => state.values)));
    reads.mockClear();
    act(() =>
      form.batch(() => {
        form.setValue('a', 2);
        form.setValue('b', 3);
      }),
    );
    expect(reads).toHaveBeenCalledExactlyOnceWith({ a: 2, b: 3 });
  });

  it('survives Strict Mode effect replay and removes every listener on unmount', () => {
    const { result, unmount } = renderHook(
      () => {
        const form = useFormController({ defaultValues: { a: 1 } });
        return {
          form,
          value: useFormSelector(form, (state) => state.values.a),
        };
      },
      { wrapper: StrictMode },
    );
    const form = result.current.form;
    const store = getControllerInternals(form, 'test').store;
    expect(store.debug.listenerCount()).toBe(1);
    act(() => form.setValue('a', 2));
    expect(result.current.value).toBe(2);
    unmount();
    expect(store.debug.listenerCount()).toBe(0);
    expect(store.debug.registrationCount()).toBe(0);
  });

  it('does not install subscriptions for a render abandoned by Suspense', () => {
    const form = createFormController({ defaultValues: { a: 1 } });
    const store = getControllerInternals(form, 'test').store;
    function Suspended(): never {
      useFormSelector(form, (state) => state.values.a);
      throw new Promise(() => {});
    }
    const view = render(
      <Suspense fallback="waiting">
        <Suspended />
      </Suspense>,
    );
    expect(view.getByText('waiting')).toBeInTheDocument();
    expect(store.debug.listenerCount()).toBe(0);
    view.unmount();
    expect(store.debug.listenerCount()).toBe(0);
  });

  it('reconnects after a committed selector subtree is hidden and revealed', () => {
    const form = createFormController({ defaultValues: { a: 1 } });
    let setHidden!: (hidden: boolean) => void;
    function Read({ hidden }: { hidden: boolean }) {
      const value = useFormSelector(form, (state) => state.values.a);
      if (hidden) throw new Promise(() => {});
      return <span>{value}</span>;
    }
    function Owner() {
      const [hidden, update] = useState(false);
      setHidden = update;
      return (
        <Suspense fallback="waiting">
          <Read hidden={hidden} />
        </Suspense>
      );
    }
    const view = render(<Owner />);
    act(() => setHidden(true));
    act(() => form.setValue('a', 2));
    act(() => setHidden(false));
    expect(view.getByText('2')).toBeVisible();
    view.unmount();
    expect(
      getControllerInternals(form, 'test').store.debug.listenerCount(),
    ).toBe(0);
  });

  it('rejects a legacy instance with an actionable error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() =>
        renderHook(() =>
          useFormSelector(
            new CubeFormInstance() as unknown as FormController,
            (state) => state.isDirty,
          ),
        ),
      ).toThrow(/Form.useController/);
    } finally {
      error.mockRestore();
    }
  });

  it('does not let a suspended selector replacement contaminate the committed selection', async () => {
    const form = createFormController({ defaultValues: { a: 1, b: 2 } });
    let changeName!: (name: 'a' | 'b') => void;
    function Read({ name }: { name: 'a' | 'b' }) {
      const value = useFormSelector(form, (state) => state.values[name]);
      if (name === 'b') throw new Promise(() => {});
      return <span>{value}</span>;
    }
    function Owner() {
      const [name, setName] = useState<'a' | 'b'>('a');
      changeName = setName;
      return (
        <Suspense fallback="waiting">
          <Read name={name} />
        </Suspense>
      );
    }
    const view = render(<Owner />);
    await act(async () => startTransition(() => changeName('b')));
    expect(view.getByText('1')).toBeVisible();
    act(() => form.setValue('a', 3));
    expect(view.getByText('3')).toBeVisible();
    view.unmount();
    expect(
      getControllerInternals(form, 'test').store.debug.listenerCount(),
    ).toBe(0);
  });
});

describe('modern selector server snapshots', () => {
  it('keeps hook-created server controllers isolated between requests', () => {
    function Server({ value }: { value: string }) {
      const form = useFormController({ defaultValues: { value } });
      return (
        <span>{useFormSelector(form, (state) => state.values.value)}</span>
      );
    }
    expect(renderToString(<Server value="first" />)).toBe('<span>first</span>');
    expect(renderToString(<Server value="second" />)).toBe(
      '<span>second</span>',
    );
  });
  it('renders creation defaults on the server without subscribing', () => {
    const form = createFormController({ defaultValues: { a: 'server' } });
    function Read() {
      return <span>{useFormSelector(form, (state) => state.values.a)}</span>;
    }
    expect(renderToString(<Read />)).toBe('<span>server</span>');
    expect(
      getControllerInternals(form, 'test').store.debug.listenerCount(),
    ).toBe(0);
  });

  it('hydrates from the server seed, then catches an intervening client write', async () => {
    const form = createFormController({ defaultValues: { a: 'server' } });
    const Read = memo(function Read() {
      return <span>{useFormSelector(form, (state) => state.values.a)}</span>;
    });
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Read />);
    document.body.append(container);
    form.setValue('a', 'client');
    const onRecoverableError = vi.fn();
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, <Read />, { onRecoverableError });
    });
    expect(container.textContent).toBe('client');
    expect(onRecoverableError).not.toHaveBeenCalled();
    act(() => root.unmount());
    container.remove();
    expect(
      getControllerInternals(form, 'test').store.debug.listenerCount(),
    ).toBe(0);
  });
});
