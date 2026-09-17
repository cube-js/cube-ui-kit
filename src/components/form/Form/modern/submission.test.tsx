import { act, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, StrictMode } from 'react';

import { TextInput } from '../../../fields/TextInput/TextInput';
import { Form } from '../index';

import { createFormController } from './controller';
import { SubmissionFixture } from './submission.fixture';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((yes) => {
    resolve = yes;
  });
  return { resolve, promise };
}

describe('modern root submission and validation', () => {
  it('binds current callbacks after commit, falls back to defaults, and submits from a native button', async () => {
    const initial = vi.fn();
    const first = vi.fn();
    const latest = vi.fn();
    const defaultChange = vi.fn();
    const rootChange = vi.fn();
    const form = createFormController({
      defaultValues: { value: 'seed' },
      onSubmit: initial,
      onValuesChange: defaultChange,
    });
    const view = render(
      <StrictMode>
        <SubmissionFixture
          form={form}
          onSubmit={first}
          onValuesChange={rootChange}
        />
      </StrictMode>,
    );
    await userEvent.click(view.getByRole('button', { name: 'Save' }));
    expect(first).toHaveBeenCalledExactlyOnceWith(
      { value: 'seed' },
      expect.objectContaining({ include: 'active' }),
    );
    view.rerender(
      <StrictMode>
        <SubmissionFixture
          form={form}
          onSubmit={latest}
          onValuesChange={rootChange}
        />
      </StrictMode>,
    );
    await userEvent.type(view.getByRole('textbox'), '!');
    expect(rootChange).toHaveBeenCalledTimes(1);
    expect(defaultChange).not.toHaveBeenCalled();
    await userEvent.click(view.getByRole('button', { name: 'Save' }));
    expect(latest).toHaveBeenCalledTimes(1);
    view.rerender(
      <StrictMode>
        <SubmissionFixture form={form} />
      </StrictMode>,
    );
    await userEvent.type(view.getByRole('textbox'), '?');
    expect(defaultChange).toHaveBeenCalledTimes(1);
    await userEvent.click(view.getByRole('button', { name: 'Save' }));
    expect(initial).toHaveBeenCalledTimes(1);
    expect(view.getByTestId('value')).toHaveTextContent('seed!?');
    view.unmount();
    act(() => form.setValue('value', 'after', { notify: true }));
    expect(defaultChange).toHaveBeenCalledTimes(2);
  });

  it('renders ReactNode rule errors, then revalidates an invalid field on change', async () => {
    const form = createFormController({ defaultValues: { value: '' } });
    const view = render(
      <Form form={form}>
        <TextInput
          name="value"
          label="Value"
          rules={[{ required: true, message: <strong>Enter a value</strong> }]}
          showValid
        />
        <Form.Submit>Save</Form.Submit>
      </Form>,
    );
    await userEvent.click(view.getByRole('button', { name: 'Save' }));
    expect(await view.findByText('Enter a value')).toBeInTheDocument();
    expect(view.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(view.getByRole('textbox'), 'v');
    await waitFor(() => expect(form.getSnapshot().isValid).toBe(true));
    expect(view.queryByText('Enter a value')).toBeNull();
    expect(
      view.container.querySelector(
        '[ruleskey],[errorpolicy],[validationdelay],[form]',
      ),
    ).toBeNull();
  });

  it('guards pending submits, shows failures, and resets through the helper', async () => {
    const pending = deferred();
    const onSubmit = vi.fn(async () => {
      await pending.promise;
      throw <span>Save failed</span>;
    });
    const form = createFormController({
      defaultValues: { value: 'seed' },
      onSubmit,
    });
    const view = render(<SubmissionFixture form={form} />);
    await userEvent.type(view.getByRole('textbox'), '!');
    await userEvent.click(view.getByRole('button', { name: 'Save' }));
    expect(view.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(await form.submit()).toEqual({
      status: 'ignored',
      reason: 'submitting',
    });
    await act(async () => pending.resolve());
    expect(await view.findByText('Save failed')).toBeInTheDocument();
    await userEvent.click(view.getByRole('button', { name: 'Reset' }));
    expect(view.getByRole('textbox')).toHaveValue('seed');
    expect(view.queryByText('Save failed')).toBeNull();
    expect(form.getSnapshot().isTouched).toBe(false);
  });

  it('cancels a pending root submission on unmount and allows preserved controller reuse', async () => {
    const pending = deferred();
    const onSubmit = vi.fn(() => pending.promise);
    const form = createFormController({
      defaultValues: { value: 'seed' },
      onSubmit,
    });
    const view = render(<SubmissionFixture form={form} />);
    let result!: ReturnType<typeof form.submit>;
    await act(async () => {
      result = form.submit();
    });
    view.unmount();
    expect(await result).toEqual({ status: 'stale' });
    expect(form.getSnapshot().isSubmitting).toBe(false);
    await act(async () => pending.resolve());
    const remounted = render(
      <SubmissionFixture form={form} onSubmit={() => {}} />,
    );
    await userEvent.click(remounted.getByRole('button', { name: 'Save' }));
    expect(form.getSnapshot().isValid).toBe(true);
  });

  it('keeps both action helpers disabled by the modern root provider', () => {
    const form = createFormController({ defaultValues: { value: 'seed' } });
    form.touch('value');
    const view = render(
      <Form form={form} isDisabled>
        <TextInput name="value" />
        <Form.Submit>Save</Form.Submit>
        <Form.Reset>Reset</Form.Reset>
      </Form>,
    );
    expect(view.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(view.getByRole('button', { name: 'Reset' })).toBeDisabled();
  });

  it('leaves OAuth-shaped native action/method submission uncancelled', () => {
    const onSubmit = vi.fn();
    const form = createFormController({ onSubmit });
    const ref = createRef<HTMLFormElement>();
    const view = render(
      <Form form={form} ref={ref} action="/oauth/callback" method="post">
        <input type="hidden" name="state" value="state-token" />
        <input type="hidden" name="code" value="authorization-code" />
        <button type="submit">Continue</button>
      </Form>,
    );
    const submit = new Event('submit', { bubbles: true, cancelable: true });
    act(() => ref.current!.dispatchEvent(submit));
    expect(submit.defaultPrevented).toBe(false);
    expect(ref.current).toHaveAttribute('method', 'post');
    expect(ref.current).toHaveAttribute('action', '/oauth/callback');
    const data = new FormData(ref.current!);
    expect(data.get('state')).toBe('state-token');
    expect(data.get('code')).toBe('authorization-code');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(form.getSnapshot().isSubmitting).toBe(false);
    view.unmount();
  });
});
