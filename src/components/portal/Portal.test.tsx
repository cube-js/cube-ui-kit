import { createRef } from 'react';

import { render } from '../../test';

import { Portal } from './Portal';

it('uses the current mount callback when the target changes without notifying for callback replacement', () => {
  const firstTarget = document.createElement('div');
  const secondTarget = document.createElement('div');
  const firstRoot = createRef<HTMLElement>();
  const secondRoot = createRef<HTMLElement>();
  firstRoot.current = firstTarget;
  secondRoot.current = secondTarget;
  const first = vi.fn(() => expect(firstTarget.textContent).toBe('Content'));
  const second = vi.fn(() => expect(secondTarget.textContent).toBe('Content'));
  const { rerender, unmount } = render(
    <Portal root={firstRoot} onMount={first}>
      Content
    </Portal>,
  );

  expect(first).toHaveBeenCalledTimes(1);
  rerender(
    <Portal root={firstRoot} onMount={second}>
      Content
    </Portal>,
  );
  expect(second).not.toHaveBeenCalled();
  rerender(
    <Portal root={secondRoot} onMount={second}>
      Content
    </Portal>,
  );
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(1);
  expect(firstTarget.textContent).toBe('');
  unmount();
  expect(secondTarget.textContent).toBe('');
});

it('preserves inline content and current notifications when disabled and re-enabled', () => {
  const root = { current: document.createElement('div') };
  const first = vi.fn();
  const second = vi.fn();
  const { container, rerender } = render(
    <Portal root={root} isDisabled onMount={first}>
      Content
    </Portal>,
  );

  expect(container.textContent).toBe('Content');
  expect(first).toHaveBeenCalledTimes(1);
  rerender(
    <Portal root={root} isDisabled onMount={second}>
      Content
    </Portal>,
  );
  expect(second).not.toHaveBeenCalled();
  rerender(
    <Portal root={root} onMount={second}>
      Content
    </Portal>,
  );
  expect(root.current.textContent).toBe('Content');
  expect(container.textContent).toBe('');
  expect(second).toHaveBeenCalledTimes(1);
});
