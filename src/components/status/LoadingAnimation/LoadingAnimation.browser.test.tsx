import { renderWithRoot, screen } from '../../../test';

import { LoadingAnimation } from './LoadingAnimation';

/**
 * These specs are in the browser project because jsdom has no animation clock:
 * `Element.getAnimations` does not exist there, so the phase this component now
 * pins is only observable in a real engine.
 */

const timeout = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const animationsOf = (qa: string) =>
  Array.from(screen.getByTestId(qa).querySelectorAll('svg')).flatMap((cube) =>
    cube.getAnimations(),
  );

const phaseOf = (qa: string) => Number(animationsOf(qa)[0].currentTime);

function Loaders({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <LoadingAnimation key={index} qa={`loader-${index}`} />
      ))}
    </>
  );
}

describe('<LoadingAnimation /> animation phase', () => {
  it('should pin every animated cube to the document timeline origin', () => {
    renderWithRoot(<Loaders count={1} />);

    const animations = animationsOf('loader-0');

    // Three of the six cubes are static, so only three carry an animation.
    expect(animations).toHaveLength(3);

    for (const animation of animations) {
      expect(Number(animation.startTime)).toBe(0);
      expect(Number(animation.currentTime)).toBeCloseTo(
        Number(document.timeline.currentTime),
        0,
      );
    }
  });

  it('should mount a late instance in the phase the running one is already in', async () => {
    const { rerender } = renderWithRoot(<Loaders count={1} />);

    await timeout(350);

    rerender(<Loaders count={2} />);

    // Both readings resolve against the same timeline in the same tick, so a
    // synced pair is exactly equal rather than merely close.
    expect(phaseOf('loader-1')).toBe(phaseOf('loader-0'));
  });

  it('should keep the phase across a remount instead of restarting', async () => {
    const { rerender } = renderWithRoot(
      <LoadingAnimation key="first" qa="loader" />,
    );

    await timeout(600);

    // A new `key` is what an extra wrapper appearing above the loader does to
    // it: the element is thrown away and a fresh one is created.
    rerender(<LoadingAnimation key="second" qa="loader" />);

    for (const animation of animationsOf('loader')) {
      expect(Number(animation.startTime)).toBe(0);
      // A restarted animation would read ~0 here.
      expect(Number(animation.currentTime)).toBeGreaterThan(500);
    }
  });
});
