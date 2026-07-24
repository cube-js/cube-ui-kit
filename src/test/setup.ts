import '@testing-library/jest-dom/vitest';
import './tasty-vitest';

import { configure } from '@testing-library/react';

import { getI18n } from '../i18n';

// Happy DOM's MessagePort.postMessage is a no-op stub, and MessageChannel is
// missing on window. React's scheduler posts to a MessageChannel; without a
// working implementation, updates can stall or spin the worker. Provide a
// minimal microtask-based polyfill for the test environment.
class TestMessagePort {
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onmessageerror: ((ev: MessageEvent) => void) | null = null;
  #peer: TestMessagePort | null = null;

  /** @internal */
  _link(peer: TestMessagePort) {
    this.#peer = peer;
  }

  postMessage(data: unknown) {
    const peer = this.#peer;
    if (!peer) return;
    queueMicrotask(() => {
      peer.onmessage?.({ data } as MessageEvent);
    });
  }

  start() {}
  close() {
    this.#peer = null;
    this.onmessage = null;
  }

  addEventListener(type: string, listener: EventListener) {
    if (type === 'message') {
      this.onmessage = listener as (ev: MessageEvent) => void;
    }
  }

  removeEventListener(type: string) {
    if (type === 'message') {
      this.onmessage = null;
    }
  }

  dispatchEvent() {
    return false;
  }
}

class TestMessageChannel {
  port1 = new TestMessagePort();
  port2 = new TestMessagePort();

  constructor() {
    this.port1._link(this.port2);
    this.port2._link(this.port1);
  }
}

(
  window as unknown as { MessageChannel: typeof TestMessageChannel }
).MessageChannel = TestMessageChannel;
(
  globalThis as unknown as { MessageChannel: typeof TestMessageChannel }
).MessageChannel = TestMessageChannel;

// The UI Kit's shared i18next instance is initialized synchronously at import
// (all locale bundles are bundled), so components resolve translated defaults
// without an `<I18nextProvider>`. Reset the active language to `en-US` before
// each test so a spec that exercises `changeLanguage` can't leak its locale
// into unrelated specs sharing the worker's module graph (isolate: false).
beforeEach(() => {
  const i18n = getI18n();
  if (i18n.language !== 'en-US') {
    i18n.changeLanguage('en-US');
  }
});

// Mock ResizeObserver for test environment
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

configure({ testIdAttribute: 'data-qa', asyncUtilTimeout: 15000 });

// Configure React 18 testing environment to support act()
// This tells React that we're in a testing environment and should use act() for updates
global.IS_REACT_ACT_ENVIRONMENT = true;

// Mock @tanstack/react-virtual for test environment
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi
    .fn()
    .mockImplementation(({ count = 0, getItemKey }: any) => ({
      getVirtualItems: () =>
        Array.from({ length: count }, (_, index) => ({
          index,
          key: typeof getItemKey === 'function' ? getItemKey(index) : index,
          start: index * 40,
          size: 40,
        })),
      getTotalSize: () => count * 40,

      scrollToIndex: vi.fn(),

      measure: vi.fn(),

      measureElement: vi.fn(),
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
// These warnings occur because headless DOM CSSOM doesn't support container
// style queries.
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const firstArg = args[0];
  const secondArg = args[1];
  if (
    typeof firstArg === 'string' &&
    firstArg.includes('[tasty] Browser rejected CSS rule:')
  ) {
    // Only suppress @container query warnings (style() not supported headless)
    if (typeof secondArg === 'string' && secondArg.includes('@container')) {
      return;
    }
  }
  return originalWarn.call(console, ...args);
};
