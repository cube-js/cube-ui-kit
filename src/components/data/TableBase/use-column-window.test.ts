import { act, renderHook } from '@testing-library/react';

import {
  canWindowColumns,
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
  it('updates the current scroller/layout and cleans up observers and listeners', () => {
    const observers: { disconnect: ReturnType<typeof vi.fn> }[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
        constructor() {
          observers.push(this);
        }
      },
    );
    const first = document.createElement('div');
    const second = document.createElement('div');
    for (const element of [first, second])
      Object.defineProperty(element, 'clientWidth', { value: 600 });
    const removed = vi.spyOn(first, 'removeEventListener');
    const current = layout();
    const { result, rerender, unmount } = renderHook(
      ({ scroller, enabled, resolved }) =>
        useColumnWindow(resolved, scroller, enabled),
      { initialProps: { scroller: first, enabled: true, resolved: current } },
    );
    expect(result.current.some((segment) => segment.column?.key === 'c0')).toBe(
      true,
    );
    act(() => {
      first.scrollLeft = 6000;
      first.dispatchEvent(new Event('scroll'));
    });
    expect(
      result.current.some((segment) => segment.column?.key === 'c40'),
    ).toBe(true);
    expect(result.current.some((segment) => segment.column?.key === 'c0')).toBe(
      false,
    );
    const window = result.current;
    act(() => {
      first.scrollTop = 2000;
      first.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(window);
    rerender({ scroller: first, enabled: false, resolved: current });
    expect(result.current).toHaveLength(100);
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
    expect(removed).toHaveBeenCalledWith('scroll', expect.any(Function));
    second.scrollLeft = 12000;
    rerender({ scroller: second, enabled: true, resolved: current });
    expect(
      result.current.some((segment) => segment.column?.key === 'c80'),
    ).toBe(true);
    const changed = layout();
    changed.columns[0].width = 1000;
    changed.totalWidth! += 850;
    rerender({ scroller: second, enabled: true, resolved: changed });
    expect(
      result.current.some((segment) => segment.column?.key === 'c73'),
    ).toBe(true);
    unmount();
    for (const observer of observers)
      expect(observer.disconnect).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
