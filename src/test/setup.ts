import '@testing-library/jest-dom';
import 'jest-styled-components';

import { configure } from '@testing-library/react';
import { AbortController } from 'node-abort-controller';
import { config } from 'react-transition-group';

// @ts-expect-error Setup AbortController for test environment
global.AbortController = AbortController;
config.disabled = true;

configure({ testIdAttribute: 'data-qa', asyncUtilTimeout: 15000 });

// Configure React 18 testing environment to support act()
// This tells React that we're in a testing environment and should use act() for updates
global.IS_REACT_ACT_ENVIRONMENT = true;

// Mock @tanstack/react-virtual for test environment
// eslint-disable-next-line no-undef
jest.mock('@tanstack/react-virtual', () => ({
  // eslint-disable-next-line no-undef
  useVirtualizer: jest.fn().mockImplementation(({ count = 0 }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index,
        start: index * 40, // Mock height per item
        size: 40,
      })),
    getTotalSize: () => count * 40,
    // eslint-disable-next-line no-undef
    scrollToIndex: jest.fn(),
    // eslint-disable-next-line no-undef
    measure: jest.fn(),
    // eslint-disable-next-line no-undef
    measureElement: jest.fn(),
  })),
}));

// Suppress act() warnings from @testing-library/react-hooks
// These warnings occur because the form system uses asynchronous updates that are hard to wrap in act()
const originalError = console.error;

// Store the original console.error to restore it later
let isConsoleSuppressed = false;

// Override console.error globally to suppress act warnings
const suppressedConsoleError = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes(
      'Warning: The current testing environment is not configured to support act',
    )
  ) {
    return;
  }
  return originalError.call(console, ...args);
};

// Apply the suppression immediately
console.error = suppressedConsoleError;
