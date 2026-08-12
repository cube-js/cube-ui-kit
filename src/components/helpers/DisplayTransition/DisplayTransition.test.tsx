import { act } from '@testing-library/react';

import { render } from '../../../test';

import { DisplayTransition } from './DisplayTransition';

import type { DisplayTransitionProps } from './DisplayTransition';

/** Renders the transition with a probe element exposing phase/isShown as attributes. */
function Probe(props: Omit<DisplayTransitionProps, 'children'>) {
  return (
    <DisplayTransition {...props}>
      {({ phase, isShown, ref }) => (
        <div ref={ref} data-phase={phase} data-shown={isShown}>
          content
        </div>
      )}
    </DisplayTransition>
  );
}

const phaseOf = (container: HTMLElement) =>
  container.querySelector('[data-phase]')?.getAttribute('data-phase');

const shownOf = (container: HTMLElement) =>
  container.querySelector('[data-shown]')?.getAttribute('data-shown');

describe('DisplayTransition', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    // Tests that stub matchMedia must not leak it into the rest of the file:
    // the jsdom project shares one environment across a worker.
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
  });

  it('should handle initial states correctly based on props', () => {
    // Test 1: Initial unmounted with exposeUnmounted=true
    let result = render(
      <DisplayTransition exposeUnmounted isShown={false}>
        {({ phase, isShown, ref }) => (
          <div ref={ref} data-phase={phase} data-shown={isShown}>
            content
          </div>
        )}
      </DisplayTransition>,
    );

    expect(
      result.container.querySelector('[data-phase="unmounted"]'),
    ).toBeInTheDocument();
    expect(
      result.container.querySelector('[data-shown="false"]'),
    ).toBeInTheDocument();

    result.unmount();

    // Test 2: exposeUnmounted=false returns null
    result = render(
      <DisplayTransition isShown={false}>
        {({ phase, isShown, ref }) => (
          <div ref={ref} data-phase={phase} data-shown={isShown}>
            content
          </div>
        )}
      </DisplayTransition>,
    );

    expect(
      result.container.querySelector('[data-phase]'),
    ).not.toBeInTheDocument();

    result.unmount();

    // Test 3: Initial entered when animateOnMount=false
    result = render(
      <DisplayTransition isShown={true} animateOnMount={false}>
        {({ phase, isShown, ref }) => (
          <div ref={ref} data-phase={phase} data-shown={isShown}>
            content
          </div>
        )}
      </DisplayTransition>,
    );

    expect(
      result.container.querySelector('[data-phase="entered"]'),
    ).toBeInTheDocument();
    expect(
      result.container.querySelector('[data-shown="true"]'),
    ).toBeInTheDocument();

    result.unmount();

    // Test 4: Initial enter when animateOnMount=true
    result = render(
      <DisplayTransition isShown={true} animateOnMount={true}>
        {({ phase, isShown, ref }) => (
          <div ref={ref} data-phase={phase} data-shown={isShown}>
            content
          </div>
        )}
      </DisplayTransition>,
    );

    expect(
      result.container.querySelector('[data-phase="enter"]'),
    ).toBeInTheDocument();
    expect(
      result.container.querySelector('[data-shown="false"]'),
    ).toBeInTheDocument();
  });

  it('should complete enter flow: unmounted → enter → entered with correct isShown values and onRest callback', () => {
    const onRest = vi.fn();
    const phases: string[] = [];

    const { container } = render(
      <DisplayTransition isShown={true} duration={150} onRest={onRest}>
        {({ phase, isShown, ref }) => {
          phases.push(`${phase}:${isShown}`);
          return (
            <div ref={ref} data-phase={phase} data-shown={isShown}>
              content
            </div>
          );
        }}
      </DisplayTransition>,
    );

    // Initial: enter phase, isShown=false
    expect(container.querySelector('[data-phase="enter"]')).toBeInTheDocument();
    expect(container.querySelector('[data-shown="false"]')).toBeInTheDocument();

    // Advance through double-rAF to reach "entered"
    act(() => {
      vi.advanceTimersByTime(50); // Advance enough to process rAFs
    });

    expect(
      container.querySelector('[data-phase="entered"]'),
    ).toBeInTheDocument();
    expect(container.querySelector('[data-shown="true"]')).toBeInTheDocument();
    expect(onRest).not.toHaveBeenCalled();

    // After duration, onRest should fire
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(onRest).toHaveBeenCalledWith('enter');
    expect(onRest).toHaveBeenCalledTimes(1);
  });

  it('should complete exit flow: entered → exit → unmounted with correct isShown values and onRest callback', () => {
    const onRest = vi.fn();

    const { container, rerender } = render(
      <DisplayTransition
        exposeUnmounted
        isShown={true}
        animateOnMount={false}
        duration={150}
        onRest={onRest}
      >
        {({ phase, isShown, ref }) => (
          <div ref={ref} data-phase={phase} data-shown={isShown}>
            content
          </div>
        )}
      </DisplayTransition>,
    );

    // Initial: entered
    expect(
      container.querySelector('[data-phase="entered"]'),
    ).toBeInTheDocument();
    expect(container.querySelector('[data-shown="true"]')).toBeInTheDocument();

    // Trigger exit
    rerender(
      <DisplayTransition
        exposeUnmounted
        isShown={false}
        animateOnMount={false}
        duration={150}
        onRest={onRest}
      >
        {({ phase, isShown, ref }) => (
          <div ref={ref} data-phase={phase} data-shown={isShown}>
            content
          </div>
        )}
      </DisplayTransition>,
    );

    // Immediately after rerender, still in 'entered' (exit-pending internally), isShown=true
    expect(
      container.querySelector('[data-phase="entered"]'),
    ).toBeInTheDocument();
    expect(container.querySelector('[data-shown="true"]')).toBeInTheDocument();
    expect(onRest).not.toHaveBeenCalled();

    // Advance through double-rAF to reach "exit" phase
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Now should be in exit phase, isShown=false
    expect(container.querySelector('[data-phase="exit"]')).toBeInTheDocument();
    expect(container.querySelector('[data-shown="false"]')).toBeInTheDocument();
    expect(onRest).not.toHaveBeenCalled();

    // After duration, should reach unmounted and fire onRest
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(
      container.querySelector('[data-phase="unmounted"]'),
    ).toBeInTheDocument();
    expect(onRest).toHaveBeenCalledWith('exit');
    expect(onRest).toHaveBeenCalledTimes(1);

    // Test without exposeUnmounted - should return null
    rerender(
      <DisplayTransition
        isShown={false}
        animateOnMount={false}
        duration={150}
        onRest={onRest}
      >
        {({ phase, isShown, ref }) => (
          <div ref={ref} data-phase={phase} data-shown={isShown}>
            content
          </div>
        )}
      </DisplayTransition>,
    );

    expect(container.querySelector('[data-phase]')).not.toBeInTheDocument();
  });

  it('should handle zero duration with immediate transitions and fire callbacks', () => {
    const onRest = vi.fn();

    // Test enter flow with duration=0
    const { container, rerender } = render(
      <DisplayTransition isShown={true} duration={0} onRest={onRest}>
        {({ phase, isShown, ref }) => (
          <div ref={ref} data-phase={phase} data-shown={isShown}>
            content
          </div>
        )}
      </DisplayTransition>,
    );

    // With duration=0, "enter" phase is collapsed to "entered" at render time
    // but isShown is still false until phase internally becomes "entered"
    expect(
      container.querySelector('[data-phase="entered"]'),
    ).toBeInTheDocument();
    expect(container.querySelector('[data-shown="false"]')).toBeInTheDocument();

    // Advance timers to trigger onRest
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(onRest).toHaveBeenCalledWith('enter');
    onRest.mockClear();

    // Test exit flow with duration=0
    rerender(
      <DisplayTransition
        exposeUnmounted
        isShown={false}
        duration={0}
        onRest={onRest}
      >
        {({ phase, isShown }) => (
          <div data-phase={phase} data-shown={isShown}>
            content
          </div>
        )}
      </DisplayTransition>,
    );

    // Advance through double-rAF for exit-pending → exit transition
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // With duration=0, it should go directly to unmounted (exit completes instantly after rAF)
    expect(
      container.querySelector('[data-phase="unmounted"]'),
    ).toBeInTheDocument();
    expect(onRest).toHaveBeenCalledWith('exit');
  });

  it('should respect prefers-reduced-motion', () => {
    const matchMediaMock = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });

    const onRest = vi.fn();

    const { container } = render(
      <DisplayTransition
        isShown={true}
        duration={150}
        respectReducedMotion={true}
        onRest={onRest}
      >
        {({ phase, isShown, ref }) => (
          <div ref={ref} data-phase={phase} data-shown={isShown}>
            content
          </div>
        )}
      </DisplayTransition>,
    );

    // Should start in enter, but with reduced motion
    expect(matchMediaMock).toHaveBeenCalledWith(
      '(prefers-reduced-motion: reduce)',
    );

    // With reduced motion, internal duration is 0 but the phase is still "enter"
    // (the collapse to "entered" only happens when duration prop is 0, not computed dur)
    expect(container.querySelector('[data-phase="enter"]')).toBeInTheDocument();
    expect(container.querySelector('[data-shown="false"]')).toBeInTheDocument();

    // With internal duration of 0, it should transition to entered very quickly
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(
      container.querySelector('[data-phase="entered"]'),
    ).toBeInTheDocument();
    expect(container.querySelector('[data-shown="true"]')).toBeInTheDocument();
    expect(onRest).toHaveBeenCalledWith('enter');
  });

  it('should handle rapid toggles and cancel previous timers', () => {
    const onRest = vi.fn();

    const { container, rerender } = render(
      <DisplayTransition
        exposeUnmounted
        isShown={false}
        duration={150}
        onRest={onRest}
      >
        {({ phase, isShown, ref }) => (
          <div ref={ref} data-phase={phase} data-shown={isShown}>
            content
          </div>
        )}
      </DisplayTransition>,
    );

    // Start unmounted
    expect(
      container.querySelector('[data-phase="unmounted"]'),
    ).toBeInTheDocument();

    // Trigger enter
    act(() => {
      rerender(
        <DisplayTransition
          exposeUnmounted
          isShown={true}
          duration={150}
          onRest={onRest}
        >
          {({ phase, isShown }) => (
            <div data-phase={phase} data-shown={isShown}>
              content
            </div>
          )}
        </DisplayTransition>,
      );
    });

    expect(container.querySelector('[data-phase="enter"]')).toBeInTheDocument();

    // Rapidly toggle to exit IMMEDIATELY, before enter completes
    act(() => {
      rerender(
        <DisplayTransition
          exposeUnmounted
          isShown={false}
          duration={150}
          onRest={onRest}
        >
          {({ phase, isShown }) => (
            <div data-phase={phase} data-shown={isShown}>
              content
            </div>
          )}
        </DisplayTransition>,
      );
    });

    // Should be in 'entered' (exit-pending internally), 'exit', or 'unmounted' (depending on timing)
    const phaseAfterToggle = container
      .querySelector('[data-phase]')
      ?.getAttribute('data-phase');
    expect(['entered', 'exit', 'unmounted']).toContain(phaseAfterToggle);

    // Complete all transitions
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Should end in unmounted
    expect(
      container.querySelector('[data-phase="unmounted"]'),
    ).toBeInTheDocument();

    // onRest for enter should NOT have been called (it was cancelled)
    // onRest for exit should have been called
    expect(onRest).toHaveBeenCalledWith('exit');
    expect(onRest).not.toHaveBeenCalledWith('enter');
  });

  it('should preserve children content during exit when preserveContent=true (default)', () => {
    // This test verifies the fix for a bug where children would disappear instantly
    // during exit when the parent conditionally rendered children based on isShown

    interface TestWrapperProps {
      isShown: boolean;
      content: string;
    }

    function TestWrapper({ isShown, content }: TestWrapperProps) {
      return (
        <DisplayTransition
          exposeUnmounted
          isShown={isShown}
          animateOnMount={false}
          duration={150}
        >
          {({ phase, isShown: isShownNow, ref }) => (
            <div ref={ref} data-phase={phase} data-shown={isShownNow}>
              {/* Simulate parent conditionally rendering content based on its own state */}
              {isShown ? content : null}
            </div>
          )}
        </DisplayTransition>
      );
    }

    const { container, rerender } = render(
      <TestWrapper isShown={true} content="original content" />,
    );

    // Initial: entered with content
    expect(
      container.querySelector('[data-phase="entered"]'),
    ).toBeInTheDocument();
    expect(container.textContent).toContain('original content');

    // Trigger exit - parent passes isShown=false and content becomes null
    rerender(<TestWrapper isShown={false} content="original content" />);

    // Immediately after rerender, content should still be preserved
    // (stored children from when isShown was true)
    // Phase is still 'entered' (exit-pending internally, but reported as 'entered')
    expect(
      container.querySelector('[data-phase="entered"]'),
    ).toBeInTheDocument();
    expect(container.textContent).toContain('original content');

    // Advance through the entire exit flow
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // After completing the exit transition, should reach unmounted
    // Content should have been preserved throughout the exit animation
    expect(
      container.querySelector('[data-phase="unmounted"]'),
    ).toBeInTheDocument();
  });

  it('should not preserve children content during exit when preserveContent=false', () => {
    interface TestWrapperProps {
      isShown: boolean;
      content: string;
    }

    function TestWrapper({ isShown, content }: TestWrapperProps) {
      return (
        <DisplayTransition
          exposeUnmounted
          isShown={isShown}
          animateOnMount={false}
          duration={150}
          preserveContent={false}
        >
          {({ phase, isShown: isShownNow, ref }) => (
            <div ref={ref} data-phase={phase} data-shown={isShownNow}>
              {isShown ? content : null}
            </div>
          )}
        </DisplayTransition>
      );
    }

    const { container, rerender } = render(
      <TestWrapper isShown={true} content="original content" />,
    );

    // Initial: entered with content
    expect(
      container.querySelector('[data-phase="entered"]'),
    ).toBeInTheDocument();
    expect(container.textContent).toContain('original content');

    // Trigger exit - content immediately becomes null because preserveContent=false
    rerender(<TestWrapper isShown={false} content="original content" />);

    // Content should be gone immediately since preserveContent=false
    expect(container.textContent).not.toContain('original content');
  });

  describe('exit interrupted mid-collapse', () => {
    // The collapse is a two-step flow: the main flow effect sets 'exit-pending',
    // then the [phase] effect schedules the double-rAF that advances it to
    // 'exit' → 'unmounted'. Anything that re-runs the flow effect while
    // 'exit-pending' is still on screen cancels that rAF, so the flow effect has
    // to re-arm it — otherwise the [phase] effect never re-runs (phase did not
    // change) and the content is stranded visible while the driver says hidden.

    it('should finish the exit when duration flips 0 → undefined mid-collapse', () => {
      // Reproduces CUB-3793: Disclosure passes transitionDuration={isStreaming ? 0 : undefined},
      // and in chat the collapse and the streaming flag land in separate renders.
      const onRest = vi.fn();

      const { container, rerender } = render(
        <Probe
          exposeUnmounted
          animateOnMount={false}
          duration={0}
          isShown={true}
          onRest={onRest}
        />,
      );

      expect(phaseOf(container)).toBe('entered');

      // Collapse. Do not advance time: this leaves 'exit-pending' on screen with
      // the double-rAF still pending.
      rerender(
        <Probe
          exposeUnmounted
          animateOnMount={false}
          duration={0}
          isShown={false}
          onRest={onRest}
        />,
      );

      expect(phaseOf(container)).toBe('entered'); // 'exit-pending' reports as 'entered'
      expect(shownOf(container)).toBe('true');

      // Streaming ends one render later, so the duration changes while still pending.
      rerender(
        <Probe
          exposeUnmounted
          animateOnMount={false}
          duration={undefined}
          isShown={false}
          onRest={onRest}
        />,
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(phaseOf(container)).toBe('unmounted');
      expect(shownOf(container)).toBe('false');
      expect(onRest).toHaveBeenCalledWith('exit');
    });

    it('should finish the exit when a numeric duration changes mid-collapse', () => {
      const onRest = vi.fn();

      const { container, rerender } = render(
        <Probe
          exposeUnmounted
          animateOnMount={false}
          duration={150}
          isShown={true}
          onRest={onRest}
        />,
      );

      rerender(
        <Probe
          exposeUnmounted
          animateOnMount={false}
          duration={150}
          isShown={false}
          onRest={onRest}
        />,
      );

      expect(phaseOf(container)).toBe('entered');

      rerender(
        <Probe
          exposeUnmounted
          animateOnMount={false}
          duration={300}
          isShown={false}
          onRest={onRest}
        />,
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(phaseOf(container)).toBe('unmounted');
      expect(onRest).toHaveBeenCalledWith('exit');
      expect(onRest).toHaveBeenCalledTimes(1);
    });

    it('should stay entered when re-shown during exit-pending', () => {
      const onRest = vi.fn();

      const { container, rerender } = render(
        <Probe
          exposeUnmounted
          animateOnMount={false}
          duration={150}
          isShown={true}
          onRest={onRest}
        />,
      );

      rerender(
        <Probe
          exposeUnmounted
          animateOnMount={false}
          duration={150}
          isShown={false}
          onRest={onRest}
        />,
      );

      // Re-shown before the exit ever started.
      rerender(
        <Probe
          exposeUnmounted
          animateOnMount={false}
          duration={150}
          isShown={true}
          onRest={onRest}
        />,
      );

      expect(phaseOf(container)).toBe('entered');
      expect(shownOf(container)).toBe('true');

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // The cancelled exit must not sneak through afterwards.
      expect(phaseOf(container)).toBe('entered');
      expect(shownOf(container)).toBe('true');
      expect(onRest).not.toHaveBeenCalledWith('exit');
    });

    it('should re-enter when re-shown during the exit phase', () => {
      const { container, rerender } = render(
        <Probe
          exposeUnmounted
          animateOnMount={false}
          duration={150}
          isShown={true}
        />,
      );

      rerender(
        <Probe
          exposeUnmounted
          animateOnMount={false}
          duration={150}
          isShown={false}
        />,
      );

      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(phaseOf(container)).toBe('exit');

      rerender(
        <Probe
          exposeUnmounted
          animateOnMount={false}
          duration={150}
          isShown={true}
        />,
      );

      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(phaseOf(container)).toBe('entered');
      expect(shownOf(container)).toBe('true');
    });

    it('should not fire callbacks after unmounting mid-exit', () => {
      const onRest = vi.fn();
      const onPhaseChange = vi.fn();

      const { rerender, unmount } = render(
        <Probe
          exposeUnmounted
          animateOnMount={false}
          duration={150}
          isShown={true}
          onRest={onRest}
          onPhaseChange={onPhaseChange}
        />,
      );

      rerender(
        <Probe
          exposeUnmounted
          animateOnMount={false}
          duration={150}
          isShown={false}
          onRest={onRest}
          onPhaseChange={onPhaseChange}
        />,
      );

      act(() => {
        vi.advanceTimersByTime(50);
      });

      onRest.mockClear();
      onPhaseChange.mockClear();
      unmount();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(onRest).not.toHaveBeenCalled();
      expect(onPhaseChange).not.toHaveBeenCalled();
    });
  });

  describe('callbacks', () => {
    it('should report exit phases without ever exposing exit-pending', () => {
      const onPhaseChange = vi.fn();
      const onToggle = vi.fn();

      const { rerender } = render(
        <Probe
          exposeUnmounted
          animateOnMount={false}
          duration={150}
          isShown={true}
          onPhaseChange={onPhaseChange}
          onToggle={onToggle}
        />,
      );

      // Mounting straight into 'entered' is not a change.
      expect(onPhaseChange).not.toHaveBeenCalled();
      expect(onToggle).not.toHaveBeenCalled();

      rerender(
        <Probe
          exposeUnmounted
          animateOnMount={false}
          duration={150}
          isShown={false}
          onPhaseChange={onPhaseChange}
          onToggle={onToggle}
        />,
      );

      // 'exit-pending' is an internal phase — it reports as 'entered', which is
      // what we were already in, so neither callback fires yet.
      expect(onPhaseChange).not.toHaveBeenCalled();
      expect(onToggle).not.toHaveBeenCalled();

      // Step through the double-rAF and the duration separately. Advancing past
      // both inside one act() collapses the commits, so the intermediate 'exit'
      // render would never be observed.
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(onPhaseChange.mock.calls.flat()).toEqual(['exit']);
      expect(onToggle.mock.calls.flat()).toEqual([false]);

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(onPhaseChange.mock.calls.flat()).toEqual(['exit', 'unmounted']);
      // Visibility already changed at 'exit'; unmounting is not a second toggle.
      expect(onToggle.mock.calls.flat()).toEqual([false]);
    });
  });
});
