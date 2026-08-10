import '@testing-library/jest-dom/vitest';
import './tasty-vitest';

import { configure } from '@testing-library/react';

import { getI18n } from '../i18n';

/**
 * Setup for the browser project.
 *
 * Deliberately much shorter than the jsdom one, and the omissions are the
 * point:
 *
 * - **No `ResizeObserver` stub.** The real one is what makes column widths
 *   resolve, which everything about the table's layout depends on.
 * - **No `@tanstack/react-virtual` mock.** The jsdom mock hands back a fixed
 *   40px-per-row window; here the virtualizer measures real rows, which is the
 *   only way variable-height rows can be exercised at all.
 * - **No `console.error` suppression.** Those filters exist for act() warnings
 *   that jsdom provokes; swallowing errors in a real browser would hide the
 *   very failures this project is here to catch.
 */
beforeEach(() => {
  const i18n = getI18n();

  if (i18n.language !== 'en-US') {
    i18n.changeLanguage('en-US');
  }
});

configure({ testIdAttribute: 'data-qa', asyncUtilTimeout: 15000 });
