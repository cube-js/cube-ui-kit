import { StrictMode, useEffect, useState } from 'react';

import { act, render, renderHook } from '../../test';

import { useBufferedValue, UseBufferedValueOptions } from './useBufferedValue';

interface Props<T> {
  value: T | undefined;
  onChange?: (next: T) => void;
  options?: UseBufferedValueOptions<T>;
}

function renderBuffered<T>(initial: Props<T>) {
  return renderHook(
    ({ value, onChange, options }: Props<T>) =>
      useBufferedValue(value, onChange, options),
    { initialProps: initial },
  );
}

describe('useBufferedValue()', () => {
  describe('while the parent keeps up', () => {
    it('adopts a value the parent genuinely changed', () => {
      const { result, rerender } = renderBuffered<string>({ value: 'abc' });

      act(() => result.current.onChange('abxc'));
      rerender({ value: 'abxc' });
      expect(result.current.value).toBe('abxc');

      // An undo, a reset, another record loaded into the same field.
      rerender({ value: 'zzz' });
      expect(result.current.value).toBe('zzz');
    });

    it('adopts a value the parent transformed', () => {
      const onChange = vi.fn();
      const { result, rerender } = renderBuffered<string>({
        value: 'abc',
        onChange,
      });

      act(() => result.current.onChange('abcd'));
      // The parent uppercases: a different string, so it wins.
      rerender({ value: 'ABCD', onChange });

      expect(result.current.value).toBe('ABCD');
      expect(onChange).toHaveBeenCalledExactlyOnceWith('abcd');
    });
  });

  describe('while the parent lags', () => {
    it('keeps the draft when the parent re-renders with the pre-keystroke value', () => {
      const { result, rerender } = renderBuffered<string>({ value: 'abc' });

      act(() => result.current.onChange('abxc'));

      // The stale pass: same value as before the keystroke. Adopting it here is what used to
      // rewrite the DOM node and throw the caret to the end.
      rerender({ value: 'abc' });
      expect(result.current.value).toBe('abxc');

      // The echo lands a pass later and is recognised as ours.
      rerender({ value: 'abxc' });
      expect(result.current.value).toBe('abxc');
    });

    it('does not swallow a keystroke typed before the first echo returned', () => {
      const { result, rerender } = renderBuffered<string>({ value: 'ab' });

      act(() => result.current.onChange('abc'));
      act(() => result.current.onChange('abcd'));

      // The first echo arrives while a later emit is still in flight.
      rerender({ value: 'abc' });
      expect(result.current.value).toBe('abcd');

      rerender({ value: 'abcd' });
      expect(result.current.value).toBe('abcd');
    });

    it('handles a revert to the pre-keystroke string', () => {
      const { result, rerender } = renderBuffered<string>({ value: 'abc' });

      act(() => result.current.onChange('abxc'));
      act(() => result.current.onChange('abc'));

      rerender({ value: 'abxc' });
      expect(result.current.value).toBe('abc');

      rerender({ value: 'abc' });
      expect(result.current.value).toBe('abc');
    });

    // A guard on the double-invoked-render path, not a reproduction: StrictMode runs the render
    // twice and keeps both, and the bookkeeping below is guarded by a key comparison that makes the
    // second pass a no-op either way. An interrupted concurrent pass — where React throws a render
    // away — is the case that argues for holding this in state rather than refs, and it cannot be
    // provoked from jsdom. Measured: this test passes against a ref-based implementation too.
    it('classifies correctly when every render is double-invoked', () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string }) => useBufferedValue(value),
        {
          initialProps: { value: 'abc' },
          wrapper: ({ children }) => <StrictMode>{children}</StrictMode>,
        },
      );

      act(() => result.current.onChange('abxc'));

      rerender({ value: 'abc' }); // the stale pass
      expect(result.current.value).toBe('abxc');

      rerender({ value: 'abxc' }); // our own echo
      expect(result.current.value).toBe('abxc');

      rerender({ value: 'zzz' }); // a real external change
      expect(result.current.value).toBe('zzz');
    });

    it('emits every change verbatim, once, in the same tick', () => {
      const onChange = vi.fn();
      const { result } = renderBuffered<string>({ value: 'a', onChange });

      act(() => result.current.onChange('ab'));
      act(() => result.current.onChange('abc'));

      expect(onChange.mock.calls).toEqual([['ab'], ['abc']]);
    });
  });

  // The buffer sits on every keystroke of every text field, so its render cost is part of its
  // contract. Two per keystroke is the floor for a lagging parent — one for the typed value, one
  // for the echo — and this pins that the bookkeeping adds nothing on top. An earlier version held
  // the queue in state and adjusted it during render, which cost a third render per keystroke whose
  // output was identical.
  it('costs no render beyond the keystroke and its echo', () => {
    let renders = 0;
    let emit: (next: string) => void = () => {};

    function Field({
      value,
      onChange,
    }: {
      value: string;
      onChange: (n: string) => void;
    }) {
      renders++;
      const buffered = useBufferedValue(value, onChange);

      emit = buffered.onChange;

      return <input readOnly value={buffered.value ?? ''} />;
    }

    function LaggingParent() {
      const [value, setValue] = useState('');
      const [inFlight, setInFlight] = useState<string | null>(null);

      useEffect(() => {
        if (inFlight !== null) {
          setValue(inFlight);
          setInFlight(null);
        }
      }, [inFlight]);

      return <Field value={value} onChange={setInFlight} />;
    }

    render(<LaggingParent />);

    renders = 0;
    let text = '';
    for (let i = 0; i < 10; i++) {
      text += 'x';
      act(() => emit(text));
    }

    expect(renders / 10).toBeLessThanOrEqual(2);
  });

  describe('reset()', () => {
    it('gives the parent back control', () => {
      const { result, rerender } = renderBuffered<string>({ value: 'abc' });

      // A parent that declines the keystroke: it re-renders with the value it already had.
      act(() => result.current.onChange('abxc'));
      rerender({ value: 'abc' });
      expect(result.current.value).toBe('abxc');

      act(() => result.current.reset());
      expect(result.current.value).toBe('abc');
    });

    it('leaves a later external change free to land', () => {
      const { result, rerender } = renderBuffered<string>({ value: 'abc' });

      act(() => result.current.onChange('abxc'));
      act(() => result.current.reset());

      rerender({ value: 'zzz' });
      expect(result.current.value).toBe('zzz');
    });
  });

  describe('when there is nothing to protect', () => {
    it('passes an uncontrolled value through', () => {
      const onChange = vi.fn();
      const { result } = renderBuffered<string>({ value: undefined, onChange });

      act(() => result.current.onChange('abc'));

      expect(result.current.value).toBeUndefined();
      expect(onChange).toHaveBeenCalledExactlyOnceWith('abc');
    });

    it.each([
      ['isReadOnly', { isReadOnly: true }],
      ['isDisabled', { isDisabled: true }],
      ['isBuffered: false', { isBuffered: false }],
    ] as const)('stays inert with %s', (_label, options) => {
      const onChange = vi.fn();
      const { result } = renderBuffered<string>({
        value: 'abc',
        onChange,
        options,
      });

      act(() => result.current.onChange('abxc'));

      expect(result.current.value).toBe('abc');
      expect(onChange).toHaveBeenCalledExactlyOnceWith('abxc');
    });

    it('is current again once the control becomes editable', () => {
      const { result, rerender } = renderBuffered<string>({
        value: 'abc',
        options: { isReadOnly: true },
      });

      rerender({ value: 'changed elsewhere', options: { isReadOnly: true } });
      rerender({ value: 'changed elsewhere', options: { isReadOnly: false } });

      expect(result.current.value).toBe('changed elsewhere');

      act(() => result.current.onChange('changed here'));
      rerender({ value: 'changed elsewhere', options: { isReadOnly: false } });
      expect(result.current.value).toBe('changed here');
    });
  });

  describe('getKey', () => {
    // The shape the chart-spec controls need: an array that is rebuilt on every emit, so identity
    // comparison can't recognise the echo.
    const getKey = (stops: string[]) => stops.join('|');

    it('recognises an echo of an equal-but-not-identical value', () => {
      const { result, rerender } = renderBuffered<string[]>({
        value: ['#red', '#blue'],
        options: { getKey },
      });

      act(() => result.current.onChange(['#red', '#green']));

      rerender({ value: ['#red', '#blue'], options: { getKey } });
      expect(result.current.value).toEqual(['#red', '#green']);

      rerender({ value: ['#red', '#green'], options: { getKey } });
      expect(result.current.value).toEqual(['#red', '#green']);
    });

    it('still adopts a genuine external change', () => {
      const { result, rerender } = renderBuffered<string[]>({
        value: ['#red'],
        options: { getKey },
      });

      act(() => result.current.onChange(['#green']));
      rerender({ value: ['#black', '#white'], options: { getKey } });

      expect(result.current.value).toEqual(['#black', '#white']);
    });
  });
});
