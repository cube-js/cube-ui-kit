import { act, renderHook } from '@testing-library/react';

import {
  canWindowColumns,
  getBufferedColumnWindowRange,
  getColumnWindowRange,
  getColumnWindowSegments,
  useColumnWindow,
} from './use-column-window';

import type { CubeResolvedColumn, CubeTableColumnLayout } from './types';

const columns = (): CubeResolvedColumn[] =>
  Array.from({ length: 100 }, (_, index) => ({
    key: `c${index}`,
    index,
    ariaColIndex: index + 1,
    width: 150,
    minWidth: 150,
    maxWidth: null,
    flex: null,
    align: 'start',
    pinOffset: null,
    isPinEdge: false,
    isStructural: false,
  }));
function layout(cols = columns()): CubeTableColumnLayout {
  return {
    columns: cols,
    totalWidth: cols.reduce((sum, c) => sum + c.width!, 0),
    pinnedStartWidth: 0,
    pinnedEndWidth: 0,
    isOverflowing: true,
  };
}

describe('column window model', () => {
  it('reuses the protected buffer and refills only the newly uncovered edge', () => {
    const current = layout();
    const initial = getBufferedColumnWindowRange(current, null, 0, 1000);
    expect(initial).toEqual(getColumnWindowRange(current, 0, 1000));
    let previous = initial;
    let changes = 0;
    for (let step = 1; step <= 60; step++) {
      const offset = step * 160;
      const next = getBufferedColumnWindowRange(
        current,
        previous,
        offset,
        1000,
      );
      const required = getColumnWindowRange(current, offset, 1000);
      expect(next.first).toBeLessThanOrEqual(required.first);
      expect(next.last).toBeGreaterThanOrEqual(required.last);
      if (next !== previous) changes++;
      previous = next;
    }
    expect(changes).toBeLessThan(40);
    const backwards = getBufferedColumnWindowRange(
      current,
      previous,
      160,
      1000,
    );
    expect(backwards.first).toBe(0);
    expect(backwards.last).toBe(getColumnWindowRange(current, 160, 1000).last);
  });

  it('keeps both protected edges with variable widths, pins, reversals and jumps', () => {
    const current = layout();
    current.columns.forEach((column, index) => {
      column.width = index % 3 === 0 ? 20 : index % 3 === 1 ? 150 : 1000;
    });
    current.totalWidth = current.columns.reduce(
      (sum, column) => sum + column.width!,
      0,
    );
    current.pinnedStartWidth = 170;
    current.pinnedEndWidth = 150;
    let previous: ReturnType<typeof getColumnWindowRange> | null = null;
    for (const offset of [0, 160, 320, 480, 160, 0, 20000, 40, 14000]) {
      const next = getBufferedColumnWindowRange(current, previous, offset, 600);
      const required = getColumnWindowRange(current, offset, 600);
      expect(next.first).toBeLessThanOrEqual(required.first);
      expect(next.last).toBeGreaterThanOrEqual(required.last);
      expect(required.first - next.first).toBeLessThanOrEqual(1);
      expect(next.last - required.last).toBeLessThanOrEqual(1);
      previous = next;
    }
    const required = getColumnWindowRange(current, 14000, 3000);
    const middle = Math.floor((required.first + required.last) / 2);
    expect(
      getBufferedColumnWindowRange(
        current,
        { first: middle, last: middle },
        14000,
        3000,
      ),
    ).toEqual(required);
    expect(getBufferedColumnWindowRange(current, null, 14000, 3000)).toEqual(
      required,
    );
    current.columns[99].width! += 0.5;
    current.totalWidth! += 0.5;
    const offset = Math.floor(current.totalWidth! - 600);
    expect(
      getBufferedColumnWindowRange(current, previous, offset, 600),
    ).toEqual(getColumnWindowRange(current, offset, 600));
  });

  it('drops surplus narrow cells and collapses the buffer at scroll endpoints', () => {
    const current = layout();
    current.columns.forEach((column) => {
      column.width = 20;
    });
    current.totalWidth = 2000;
    let previous: ReturnType<typeof getColumnWindowRange> | null = null;
    for (const offset of [160, 320, 480, 640, 800, 1000, 800, 640, 320, 0]) {
      const next = getBufferedColumnWindowRange(
        current,
        previous,
        offset,
        1000,
      );
      const required = getColumnWindowRange(current, offset, 1000);
      expect(next.first).toBeLessThanOrEqual(required.first);
      expect(next.last).toBeGreaterThanOrEqual(required.last);
      expect(required.first - next.first).toBeLessThanOrEqual(1);
      expect(next.last - required.last).toBeLessThanOrEqual(1);
      if (offset === 0 || offset === 1000) expect(next).toEqual(required);
      previous = next;
    }
  });

  it('includes intersecting columns and an overscan band at both edges', () => {
    expect(getColumnWindowRange(layout(), 6000, 600)).toEqual({
      first: 38,
      last: 45,
    });
    expect(getColumnWindowRange(layout(), 0, 600)).toEqual({
      first: 0,
      last: 5,
    });
    expect(getColumnWindowRange(layout(), 14400, 600)).toEqual({
      first: 94,
      last: 99,
    });
  });
  it('keeps complete colspans around noncontiguous retained columns', () => {
    const cols = columns();
    cols[0].pin = 'start';
    cols[99].pin = 'end';
    cols[10].isStructural = true;
    cols[20].render = () => 'custom';
    cols[30].autoHeight = true;
    cols[50].isRowHeader = true;
    cols[60].cellStyles = { color: '#purple' };
    const segments = getColumnWindowSegments(
      cols,
      { first: 38, last: 45 },
      'c70',
    );
    const keys = segments.flatMap((s) => (s.column ? [s.column.key] : []));
    for (const key of ['c0', 'c10', 'c20', 'c30', 'c50', 'c60', 'c70', 'c99'])
      expect(keys).toContain(key);
    expect(segments.reduce((sum, s) => sum + (s.column ? 1 : s.span), 0)).toBe(
      100,
    );
    expect(segments.filter((s) => !s.column).length).toBeGreaterThan(2);
  });
  it('splits gaps at the native colspan limit and isolates consumer keys', () => {
    const cols = Array.from({ length: 1500 }, (_, index) => ({
      ...columns()[0],
      key: `c${index}`,
      index,
      ariaColIndex: index + 1,
    }));
    cols[1400].key = 'column-gap:c6';
    cols[1400].render = () => 'retained';
    const segments = getColumnWindowSegments(cols, { first: 0, last: 5 });
    expect(
      segments.reduce(
        (sum, segment) => sum + (segment.column ? 1 : segment.span),
        0,
      ),
    ).toBe(1500);
    expect(
      segments.every((segment) => segment.column || segment.span <= 1000),
    ).toBe(true);
    expect(new Set(segments.map((segment) => segment.key)).size).toBe(
      segments.length,
    );
  });
  it('uses current variable widths and sticky lane widths', () => {
    const current = layout();
    current.columns[0].width = 1000;
    current.totalWidth! += 850;
    expect(getColumnWindowRange(current, 6000, 600)).toEqual({
      first: 32,
      last: 40,
    });
    current.pinnedStartWidth = 300;
    current.pinnedEndWidth = 300;
    expect(getColumnWindowRange(current, 6000, 600)).toEqual({
      first: 34,
      last: 38,
    });
  });
  it('falls back for unmeasured geometry, DOM overrides and body styles', () => {
    const cols = columns();
    expect(canWindowColumns(cols, { height: '300px' })).toBe(true);
    expect(canWindowColumns(cols, { Cell: { whiteSpace: 'normal' } })).toBe(
      false,
    );
    expect(canWindowColumns(cols, { font: '32px' })).toBe(false);
    cols[0].width = null;
    expect(canWindowColumns(cols)).toBe(false);
    cols[0].width = 150;
    cols[0].cellProps = () => ({ colSpan: 2 });
    expect(canWindowColumns(cols)).toBe(false);
    expect(getColumnWindowSegments(cols, null)).toHaveLength(100);
  });
});

describe('column window lifecycle', () => {
  it('skips all-retained ranges and resumes tracking when a default column returns', () => {
    const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
    const scroller = document.createElement('div');
    const added = vi.spyOn(scroller, 'addEventListener');
    Object.defineProperty(scroller, 'clientWidth', { value: 600 });
    const table = document.createElement('table');
    table.style.lineHeight = '20px';
    table.style.setProperty('--row-height', '40px');
    scroller.append(table);
    const cols = columns();
    cols.forEach((column) => {
      column.render = () => null;
    });
    const current = layout(cols);
    const { result, rerender, unmount } = renderHook(
      ({ resolved }) => useColumnWindow(resolved, scroller, true),
      { initialProps: { resolved: current } },
    );
    try {
      const retained = result.current;
      expect(retained.segments).toHaveLength(100);
      act(() => {
        scroller.scrollLeft = 6000;
        scroller.dispatchEvent(new Event('scroll'));
      });
      expect(result.current).toBe(retained);
      expect(observe).not.toHaveBeenCalled();
      expect(added.mock.calls.some(([type]) => type === 'scroll')).toBe(false);
      const defaults = cols.map((column, index) =>
        index === 10 ? { ...column, render: undefined } : column,
      );
      rerender({ resolved: layout(defaults) });
      expect(observe).toHaveBeenCalledOnce();
      expect(
        result.current.segments.some(
          (segment) => segment.column?.key === 'c10',
        ),
      ).toBe(false);
      rerender({ resolved: current });
      expect(result.current.segments).toHaveLength(100);
      expect(observe).toHaveBeenCalledOnce();
    } finally {
      unmount();
      observe.mockRestore();
      added.mockRestore();
    }
  });

  it('updates the current scroller/layout and cleans up observers and listeners', () => {
    const observers: {
      disconnect: ReturnType<typeof vi.fn>;
      notify: () => void;
    }[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
        constructor(notify: () => void) {
          observers.push({ disconnect: this.disconnect, notify });
        }
      },
    );
    const first = document.createElement('div');
    const second = document.createElement('div');
    for (const element of [first, second]) {
      Object.defineProperty(element, 'clientWidth', {
        value: 600,
        configurable: true,
      });
      const table = document.createElement('table');
      table.style.lineHeight = '20px';
      table.style.setProperty('--row-height', '40px');
      element.append(table);
    }
    document.body.append(first, second);
    const removed = vi.spyOn(first, 'removeEventListener');
    const current = layout();
    const { result, rerender, unmount } = renderHook(
      ({ scroller, enabled, resolved }) =>
        useColumnWindow(resolved, scroller, enabled),
      { initialProps: { scroller: first, enabled: true, resolved: current } },
    );
    expect(
      result.current.segments.some((segment) => segment.column?.key === 'c0'),
    ).toBe(true);
    act(() => {
      first.scrollLeft = 6000;
      first.dispatchEvent(new Event('scroll'));
    });
    expect(
      result.current.segments.some((segment) => segment.column?.key === 'c40'),
    ).toBe(true);
    expect(
      result.current.segments.some((segment) => segment.column?.key === 'c0'),
    ).toBe(false);
    expect(
      result.current.segments.some((segment) => segment.column?.key === 'c46'),
    ).toBe(true);
    act(() => {
      first.scrollTop = 2000;
      first.dispatchEvent(new Event('scroll'));
    });
    expect(
      result.current.segments.some((segment) => segment.column?.key === 'c46'),
    ).toBe(false);
    const window = result.current;
    act(() => {
      first.scrollTop = 4000;
      first.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(window);
    act(() => {
      Object.defineProperty(first, 'clientWidth', {
        value: 20000,
        configurable: true,
      });
      observers[0].notify();
    });
    expect(result.current.segments).toHaveLength(100);
    first.querySelector('table')!.style.lineHeight = '48px';
    act(() => {
      Object.defineProperty(first, 'clientWidth', {
        value: 600,
        configurable: true,
      });
      observers[0].notify();
    });
    expect(result.current.segments).toHaveLength(100);
    act(() => {
      first.querySelector('table')!.style.lineHeight = '20px';
      result.current.refreshAppearance();
    });
    expect(result.current.segments.length).toBeLessThan(20);
    act(() => {
      first
        .querySelector('table')!
        .style.setProperty('--row-height', '40px - 30px');
      result.current.refreshAppearance();
    });
    expect(result.current.segments).toHaveLength(100);
    act(() => {
      first.querySelector('table')!.style.setProperty('--row-height', '40px');
      result.current.refreshAppearance();
    });
    expect(result.current.segments.length).toBeLessThan(20);
    rerender({ scroller: first, enabled: false, resolved: current });
    expect(result.current.segments).toHaveLength(100);
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
    expect(removed).toHaveBeenCalledWith('scroll', expect.any(Function));
    second.scrollLeft = 12000;
    rerender({ scroller: second, enabled: true, resolved: current });
    expect(
      result.current.segments.some((segment) => segment.column?.key === 'c80'),
    ).toBe(true);
    const changed = layout();
    changed.columns[0].width = 1000;
    changed.totalWidth! += 850;
    rerender({ scroller: second, enabled: true, resolved: changed });
    expect(
      result.current.segments.some((segment) => segment.column?.key === 'c73'),
    ).toBe(true);
    act(() => result.current.resetRange());
    expect(
      result.current.segments.some((segment) => segment.column?.key === 'c73'),
    ).toBe(true);
    unmount();
    for (const observer of observers)
      expect(observer.disconnect).toHaveBeenCalledOnce();
    first.remove();
    second.remove();
    vi.unstubAllGlobals();
  });
});
