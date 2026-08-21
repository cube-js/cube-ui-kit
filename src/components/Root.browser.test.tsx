import { hasPendingStyleWrites, tasty } from '@tenphi/tasty';
import { act, render } from '@testing-library/react';
import { StrictMode, useLayoutEffect, useRef, useState } from 'react';

import { Portal } from './portal';
import { Root } from './Root';

/**
 * The kit's batched-injection wiring.
 *
 * `configure({ batchInjection: true })` in `Root` only does something inside a
 * batch window, so the wiring can silently become a no-op — the flag stays on,
 * the provider goes missing, and every render is quietly back to one
 * `insertRule()` per component. These tests assert on the queue itself so that
 * cannot happen unnoticed.
 *
 * They also assert on `getBoundingClientRect()` inside a `useLayoutEffect`,
 * which is the property that makes batching safe to enable at all: a queued
 * write must land before anything can measure. Asserting on CSS text would not
 * catch a regression there.
 */

const WIDTH = 317;

/** A component that measures itself in a layout effect, like a popover does. */
function makeMeasured(record: (width: number) => void) {
  const Box = tasty({ styles: { width: `${WIDTH}px`, height: '10px' } });

  return function Measured() {
    const ref = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
      record(ref.current!.getBoundingClientRect().width);
    }, []);
    return <Box ref={ref} />;
  };
}

describe('Root batched injection', () => {
  it('batches during the mount commit', () => {
    const Box = tasty({ styles: { letterSpacing: '0.013em' } });
    let pendingMidRender: boolean | null = null;

    // Renders after <Box/>, so anything Box queued is still queued here.
    function Probe() {
      pendingMidRender = hasPendingStyleWrites();
      return null;
    }

    render(
      <Root>
        <Box />
        <Probe />
      </Root>,
    );

    expect(pendingMidRender).toBe(true);
    // Root's insertion effect drained the queue before the commit finished.
    expect(hasPendingStyleWrites()).toBe(false);
  });

  it('has the rules in the sheet before layout effects run', () => {
    let measured = -1;
    const Measured = makeMeasured((w) => {
      measured = w;
    });

    render(
      <Root>
        <Measured />
      </Root>,
    );

    expect(measured).toBe(WIDTH);
  });

  // Root does not re-render when an overlay opens, so its window does not cover
  // that commit. Portal opens one of its own — this is what makes dialogs,
  // tooltips and menus benefit rather than just the initial mount.
  it('batches a portal that mounts without re-rendering Root', () => {
    const Box = tasty({ styles: { letterSpacing: '0.029em' } });
    // One observation per render. `Portal` renders its children inline first and
    // again once `mountRoot` resolves, and the second pass is a cache hit with
    // nothing left to queue — so the question is whether *a* render batched, not
    // what the last one saw.
    const observed: boolean[] = [];
    let open: (value: boolean) => void = () => {};

    function Probe() {
      observed.push(hasPendingStyleWrites());
      return null;
    }

    function Host() {
      const [isOpen, setOpen] = useState(false);
      open = setOpen;

      if (!isOpen) return null;

      return (
        <Portal>
          <Box />
          <Probe />
        </Portal>
      );
    }

    render(
      <Root>
        <Host />
      </Root>,
    );

    expect(observed).toEqual([]);

    act(() => open(true));

    expect(observed).toContain(true);
    expect(hasPendingStyleWrites()).toBe(false);
  });

  // Dev runs under StrictMode, which double-invokes render but runs insertion
  // effects once. If a batch window survived its commit, the next commit with no
  // provider in it would quietly get 'always' semantics and its layout effect
  // would measure an unstyled box — a dev-only wrong number that never
  // self-corrects. Consumers develop in StrictMode, so this is the common path.
  it('keeps measurement correct after a StrictMode commit', () => {
    const WIDTH = 211;
    const Box = tasty({ styles: { width: `${WIDTH}px`, height: '10px' } });
    let measured = -1;

    function Measured() {
      const ref = useRef<HTMLDivElement>(null);
      useLayoutEffect(() => {
        measured = ref.current!.getBoundingClientRect().width;
      }, []);
      return <Box ref={ref} />;
    }

    render(
      <StrictMode>
        <Root />
      </StrictMode>,
    );

    // A separate commit, outside any provider.
    render(<Measured />);

    expect(measured).toBe(WIDTH);
  });

  it('measures correctly inside a portal that mounts later', () => {
    let measured = -1;
    let open: (value: boolean) => void = () => {};
    const Measured = makeMeasured((w) => {
      measured = w;
    });

    function Host() {
      const [isOpen, setOpen] = useState(false);
      open = setOpen;

      return isOpen ? (
        <Portal>
          <Measured />
        </Portal>
      ) : null;
    }

    render(
      <Root>
        <Host />
      </Root>,
    );

    act(() => open(true));

    expect(measured).toBe(WIDTH);
  });
});
