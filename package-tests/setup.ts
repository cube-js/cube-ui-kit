import '@testing-library/jest-dom/vitest';

import { cleanup, configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-qa' });
afterEach(cleanup);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
