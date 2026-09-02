import { render } from '@testing-library/react';
import { Component, ReactNode, StrictMode } from 'react';

import { Root } from '../../../Root';
import { CubeFormProps, Form } from '../Form';
import { useFieldProps } from '../use-field/use-field-props';
import { CubeFormInstance, useForm } from '../use-form';

/**
 * Shared fixtures for the legacy Form characterization suite. Everything here
 * exists to *observe* the legacy engine, never to change it.
 */

export interface Deferred<T = void> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

/** A promise whose settlement the test controls. */
export function deferred<T = void>(): Deferred<T> {
  let resolve!: Deferred<T>['resolve'];
  let reject!: Deferred<T>['reject'];

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  // A deferred the test forgets to settle would otherwise surface as an
  // unhandled rejection in an unrelated spec.
  promise.catch(() => {});

  return { promise, resolve, reject };
}

export function tick(ms = 0) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Counts renders of named subtrees. `count(id)` is called from a component
 * body; `Counted` wraps a subtree so its parent-driven renders are counted
 * without counting the wrapped component's own internal state updates.
 */
export function createRenderCounter() {
  const counts: Record<string, number> = {};

  function count(id: string) {
    counts[id] = (counts[id] ?? 0) + 1;
  }

  function Counted({ id, children }: { id: string; children?: ReactNode }) {
    count(id);

    return <>{children}</>;
  }

  return {
    counts,
    count,
    Counted,
    snapshot(): Record<string, number> {
      return { ...counts };
    },
    /** Render counts accumulated since `before` was taken. */
    since(before: Record<string, number>): Record<string, number> {
      const delta: Record<string, number> = {};

      for (const key of new Set([
        ...Object.keys(before),
        ...Object.keys(counts),
      ])) {
        delta[key] = (counts[key] ?? 0) - (before[key] ?? 0);
      }

      return delta;
    },
  };
}

export type RenderCounter = ReturnType<typeof createRenderCounter>;

export interface FieldProbeProps {
  name?: string;
  form?: CubeFormInstance<any> | null;
  defaultValue?: unknown;
  rules?: any[];
  validateTrigger?: 'onBlur' | 'onChange' | 'onSubmit';
  validationDelay?: number;
  /** Value emitted by the probe's change button, when rendered. */
  next?: unknown;
  qa?: string;
}

/**
 * The smallest possible form-attachable control. It registers through
 * `useFieldProps` exactly like the shipped inputs and renders its value as JSON
 * so tests can watch non-string values (objects, arrays, `null`) without an
 * input's own value coercion getting in the way.
 */
export function FieldProbe(props: FieldProbeProps) {
  const { next, qa, ...fieldInput } = props;
  const resolved: any = useFieldProps(fieldInput as any, {
    defaultValidationTrigger: 'onChange',
  });
  const { value, onChange, id, isInvalid, errorMessage } = resolved;
  const testId = qa ?? `probe-${props.name ?? 'standalone'}`;

  return (
    <>
      <span
        id={id}
        data-qa={testId}
        data-invalid={isInvalid ? 'true' : undefined}
      >
        {value === undefined ? '<undefined>' : JSON.stringify(value)}
      </span>
      {errorMessage != null ? (
        <span data-qa={`${testId}-error`}>{errorMessage}</span>
      ) : null}
      {next !== undefined ? (
        <button
          type="button"
          data-qa={`${testId}-change`}
          onClick={() => onChange?.(next)}
        >
          change
        </button>
      ) : null}
    </>
  );
}

export interface RenderOwnedFormOptions {
  formProps?: Partial<Omit<CubeFormProps, 'form' | 'children'>>;
  counter?: RenderCounter;
  strict?: boolean;
}

/**
 * Renders a component that *owns* a form created with `useForm()` and passes
 * it down to `<Form>`, which is how Cloud creates most of its forms. Children
 * are produced by a render function so every owner render recreates the
 * element tree, as real call sites do.
 */
export function renderOwnedForm(
  renderChildren: (form: CubeFormInstance<any>) => ReactNode,
  options: RenderOwnedFormOptions = {},
) {
  const { formProps, counter, strict = false } = options;

  let formInstance!: CubeFormInstance<any>;

  function Owner(props: { formProps?: RenderOwnedFormOptions['formProps'] }) {
    const [form] = useForm();

    formInstance = form;
    counter?.count('owner');

    return (
      <Root>
        <Form {...props.formProps} form={form}>
          {renderChildren(form)}
        </Form>
      </Root>
    );
  }

  const ui = (props: RenderOwnedFormOptions['formProps']) =>
    strict ? (
      <StrictMode>
        <Owner formProps={props} />
      </StrictMode>
    ) : (
      <Owner formProps={props} />
    );

  const result = render(ui(formProps));

  return {
    ...result,
    get formInstance() {
      return formInstance;
    },
    /** Rerender the owner, optionally with new `<Form>` props. */
    rerenderOwner(
      nextFormProps: RenderOwnedFormOptions['formProps'] = formProps,
    ) {
      result.rerender(ui(nextFormProps));
    },
  };
}

interface BoundaryState {
  message: string | null;
}

/** Catches a render error and prints its message so a test can assert on it. */
export class RenderErrorBoundary extends Component<
  { children: ReactNode },
  BoundaryState
> {
  state: BoundaryState = { message: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { message: error.message };
  }

  render() {
    if (this.state.message != null) {
      return <div data-qa="render-error">{this.state.message}</div>;
    }

    return this.props.children;
  }
}
