import { renderWithRoot } from '../../test';

import { TOUCH_CONTEXT_MENU_ATTRIBUTE } from './touch-context-menu';

/**
 * `GlobalStyles` writes the marker literally, so `Root`'s import graph stays
 * free of the helper. This keeps the two spellings from drifting: Chromium
 * can't observe `-webkit-touch-callout`, so nothing else would notice.
 */
it('turns iOS’s callout off on the elements a long press opens a menu on', () => {
  renderWithRoot(<div />);

  const rules = Array.from(document.styleSheets).flatMap((sheet) =>
    Array.from(sheet.cssRules),
  );
  const rule = rules.find(
    (candidate) =>
      candidate instanceof CSSStyleRule &&
      candidate.selectorText === `[${TOUCH_CONTEXT_MENU_ATTRIBUTE}]`,
  );

  // jsdom's CSSOM drops `-webkit-touch-callout` as unknown and keeps the rule,
  // so the selector is what this can check.
  expect(rule).toBeDefined();
});
