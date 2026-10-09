import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';

import {
  ControlledConsumer,
  DialogConsumer,
  ImplicitConsumer,
  LegacyConsumer,
  ModernConsumer,
} from './consumer';

it('updates modern tuple fields and selectors, submits once, and resets nullable defaults', async () => {
  const firstSubmit = vi.fn();
  const latestSubmit = vi.fn();
  const { rerender } = render(
    <StrictMode>
      <ModernConsumer onSubmit={firstSubmit} />
    </StrictMode>,
  );
  const name = screen.getByRole('textbox', { name: 'Name' });
  expect(name).toHaveValue('');
  await userEvent.type(name, 'Alice');
  await userEvent.click(screen.getByRole('checkbox', { name: 'Enabled' }));
  expect(screen.getByRole('status')).toHaveTextContent('Alice');
  rerender(
    <StrictMode>
      <ModernConsumer onSubmit={latestSubmit} />
    </StrictMode>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(latestSubmit).toHaveBeenCalledTimes(1));
  expect(latestSubmit.mock.calls[0][0]).toEqual({
    profile: { name: 'Alice' },
    enabled: true,
  });
  expect(firstSubmit).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
  expect(name).toHaveValue('');
  expect(screen.getByRole('checkbox')).not.toBeChecked();
  expect(screen.getByRole('status')).toHaveTextContent('Empty');
});

it('preserves mutable legacy reads, programmatic updates, and reset', async () => {
  const submit = vi.fn();
  render(<LegacyConsumer onSubmit={submit} />);
  const name = screen.getByRole('textbox', { name: 'Name' });
  await userEvent.type(name, ' edited');
  await userEvent.click(screen.getByRole('button', { name: 'Set name' }));
  expect(name).toHaveValue('Programmatic');
  expect(screen.getByRole('status')).toHaveTextContent('Programmatic');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(submit).toHaveBeenCalledWith({ name: 'Programmatic' }),
  );
  await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
  await waitFor(() => expect(name).toHaveValue('Initial'));
});

it.each([false, true])(
  'preserves the implicit legacy instance (empty form: %s)',
  async (empty) => {
    const submit = vi.fn();
    render(<ImplicitConsumer onSubmit={submit} empty={empty} />);
    if (!empty) await userEvent.type(screen.getByRole('textbox'), 'Alice');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith(empty ? {} : { name: 'Alice' }),
    );
  },
);

it('keeps a popover open during submission and closes only after success', async () => {
  let finish!: () => void;
  const submit = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  render(<DialogConsumer onSubmit={submit} />);
  await userEvent.click(screen.getByRole('button', { name: 'Open' }));
  const dialog = await screen.findByRole('dialog');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  expect(dialog).toBeInTheDocument();
  expect(submit.mock.calls[0][1].signal.aborted).toBe(false);
  await act(async () => finish());
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
});

it('updates controlled selection and changed parent props', async () => {
  const { rerender } = render(<ControlledConsumer prefix="Before" />);
  await userEvent.click(screen.getByRole('button', { name: /Choice/ }));
  await userEvent.click(await screen.findByRole('option', { name: 'Beta' }));
  expect(screen.getByRole('status')).toHaveTextContent('Before: b');
  rerender(<ControlledConsumer prefix="After" />);
  expect(screen.getByRole('status')).toHaveTextContent('After: b');
});

it('hydrates server-rendered modern forms from the published output', async () => {
  const submit = vi.fn();
  const recover = vi.fn();
  const ui = <ModernConsumer onSubmit={submit} />;
  const container = document.createElement('div');
  container.innerHTML = renderToString(ui);
  document.body.appendChild(container);
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, ui, { onRecoverableError: recover });
    });
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Name' }),
      'Hydrated',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Hydrated');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(recover).not.toHaveBeenCalled();
  } finally {
    await act(async () => root?.unmount());
    container.remove();
  }
});
