import { userEvent as realInput } from 'vitest/browser';

import { renderWithRoot, screen } from '../../test';

import { ResizablePanel } from './ResizablePanel';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const width = () =>
  screen.getByTestId('Resizable').getBoundingClientRect().width;

it('accepts controlled size updates without echoing the previous measured size', async () => {
  const onSizeChange = vi.fn();
  const { rerender } = renderWithRoot(
    <ResizablePanel
      qa="Resizable"
      size={240}
      minSize={0}
      maxSize={600}
      onSizeChange={onSizeChange}
    />,
  );
  await vi.waitFor(() => expect(width()).toBeCloseTo(240, 0));
  await frame();
  onSizeChange.mockClear();
  rerender(
    <ResizablePanel
      qa="Resizable"
      size={320}
      minSize={0}
      maxSize={600}
      onSizeChange={onSizeChange}
    />,
  );
  await vi.waitFor(() => expect(width()).toBeCloseTo(320, 0));
  expect(onSizeChange).not.toHaveBeenCalled();
});

it('synchronizes a controlled zero size after a nonzero size', async () => {
  const onSizeChange = vi.fn();
  const { rerender } = renderWithRoot(
    <ResizablePanel
      qa="Resizable"
      size={120}
      minSize={0}
      maxSize={600}
      onSizeChange={onSizeChange}
    />,
  );
  await vi.waitFor(() => expect(width()).toBeCloseTo(120, 0));
  rerender(
    <ResizablePanel
      qa="Resizable"
      size={0}
      minSize={0}
      maxSize={600}
      onSizeChange={onSizeChange}
    />,
  );
  await vi.waitFor(() => expect(width()).toBeCloseTo(0, 0));
});

it('notifies the current callback after drag completion without notifying for callback replacement', async () => {
  const first = vi.fn();
  const second = vi.fn();
  const view = (onSizeChange: (size: number) => void) => (
    <div
      data-qa="ResizeContainer"
      style={{ display: 'flex', width: 600, height: 200 }}
    >
      <ResizablePanel
        qa="Resizable"
        minSize={0}
        maxSize={600}
        onSizeChange={onSizeChange}
      />
    </div>
  );
  const { rerender } = renderWithRoot(view(first));
  await vi.waitFor(() => expect(width()).toBeCloseTo(200, 0));
  await frame();
  first.mockClear();
  rerender(view(second));
  await frame();
  expect(second).not.toHaveBeenCalled();

  const handler = screen.getByTestId('ResizeHandler');
  const rect = handler.getBoundingClientRect();
  const container = screen.getByTestId('ResizeContainer');
  const containerRect = container.getBoundingClientRect();
  await realInput.dragAndDrop(handler, container, {
    sourcePosition: { x: 2, y: 2 },
    targetPosition: {
      x: rect.x - containerRect.x + 52,
      y: rect.y - containerRect.y + 2,
    },
  });
  await vi.waitFor(() => expect(width()).toBeCloseTo(250, 0));
  await vi.waitFor(() => expect(second).toHaveBeenCalledWith(250));
  expect(first).not.toHaveBeenCalled();
});
