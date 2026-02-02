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
    // Nested button warnings
    if (
      msg.includes('cannot contain a nested') ||
      msg.includes('cannot be a descendant')
    ) {
      return;
    }
  }
  return originalError.call(console, ...args);
};

// Apply the suppression immediately
console.error = suppressedConsoleError;

// Suppress console.warn for tasty @container query rejections
// These warnings occur because jsdom/cssom doesn't support CSS container style queries
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const firstArg = args[0];
  const secondArg = args[1];
  if (
    typeof firstArg === 'string' &&
    firstArg.includes('[tasty] Browser rejected CSS rule:')
  ) {
    // Only suppress @container query warnings (style() not supported in jsdom)
    if (typeof secondArg === 'string' && secondArg.includes('@container')) {
      return;
    }
  }
  return originalWarn.call(console, ...args);
};
