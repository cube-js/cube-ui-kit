import { act, renderWithRoot, screen, waitFor } from '../../../test';

import { DisplayTransition } from './DisplayTransition';

import type { RefCallback } from 'react';

/**
 * Real time passing, inside act() so the state updates the rAFs and timers
 * produce are not reported as unwrapped.
 */
const settle = (ms: number) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });

const probe = () => screen.getByTestId('probe');
const phaseOf = () => probe().getAttribute('data-phase');
const heightOf = () => probe().getBoundingClientRect().height;

interface ProbeProps {
  isShown: boolean;
  /** undefined => native transition-event timing, the mode most consumers use. */
  duration?: number;
  onRest?: (transition: 'enter' | 'exit') => void;
  /** Declare a real CSS height transition on the element. */
  hasTransition?: boolean;
  /** Skip binding the ref, leaving the hook with no element to listen on. */
  detached?: boolean;
}

function Probe({
  isShown,
  duration,
  onRest,
  hasTransition = true,
  detached = false,
}: ProbeProps) {
  return (
    <DisplayTransition
      exposeUnmounted
      animateOnMount={false}
      duration={duration}
      isShown={isShown}
      onRest={onRest}
    >
      {({ phase, isShown: shown, ref }) => (
        <div
          ref={detached ? undefined : (ref as RefCallback<HTMLDivElement>)}
          data-phase={phase}
          data-qa="probe"
          data-shown={shown}
          style={{
            overflow: 'hidden',
            height: shown ? '80px' : '0px',
            transition: hasTransition ? 'height 120ms linear' : 'none',
          }}
        >
          <div style={{ height: '80px' }}>content</div>
        </div>
      )}
    </DisplayTransition>
  );
}

/**
 * Transition timing, in a real browser.
 *
 * The `duration === undefined` path — which listens for the element's own
 * `transitionstart`/`transitionend`, and is what 8 of the 11 consumers use — is
 * untestable under jsdom: jsdom has no layout and never fires transition
 * events, so the 150ms "no transition started" fallback always won and the
 * listener path never ran once.
 */
describe('DisplayTransition timing with real transitions', () => {
  it('ends the exit on the real transitionend', async () => {
    const onRest = vi.fn();

    const { rerender } = renderWithRoot(
      <Probe isShown={true} onRest={onRest} />,
    );

    expect(phaseOf()).toBe('entered');
    expect(heightOf()).toBeCloseTo(80, 0);

    rerender(<Probe isShown={false} onRest={onRest} />);

    // The collapse takes a frame to arm, then the real 120ms transition runs.
    await waitFor(() => expect(phaseOf()).toBe('exit'));
    expect(onRest).not.toHaveBeenCalled();

    await waitFor(() => expect(phaseOf()).toBe('unmounted'), { timeout: 1000 });

    expect(onRest).toHaveBeenCalledWith('exit');
    expect(onRest).toHaveBeenCalledTimes(1);
  });

  it('falls back to the short timer when no transition is declared', async () => {
    const onRest = vi.fn();

    const { rerender } = renderWithRoot(
      <Probe hasTransition={false} isShown={true} onRest={onRest} />,
    );

    rerender(<Probe hasTransition={false} isShown={false} onRest={onRest} />);

    // No transitionstart ever fires, so the 150ms fallback has to complete it.
    await waitFor(() => expect(phaseOf()).toBe('unmounted'), { timeout: 1000 });

    expect(onRest).toHaveBeenCalledWith('exit');
  });

  it('falls back to the long timer when there is no element to listen on', async () => {
    const onRest = vi.fn();

    const { rerender } = renderWithRoot(
      <Probe detached isShown={true} onRest={onRest} />,
    );

    rerender(<Probe detached isShown={false} onRest={onRest} />);

    // AUTO_FALLBACK_DURATION is 500ms — comfortably longer than the 150ms one,
    // so check it has not resolved early before waiting it out.
    await settle(250);
    expect(phaseOf()).not.toBe('unmounted');

    await waitFor(() => expect(phaseOf()).toBe('unmounted'), { timeout: 2000 });

    expect(onRest).toHaveBeenCalledWith('exit');
  });

  it('finishes the exit when the duration changes mid-collapse', async () => {
    // CUB-3793 against real frames: the collapse and the duration change land in
    // two separate renders inside the same frame, which used to cancel the
    // pending exit and strand the element visible.
    const onRest = vi.fn();

    const { rerender } = renderWithRoot(
      <Probe duration={0} isShown={true} onRest={onRest} />,
    );

    rerender(<Probe duration={0} isShown={false} onRest={onRest} />);
    rerender(<Probe duration={undefined} isShown={false} onRest={onRest} />);

    await waitFor(() => expect(phaseOf()).toBe('unmounted'), { timeout: 1000 });

    expect(onRest).toHaveBeenCalledWith('exit');
  });

  it('keeps the element shown when re-shown mid-collapse', async () => {
    const onRest = vi.fn();

    const { rerender } = renderWithRoot(
      <Probe isShown={true} onRest={onRest} />,
    );

    rerender(<Probe isShown={false} onRest={onRest} />);
    rerender(<Probe isShown={true} onRest={onRest} />);

    // Give the cancelled exit every chance to fire late.
    await settle(400);

    expect(phaseOf()).toBe('entered');
    expect(heightOf()).toBeCloseTo(80, 0);
    expect(onRest).not.toHaveBeenCalledWith('exit');
  });
});
