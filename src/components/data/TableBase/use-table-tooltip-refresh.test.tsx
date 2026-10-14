import { render } from '@testing-library/react';

import { useTableTooltipRefresh } from './use-table-tooltip-refresh';

function Scope({
  scroller,
  onAppearanceChange,
  isScrolling = false,
  onRest,
}: {
  scroller: HTMLDivElement | null;
  onAppearanceChange?: () => void;
  isScrolling?: boolean;
  onRest?: () => void;
}) {
  useTableTooltipRefresh(scroller, isScrolling, onAppearanceChange, onRest);
  return null;
}

it('notifies rest separately from appearance changes during a gesture', () => {
  const root = document.createElement('div');
  const scroller = document.createElement('div');
  root.append(scroller);
  document.body.append(root);
  const onRest = vi.fn();
  const onAppearanceChange = vi.fn();
  const { rerender, unmount } = render(
    <Scope
      scroller={scroller}
      isScrolling
      onRest={onRest}
      onAppearanceChange={onAppearanceChange}
    />,
  );
  try {
    expect(onRest).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('resize'));
    expect(onAppearanceChange).toHaveBeenCalledOnce();
    expect(onRest).not.toHaveBeenCalled();
    rerender(
      <Scope
        scroller={scroller}
        onRest={onRest}
        onAppearanceChange={onAppearanceChange}
      />,
    );
    expect(onRest).toHaveBeenCalledOnce();
  } finally {
    unmount();
    root.remove();
  }
});

it('releases appearance observation when its root changes or unmounts', () => {
  const observe = vi
    .spyOn(MutationObserver.prototype, 'observe')
    .mockImplementation(() => {});
  const onAppearanceChange = vi.fn();
  const add = vi.spyOn(window, 'addEventListener');
  const remove = vi.spyOn(window, 'removeEventListener');
  const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
  const firstRoot = document.createElement('div');
  const secondRoot = document.createElement('div');
  const firstScroller = document.createElement('div');
  const secondScroller = document.createElement('div');
  firstRoot.append(firstScroller);
  secondRoot.append(secondScroller);
  document.body.append(firstRoot, secondRoot);

  try {
    const { rerender, unmount } = render(
      <Scope
        scroller={firstScroller}
        onAppearanceChange={onAppearanceChange}
      />,
    );
    expect(observe).toHaveBeenCalledWith(firstRoot, {
      attributes: true,
      subtree: true,
    });
    const firstResize = add.mock.calls.find(([type]) => type === 'resize')![1];
    const beforeResize = onAppearanceChange.mock.calls.length;
    window.dispatchEvent(new Event('resize'));
    expect(onAppearanceChange).toHaveBeenCalledTimes(beforeResize + 1);
    const firstObserver = observe.mock.contexts[0];
    expect(disconnect).not.toHaveBeenCalled();

    rerender(
      <Scope
        scroller={secondScroller}
        onAppearanceChange={onAppearanceChange}
      />,
    );
    expect(disconnect.mock.contexts).toEqual([firstObserver]);
    expect(remove).toHaveBeenCalledWith('resize', firstResize);
    expect(observe).toHaveBeenCalledWith(secondRoot, {
      attributes: true,
      subtree: true,
    });
    const secondObserver = observe.mock.contexts.at(-1);
    const secondResize = add.mock.calls
      .filter(([type]) => type === 'resize')
      .at(-1)![1];
    unmount();
    expect(remove).toHaveBeenCalledWith('resize', secondResize);
    const afterUnmount = onAppearanceChange.mock.calls.length;
    window.dispatchEvent(new Event('resize'));
    expect(onAppearanceChange).toHaveBeenCalledTimes(afterUnmount);
    expect(disconnect.mock.contexts).toEqual([firstObserver, secondObserver]);
  } finally {
    add.mockRestore();
    remove.mockRestore();
    observe.mockRestore();
    disconnect.mockRestore();
    firstRoot.remove();
    secondRoot.remove();
  }
});
