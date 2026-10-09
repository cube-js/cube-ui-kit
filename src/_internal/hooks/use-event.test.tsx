import { renderHook } from '../../test';

import { useEvent } from './use-event';

it('retains one callback identity that calls the latest committed implementation', () => {
  const first = vi.fn((value: number) => value + 1);
  const second = vi.fn((value: number) => value + 2);
  const { result, rerender } = renderHook(
    ({ callback }) => useEvent(callback),
    {
      initialProps: { callback: first },
    },
  );
  const retained = result.current;
  expect(retained(3)).toBe(4);
  rerender({ callback: second });
  expect(result.current).toBe(retained);
  expect(retained(3)).toBe(5);
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledWith(3);
});
