import { act } from '@testing-library/react';

import { render } from '../../../test';

import { DisplayTransition } from './DisplayTransition';

describe('DisplayTransition', () => {
  beforeEach(() => {
    jest.useFakeTimers({ legacyFakeTimers: false });
  });

  afterEach(() => {
    jest.useRealTimers();
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
    const onRest = jest.fn();
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
      jest.advanceTimersByTime(50); // Advance enough to process rAFs
    });

    expect(
      container.querySelector('[data-phase="entered"]'),
    ).toBeInTheDocument();
    expect(container.querySelector('[data-shown="true"]')).toBeInTheDocument();
    expect(onRest).not.toHaveBeenCalled();

    // After duration, onRest should fire
    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(onRest).toHaveBeenCalledWith('enter');
    expect(onRest).toHaveBeenCalledTimes(1);
  });

  it('should complete exit flow: entered → exit → unmounted with correct isShown values and onRest callback', () => {
    const onRest = jest.fn();

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
      jest.advanceTimersByTime(50);
    });

    // Now should be in exit phase, isShown=false
    expect(container.querySelector('[data-phase="exit"]')).toBeInTheDocument();
    expect(container.querySelector('[data-shown="false"]')).toBeInTheDocument();
    expect(onRest).not.toHaveBeenCalled();

    // After duration, should reach unmounted and fire onRest
    act(() => {
      jest.advanceTimersByTime(150);
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
    const onRest = jest.fn();

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
      jest.advanceTimersByTime(50);
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
      jest.advanceTimersByTime(50);
    });

    // With duration=0, it should go directly to unmounted (exit completes instantly after rAF)
    expect(
      container.querySelector('[data-phase="unmounted"]'),
    ).toBeInTheDocument();
    expect(onRest).toHaveBeenCalledWith('exit');
  });

  it('should respect prefers-reduced-motion', () => {
    const matchMediaMock = jest.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });

    const onRest = jest.fn();

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
      jest.advanceTimersByTime(50);
    });

    expect(
      container.querySelector('[data-phase="entered"]'),
    ).toBeInTheDocument();
    expect(container.querySelector('[data-shown="true"]')).toBeInTheDocument();
    expect(onRest).toHaveBeenCalledWith('enter');
  });

  it('should handle rapid toggles and cancel previous timers', () => {
    const onRest = jest.fn();

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
      jest.advanceTimersByTime(200);
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
});
