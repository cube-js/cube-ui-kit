import '@testing-library/jest-dom';
import './tasty-jest';

import { configure } from '@testing-library/react';
import { AbortController } from 'node-abort-controller';
import { config } from 'react-transition-group';

// @ts-expect-error Setup AbortController for test environment
global.AbortController = AbortController;

// Mock ResizeObserver for test environment
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

config.disabled = true;

configure({ testIdAttribute: 'data-qa', asyncUtilTimeout: 15000 });

// Configure React 18 testing environment to support act()
// This tells React that we're in a testing environment and should use act() for updates
global.IS_REACT_ACT_ENVIRONMENT = true;

// Mock @tanstack/react-virtual for test environment

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn().mockImplementation(({ count = 0 }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index,
        start: index * 40, // Mock height per item
        size: 40,
      })),
    getTotalSize: () => count * 40,

    scrollToIndex: jest.fn(),

    measure: jest.fn(),

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
  const firstArg = args[0];
  if (typeof firstArg === 'string') {
    const msg = firstArg.toLowerCase();
    // React 18/19 act() environment/config warnings
    if (
      msg.includes(
        'the current testing environment is not configured to support act',
      ) ||
      msg.includes('not configured to support act(') ||
      msg.includes('inside a test was not wrapped in act(') ||
      msg.includes('was not wrapped in act(')
    ) {
      return;
    }
  }
  return originalError.call(console, ...args);
};

// Apply the suppression immediately
console.error = suppressedConsoleError;
