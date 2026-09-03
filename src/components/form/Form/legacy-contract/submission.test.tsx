import {
  act,
  fireEvent,
  render,
  renderWithForm,
  renderWithRoot,
  userEvent,
  waitFor,
} from '../../../../test/index';
import { Button } from '../../../actions/Button/Button';
import { TextInput } from '../../../fields/TextInput/TextInput';
import { Root } from '../../../Root';
import { Form, ResetButton, SubmitButton } from '../index';
import { CubeFormInstance, useForm } from '../use-form';

import { deferred, FieldProbe, tick } from './helpers';

vi.mock('../../../../_internal/hooks/use-warn');

/**
 * Legacy Form characterization — submission.
 *
 * Covers plan §7.1 items 24 (submission, validation failure, callback failure,
 * double submission), 25 (`Error` vs non-`Error` rejections), 26 (`onSubmitFailed`
 * timing), 27 (submit error clearing), 29 (native `action`/`method`, hidden
 * controls) and 32 (`SubmitButton`, `ResetButton`, `SubmitError`). The
 * `submit.test.tsx` and `submit-error.test.tsx` suites already cover the visible
 * behaviour; this file pins the instance-level contract.
 */

describe('legacy contract: submission flow (§7.1 #24)', () => {
  it('[frozen] submit() validates every registered field and skips onSubmit when validation fails', async () => {
    const onSubmit = vi.fn();
    const onSubmitFailed = vi.fn();
    const { formInstance } = renderWithForm(
      <>
        <FieldProbe name="a" rules={[{ required: true, message: 'A!' }]} />
        <FieldProbe name="b" rules={[{ required: true, message: 'B!' }]} />
      </>,
      { formProps: { onSubmit, onSubmitFailed } },
    );

    await act(async () => {
      await formInstance.submit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onSubmitFailed).not.toHaveBeenCalled();
    expect(formInstance.getFieldError('a')).toEqual(['A!']);
    expect(formInstance.getFieldError('b')).toEqual(['B!']);
    expect(formInstance.isSubmitting).toBe(false);
    expect(formInstance.submitError).toBeNull();
  });

  it('[frozen] onSubmit receives the nested getFormData() payload after validation passes', async () => {
    const onSubmit = vi.fn();
    const { formInstance } = renderWithForm(
      <>
        <FieldProbe name="user.name" />
        <FieldProbe name="active" />
      </>,
      {
        formProps: {
          onSubmit,
          defaultValues: { user: { name: 'Ann' }, active: true },
        },
      },
    );

    await act(async () => {
      await formInstance.submit();
    });

    expect(onSubmit).toHaveBeenCalledWith({
      user: { name: 'Ann' },
      active: true,
    });
  });

  it('[frozen] a second submit() while one is in flight is ignored', async () => {
    const gate = deferred<void>();
    const onSubmit = vi.fn(() => gate.promise);
    const { formInstance } = renderWithForm(<FieldProbe name="a" />, {
      formProps: { onSubmit },
    });

    let first!: Promise<unknown>;

    await act(async () => {
      first = formInstance.submit();
      // Let validation and the internal `timeout()` reach `onSubmit`.
      await tick(60);
    });

    expect(formInstance.isSubmitting).toBe(true);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    await act(async () => {
      await formInstance.submit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);

    await act(async () => {
      gate.resolve();
      await first;
    });

    expect(formInstance.isSubmitting).toBe(false);
  });
});

describe('legacy contract: submission failures (§7.1 #25–#27)', () => {
  it('[frozen] a non-Error rejection becomes submitError, calls onSubmitFailed and resolves submit()', async () => {
    const onSubmit = vi.fn(() => Promise.reject('Nope'));
    const onSubmitFailed = vi.fn();
    const { formInstance } = renderWithForm(<FieldProbe name="a" />, {
      formProps: { onSubmit, onSubmitFailed },
    });

    await act(async () => {
      await expect(formInstance.submit()).resolves.toBeUndefined();
    });

    expect(formInstance.submitError).toBe('Nope');
    expect(onSubmitFailed).toHaveBeenCalledWith('Nope');
    expect(formInstance.isSubmitting).toBe(false);
  });

  it('[frozen] an Error thrown by onSubmit becomes submitError, calls onSubmitFailed and rejects submit()', async () => {
    const error = new Error('Broken');
    const onSubmit = vi.fn(() => {
      throw error;
    });
    const onSubmitFailed = vi.fn();
    const { formInstance } = renderWithForm(<FieldProbe name="a" />, {
      formProps: { onSubmit, onSubmitFailed },
    });

    await act(async () => {
      await expect(formInstance.submit()).rejects.toBe(error);
    });

    expect(formInstance.submitError).toBe(error);
    expect(onSubmitFailed).toHaveBeenCalledWith(error);
    expect(formInstance.isSubmitting).toBe(false);
  });

  it('[frozen] onSubmitFailed is called while isSubmitting is still true and is not awaited', async () => {
    const never = deferred<void>();
    let submittingDuringCallback: boolean | undefined;
    const onSubmit = vi.fn(() => Promise.reject('Nope'));
    const { formInstance } = renderWithForm(<FieldProbe name="a" />, {
      formProps: {
        onSubmit,
        onSubmitFailed: () => {
          submittingDuringCallback = formInstance.isSubmitting;

          return never.promise;
        },
      },
    });

    await act(async () => {
      await formInstance.submit();
    });

    expect(submittingDuringCallback).toBe(true);
    expect(formInstance.isSubmitting).toBe(false);
  });

  it('[frozen] submitError clears when the next submit starts or on a user change, but not on a programmatic setFieldValue', async () => {
    const gate = deferred<void>();
    let calls = 0;
    const onSubmit = vi.fn(() => {
      calls++;

      return calls === 1 ? Promise.reject('Nope') : gate.promise;
    });
    const { formInstance } = renderWithForm(<FieldProbe name="a" />, {
      formProps: { onSubmit },
    });

    await act(async () => {
      await formInstance.submit();
    });

    expect(formInstance.submitError).toBe('Nope');

    await act(async () => {
      formInstance.setFieldValue('a', 'programmatic');
    });

    expect(formInstance.submitError).toBe('Nope');

    await act(async () => {
      formInstance.setFieldValue('a', 'user', true);
    });

    expect(formInstance.submitError).toBeNull();

    await act(async () => {
      formInstance.submitError = 'Manual';
      void formInstance.submit();
    });

    expect(formInstance.submitError).toBeNull();

    await act(async () => {
      gate.resolve();
      await tick(60);
    });
  });
});

describe('legacy contract: native submission (§7.1 #29)', () => {
  it('[frozen] <Form action method> attaches no submit handler: the event is not prevented and onSubmit never runs', async () => {
    const onSubmit = vi.fn();
    const { container } = renderWithRoot(
      <Form action="/oauth" method="post" onSubmit={onSubmit}>
        <TextInput name="a" label="A" />
        <input type="hidden" name="token" value="t" />
      </Form>,
    );
    const formElement = container.querySelector('form') as HTMLFormElement;

    expect(formElement).toHaveAttribute('action', '/oauth');
    expect(formElement).toHaveAttribute('method', 'post');

    const notPrevented = fireEvent.submit(formElement);

    await act(async () => {
      await tick(60);
    });

    expect(notPrevented).toBe(true);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('[frozen] without action, the submit event is prevented and routed through validation to onSubmit', async () => {
    const onSubmit = vi.fn();
    const { container } = renderWithRoot(
      <Form onSubmit={onSubmit} defaultValues={{ a: 'x' }}>
        <TextInput name="a" label="A" />
      </Form>,
    );
    const formElement = container.querySelector('form') as HTMLFormElement;

    let notPrevented!: boolean;

    await act(async () => {
      notPrevented = fireEvent.submit(formElement);
    });

    expect(notPrevented).toBe(false);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ a: 'x' }));
  });

  it('[frozen] a submitter that is not type="submit" is ignored after the event is prevented', async () => {
    const onSubmit = vi.fn();
    const { container, getByRole } = renderWithRoot(
      <Form onSubmit={onSubmit}>
        <TextInput name="a" label="A" />
        <Button type="secondary" htmlType="button">
          Other
        </Button>
      </Form>,
    );
    const formElement = container.querySelector('form') as HTMLFormElement;
    const event = new SubmitEvent('submit', {
      bubbles: true,
      cancelable: true,
      submitter: getByRole('button', { name: 'Other' }),
    });

    let notPrevented!: boolean;

    await act(async () => {
      notPrevented = formElement.dispatchEvent(event);
      await tick(60);
    });

    expect(notPrevented).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('[frozen] hidden native inputs are part of the browser FormData but never become fields', () => {
    const { container, formInstance } = renderWithForm(
      <>
        <TextInput name="a" label="A" />
        <input type="hidden" name="token" value="t" />
      </>,
    );
    const formElement = container.querySelector('form') as HTMLFormElement;

    expect(formInstance.getFieldNames()).toEqual(['a']);
    expect(new FormData(formElement).get('token')).toBe('t');
  });

  it('[frozen] only action, autoComplete, encType, method and target reach the <form> element', () => {
    const { container } = renderWithRoot(
      <Form
        action="/x"
        method="post"
        encType="multipart/form-data"
        target="_self"
        autoComplete="off"
        onValuesChange={() => {}}
        defaultValues={{}}
        labelPosition="side"
      >
        <TextInput name="a" label="A" />
      </Form>,
    );
    const formElement = container.querySelector('form') as HTMLFormElement;

    expect(formElement).toHaveAttribute('enctype', 'multipart/form-data');
    expect(formElement).toHaveAttribute('target', '_self');
    expect(formElement).toHaveAttribute('autocomplete', 'off');
    expect(formElement).toHaveAttribute('novalidate');
    expect(formElement).not.toHaveAttribute('labelposition');
    expect(formElement).not.toHaveAttribute('defaultvalues');
  });
});

describe('legacy contract: helper components (§7.1 #32)', () => {
  it('[frozen] SubmitButton is disabled while the form is invalid and while a submission is in flight', async () => {
    const gate = deferred<void>();
    const onSubmit = vi.fn(() => gate.promise);
    const { formInstance, getByRole } = renderWithForm(
      <>
        <TextInput
          name="a"
          label="A"
          rules={[{ required: true, message: 'Required' }]}
        />
        <SubmitButton>Submit</SubmitButton>
      </>,
      { formProps: { onSubmit } },
    );
    const button = getByRole('button', { name: 'Submit' });

    expect(button).toBeEnabled();

    await act(async () => {
      await formInstance.validateField('a').catch(() => {});
    });

    expect(button).toBeDisabled();

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'x');
    });

    await waitFor(() => expect(button).toBeEnabled());

    await act(async () => {
      await userEvent.click(button);
    });

    await waitFor(() => expect(formInstance.isSubmitting).toBe(true));
    expect(button).toBeDisabled();

    await act(async () => {
      gate.resolve();
      await tick(60);
    });

    expect(formInstance.isSubmitting).toBe(false);
    expect(button).toBeEnabled();
  });

  it('[frozen] SubmitButton and ResetButton accept an explicit form prop outside <Form>', async () => {
    let form!: CubeFormInstance<any>;

    function Owner() {
      [form] = useForm();

      return (
        <Root>
          <Form form={form}>
            <TextInput name="a" label="A" />
          </Form>
          <SubmitButton form={form}>Submit</SubmitButton>
          <ResetButton form={form}>Reset</ResetButton>
        </Root>
      );
    }

    const { getByRole } = render(<Owner />);
    const submit = getByRole('button', { name: 'Submit' });
    const reset = getByRole('button', { name: 'Reset' });

    expect(submit).toBeEnabled();
    expect(reset).toBeDisabled();

    await act(async () => {
      form.setFieldError('a', 'Bad');
    });

    expect(submit).toBeDisabled();

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'x');
    });

    expect(reset).toBeEnabled();
    expect(submit).toBeEnabled();
  });

  it('[frozen] ResetButton resets on the next tick and is disabled until the form is touched', async () => {
    const { formInstance, getByRole } = renderWithForm(
      <>
        <TextInput name="a" label="A" />
        <ResetButton>Reset</ResetButton>
      </>,
      { formProps: { defaultValues: { a: 'seed' } } },
    );
    const reset = getByRole('button', { name: 'Reset' });

    expect(reset).toBeDisabled();

    await act(async () => {
      await userEvent.type(getByRole('textbox'), '!');
    });

    expect(reset).toBeEnabled();

    await act(async () => {
      await userEvent.click(reset);
    });

    await waitFor(() => expect(formInstance.getFieldValue('a')).toBe('seed'));
    expect(formInstance.isTouched).toBe(false);
    expect(reset).toBeDisabled();
  });
});
