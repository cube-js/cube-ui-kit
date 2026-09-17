import { act, render } from '@testing-library/react';
import { createRef, memo, StrictMode, useContext } from 'react';

import { TextInput } from '../../../fields/TextInput/TextInput';
import {
  FormContext,
  FormPresentationContext,
  FormScopeMask,
  useFormProps,
} from '../Form';
import { Form } from '../index';
import { RenderErrorBoundary } from '../legacy-contract/helpers';

import { ModernControllerContext } from './context';
import { createFormController, getControllerInternals } from './controller';

import type { FormController } from './controller';

function silenceErrors() {
  vi.spyOn(console, 'error').mockImplementation(() => {});
}

afterEach(() => vi.restoreAllMocks());

describe('modern Form root and subscriptions', () => {
  it('exposes the controller and renders only the selected subtree', () => {
    const owner = vi.fn();
    const presentationReads = vi.fn();
    const child = vi.fn();
    let form!: FormController<{ a: number; b: number }>;
    const Presentation = memo(function Presentation() {
      presentationReads(useContext(FormPresentationContext));
      return null;
    });
    function ContextRead() {
      expect(Form.useControllerContext()).toBe(form);
      expect(useContext(FormContext)).toEqual({});
      return (
        <Form.Subscribe selector={(state) => state.values.a}>
          {(a) => {
            child(a);
            return <span>{String(a)}</span>;
          }}
        </Form.Subscribe>
      );
    }
    function Owner() {
      owner();
      form = Form.useController({ defaultValues: { a: 1, b: 1 } });
      return (
        <Form form={form}>
          <Presentation />
          <ContextRead />
        </Form>
      );
    }
    const view = render(<Owner />);
    owner.mockClear();
    presentationReads.mockClear();
    child.mockClear();
    act(() => form.setValue('b', 2));
    expect(child).not.toHaveBeenCalled();
    act(() => form.setValue('a', 2));
    expect(view.getByText('2')).toBeInTheDocument();
    expect(child).toHaveBeenCalledExactlyOnceWith(2);
    expect(owner).not.toHaveBeenCalled();
    expect(presentationReads).not.toHaveBeenCalled();
    view.unmount();
    expect(
      getControllerInternals(form, 'test').store.debug.listenerCount(),
    ).toBe(0);
  });

  it('uses explicit controllers outside a root and ahead of context', () => {
    const context = createFormController({ defaultValues: { a: 1 } });
    const explicit = createFormController({ defaultValues: { a: 2 } });
    const view = render(
      <Form form={context}>
        <Form.Subscribe form={explicit} selector={(state) => state.values.a}>
          {(a) => <span>{a}</span>}
        </Form.Subscribe>
      </Form>,
    );
    expect(view.getByText('2')).toBeInTheDocument();
    view.rerender(
      <Form.Subscribe form={explicit} selector={(state) => state.values.a}>
        {(a) => <span>{a}</span>}
      </Form.Subscribe>,
    );
    act(() => explicit.setValue('a', 3));
    expect(view.getByText('3')).toBeInTheDocument();
  });

  it('honors equality for allocating Subscribe selections', () => {
    const form = createFormController({ defaultValues: { a: 1, b: 1 } });
    const child = vi.fn((value: { a: number | undefined }) => (
      <span>{value.a}</span>
    ));
    render(
      <Form.Subscribe
        form={form}
        selector={(state) => ({ a: state.values.a })}
        isEqual={(a, b) => a.a === b.a}
      >
        {child}
      </Form.Subscribe>,
    );
    child.mockClear();
    act(() => form.setValue('b', 2));
    expect(child).not.toHaveBeenCalled();
  });

  it('switches context controllers without retaining old listeners', () => {
    const a = createFormController({ defaultValues: { a: 1 } });
    const b = createFormController({ defaultValues: { a: 2 } });
    const child = (
      <Form.Subscribe selector={(state) => state.values.a}>
        {(value) => <span>{String(value)}</span>}
      </Form.Subscribe>
    );
    const view = render(<Form form={a}>{child}</Form>);
    view.rerender(<Form form={b}>{child}</Form>);
    expect(view.getByText('2')).toBeInTheDocument();
    expect(getControllerInternals(a, 'test').store.debug.listenerCount()).toBe(
      0,
    );
    view.unmount();
    expect(getControllerInternals(b, 'test').store.debug.listenerCount()).toBe(
      0,
    );
  });

  it('retains stable context on parent rerenders and forwards the DOM ref', () => {
    const form = createFormController({ defaultValues: { a: 1 } });
    const ref = createRef<HTMLFormElement>();
    const read = vi.fn();
    const Child = memo(function Child() {
      read(useContext(FormPresentationContext));
      return null;
    });
    const view = render(
      <Form form={form} ref={ref} name="profile" orientation="horizontal">
        <Child />
      </Form>,
    );
    expect(ref.current?.tagName).toBe('FORM');
    expect(read.mock.lastCall?.[0]).toMatchObject({
      idPrefix: 'profile',
      orientation: 'horizontal',
      labelPosition: 'side',
    });
    read.mockClear();
    view.rerender(
      <Form form={form} ref={ref} name="profile" orientation="horizontal">
        <Child />
      </Form>,
    );
    expect(read).not.toHaveBeenCalled();
  });

  it('survives Strict Mode with one context subscription', () => {
    const form = createFormController({ defaultValues: { a: 1 } });
    const view = render(
      <StrictMode>
        <Form form={form}>
          <Form.Subscribe selector={(state) => state.values.a}>
            {(a) => <span>{String(a)}</span>}
          </Form.Subscribe>
        </Form>
      </StrictMode>,
    );
    expect(
      getControllerInternals(form, 'test').store.debug.listenerCount(),
    ).toBe(1);
    act(() => form.setValue('a', 2));
    expect(view.getByText('2')).toBeInTheDocument();
    view.unmount();
    expect(
      getControllerInternals(form, 'test').store.debug.listenerCount(),
    ).toBe(0);
  });

  it('masks the modern controller in groups and nested legacy roots', () => {
    const form = createFormController({ defaultValues: { a: 1 } });
    const reads: unknown[] = [];
    function Read() {
      reads.push(useContext(ModernControllerContext));
      return null;
    }
    const view = render(
      <ModernControllerContext.Provider value={form}>
        <FormScopeMask value={{}}>
          <Read />
        </FormScopeMask>
        <Form>
          <Read />
        </Form>
      </ModernControllerContext.Provider>,
    );
    expect(reads).toEqual([null, null]);
    view.unmount();
  });

  it('rejects named inputs until modern field binding lands, while detached inputs work', () => {
    silenceErrors();
    const form = createFormController({ defaultValues: { a: 'value' } });
    const view = render(
      <Form form={form}>
        <RenderErrorBoundary>
          <TextInput name="a" />
        </RenderErrorBoundary>
        <TextInput name="b" form={undefined} aria-label="detached" />
      </Form>,
    );
    expect(view.getByTestId('render-error')).toHaveTextContent(
      /modern input binding is not available/i,
    );
    expect(view.getByRole('textbox', { name: 'detached' })).toBeInTheDocument();
  });

  it('keeps explicit legacy input overrides ahead of modern context', () => {
    const modern = createFormController({ defaultValues: { a: 1 } });
    let observed: unknown;
    function Read() {
      const [legacy] = Form.useForm();
      observed = useFormProps({ form: legacy }).form;
      expect(observed).toBe(legacy);
      return null;
    }
    render(
      <Form form={modern}>
        <Read />
      </Form>,
    );
    expect(observed).not.toBe(modern);
  });

  it.each(['outside', 'legacy', 'masked', 'detached'] as const)(
    'rejects contextual Subscribe when %s',
    (scope) => {
      silenceErrors();
      const form = createFormController({ defaultValues: { a: 1 } });
      const subscription = (
        <RenderErrorBoundary>
          <Form.Subscribe
            {...(scope === 'detached' ? { form: undefined } : {})}
            selector={(state) => state.isDirty}
          >
            {String}
          </Form.Subscribe>
        </RenderErrorBoundary>
      );
      const tree =
        scope === 'outside' ? (
          subscription
        ) : scope === 'legacy' ? (
          <Form>{subscription}</Form>
        ) : (
          <Form form={form}>
            {scope === 'masked' ? (
              <FormScopeMask value={{}}>{subscription}</FormScopeMask>
            ) : (
              subscription
            )}
          </Form>
        );
      expect(render(tree).getByTestId('render-error')).toHaveTextContent(
        /Form.Subscribe.*requires a modern/,
      );
    },
  );

  it('rejects modern context access under a legacy root', () => {
    silenceErrors();
    function Read() {
      Form.useControllerContext();
      return null;
    }
    const view = render(
      <Form>
        <RenderErrorBoundary>
          <Read />
        </RenderErrorBoundary>
      </Form>,
    );
    expect(view.getByTestId('render-error')).toHaveTextContent(
      /requires a modern <Form>/,
    );
  });

  it.each([
    { defaultValues: { a: 2 } },
    { onSubmit: () => {} },
    { onValuesChange: () => {} },
  ])('rejects unsupported modern root props: %j', (props) => {
    silenceErrors();
    const form = createFormController({ defaultValues: { a: 1 } });
    const view = render(
      <RenderErrorBoundary>
        <Form {...(props as {})} form={form} />
      </RenderErrorBoundary>,
    );
    expect(view.getByTestId('render-error')).toBeInTheDocument();
    expect(form.getValue('a')).toBe(1);
  });

  it('prevents accidental navigation without action and leaves native action untouched', () => {
    const form = createFormController();
    const ref = createRef<HTMLFormElement>();
    const view = render(<Form form={form} ref={ref} />);
    const submit = new Event('submit', { bubbles: true, cancelable: true });
    // Inspect cancellation without asking jsdom to perform native navigation.
    act(() => ref.current!.dispatchEvent(submit));
    expect(submit.defaultPrevented).toBe(true);
    view.rerender(
      <Form form={form} ref={ref} action="/native" method="post" />,
    );
    const native = new Event('submit', { bubbles: true, cancelable: true });
    act(() => ref.current!.dispatchEvent(native));
    expect(native.defaultPrevented).toBe(false);
    expect(ref.current).toHaveAttribute('action', '/native');
  });
});
