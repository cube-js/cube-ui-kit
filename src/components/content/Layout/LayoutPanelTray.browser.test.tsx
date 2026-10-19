import { mergeStyles } from '@tenphi/tasty';
/** Real geometry, scrolling and DOM identity while a native panel tray expands. */
import { useState } from 'react';
import { page } from 'vitest/browser';

import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';
import { Title } from '../Title';

import { Layout } from './Layout';
import { LayoutContent } from './LayoutContent';
import { LayoutFooter } from './LayoutFooter';
import { LayoutPanel } from './LayoutPanel';
import { LayoutToolbar } from './LayoutToolbar';

function ExpandableTray({ hideOnClose = false }: { hideOnClose?: boolean }) {
  const [isOpen, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const dimensions = {
    width: expanded ? '100dvw' : '(100dvw - 2x)',
    height: expanded ? '100dvh' : '60dvh',
  };

  return (
    <Layout height="100dvh">
      <button onClick={() => setOpen(true)}>Open chat</button>
      <LayoutPanel
        side="right"
        mode="dialog"
        isDialogOpen={isOpen}
        onDialogOpenChange={setOpen}
        dialogProps={{ type: 'tray', styles: dimensions, hideOnClose }}
        dialogStyles={mergeStyles(dimensions, { padding: 0 })}
      >
        <Layout height="100%">
          <LayoutToolbar>
            <Title>Chat</Title>
            <button onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Collapse' : 'Expand'}
            </button>
            <button onClick={() => setOpen(false)}>Close chat</button>
          </LayoutToolbar>
          <LayoutContent qa="Transcript">
            {Array.from({ length: 40 }, (_, i) => (
              <p key={i}>Reply {i + 1}: keep the workbook in view.</p>
            ))}
          </LayoutContent>
          <LayoutFooter>
            <input aria-label="Message" defaultValue="Draft" />
          </LayoutFooter>
        </Layout>
      </LayoutPanel>
    </Layout>
  );
}

it('sizes and expands a panel tray without remounting its input or transcript', async () => {
  await page.viewport(390, 844);
  const user = userEvent.setup();
  renderWithRoot(<ExpandableTray />);
  await user.click(screen.getByRole('button', { name: 'Open chat' }));
  const dialog = await screen.findByRole('dialog', { name: 'Chat' });
  const input = screen.getByRole('textbox', {
    name: 'Message',
  }) as HTMLInputElement;
  const transcript = screen
    .getByTestId('Transcript')
    .querySelector('[data-element="Inner"]') as HTMLElement;
  await waitFor(
    () => {
      const bounds = dialog.getBoundingClientRect();
      expect(bounds.x).toBeCloseTo(8, 0);
      expect(bounds.width).toBeCloseTo(374, 0);
      expect(bounds.height).toBeCloseTo(506.4, 0);
      expect(bounds.bottom).toBeCloseTo(844, 0);
    },
    { timeout: 2000 },
  );
  expect(screen.getAllByRole('button', { name: 'Close chat' })).toHaveLength(1);
  expect(screen.queryByTestId('ModalCloseButton')).not.toBeInTheDocument();
  await user.clear(input);
  await user.type(input, 'Keep my draft');
  input.setSelectionRange(2, 7);
  transcript.scrollTop = 120;
  expect(transcript.scrollTop).toBe(120);
  await user.click(screen.getByRole('button', { name: 'Expand' }));
  await waitFor(() => {
    const bounds = dialog.getBoundingClientRect();
    expect(bounds.x).toBeCloseTo(0, 0);
    expect(bounds.width).toBeCloseTo(390, 0);
    expect(bounds.height).toBeCloseTo(844, 0);
  });
  expect(screen.getByRole('textbox', { name: 'Message' })).toBe(input);
  expect(input).toHaveValue('Keep my draft');
  expect([input.selectionStart, input.selectionEnd]).toEqual([2, 7]);
  expect(
    screen.getByTestId('Transcript').querySelector('[data-element="Inner"]'),
  ).toBe(transcript);
  expect(transcript.scrollTop).toBe(120);
  await user.click(screen.getByRole('button', { name: 'Collapse' }));
  await page.viewport(844, 390);
  await waitFor(() => {
    const bounds = dialog.getBoundingClientRect();
    expect(bounds.x).toBeCloseTo(8, 0);
    expect(bounds.width).toBeCloseTo(828, 0);
    expect(bounds.height).toBeCloseTo(234, 0);
    expect(input.getBoundingClientRect().bottom).toBeLessThanOrEqual(390);
  });
  await user.keyboard('{Escape}');
  await waitFor(() => expect(dialog).not.toBeInTheDocument());
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Open chat' })).toHaveFocus(),
  );
});

it('releases page scroll and modal state while a retained tray is closed', async () => {
  const user = userEvent.setup();
  renderWithRoot(<ExpandableTray hideOnClose />);
  expect(document.documentElement.style.overflow).not.toBe('hidden');
  await user.click(screen.getByRole('button', { name: 'Open chat' }));
  const dialog = await screen.findByRole('dialog', { name: 'Chat' });
  await waitFor(() =>
    expect(document.documentElement.style.overflow).toBe('hidden'),
  );
  const input = screen.getByRole('textbox', { name: 'Message' });
  await user.type(input, ' retained');
  await user.click(screen.getByRole('button', { name: 'Close chat' }));
  await waitFor(() => expect(dialog).not.toBeVisible());
  await waitFor(() =>
    expect(document.documentElement.style.overflow).not.toBe('hidden'),
  );
  const opener = screen.getByRole('button', { name: 'Open chat' });
  await user.click(opener);
  expect(screen.getByRole('textbox', { name: 'Message' })).toBe(input);
  expect(input).toHaveValue('Draft retained');
});
