import { BANNER_ACTION_ACCENT } from './Banner';

/**
 * A container that OFFERS a color to the `current` theme owns that color in
 * every state.
 *
 * `Banner` hands its actions a `--current-accent` because `current.invert`
 * writes its label on a `#surface` pill, and a banner's inherited color is
 * `#white` — which IS `#surface` in light mode, so unaided the two collapse.
 * The reader gates its own disabled fade on `!inherit-disabled`, on the grounds
 * that something above already faded the color it paints from. That holds for
 * an inherited color automatically, and for an offered one only if the offer
 * includes a muted entry.
 *
 * Without it a disabled banner keeps a full-strength `accent-text` label on a
 * dead chip — measured cr 5.69 light / 6.13 dark, reading live next to a muted
 * dismiss. The `.4` counterpart lands on 1.81 / 2.20, the ~2:1 band every other
 * disabled label in `item-themes` is tuned to.
 */
describe('BANNER_ACTION_ACCENT', () => {
  const THEMES = ['note', 'danger', 'warning', 'success'];

  it('offers an accent for every banner theme', () => {
    expect(THEMES.map((t) => BANNER_ACTION_ACCENT[`theme=${t}`])).toEqual(
      THEMES.map((t) => `#${t}-accent-text`),
    );
  });

  it('pairs every offered accent with a muted one', () => {
    const live = Object.keys(BANNER_ACTION_ACCENT).filter(
      (key) => !key.includes('disabled'),
    );

    expect(live.length).toBe(THEMES.length);

    for (const key of live) {
      const muted = BANNER_ACTION_ACCENT[`${key} & disabled`];

      expect(muted).toBeDefined();
      // Same token, faded — not a different color, and not the same string
      // (two identical values in one state map get coalesced at the group's
      // max priority; see `SPECIAL_CLEAR_STYLES`).
      expect(muted).toBe(`${BANNER_ACTION_ACCENT[key]}.4`);
      expect(muted).not.toBe(BANNER_ACTION_ACCENT[key]);
    }
  });
});
