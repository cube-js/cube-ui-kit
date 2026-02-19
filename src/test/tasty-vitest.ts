import { expect } from 'vitest';

import { getCssTextForNode } from '../tasty/injector';

declare module 'vitest' {
  interface Assertion {
    toMatchTastySnapshot(): void;
  }
}

/**
 * Vitest matcher for tasty CSS snapshots
 * Similar to jest-styled-components but for our tasty system
 */
expect.extend({
  toMatchTastySnapshot(received: ParentNode | Element | DocumentFragment) {
    if (!received || typeof received.querySelectorAll !== 'function') {
      return {
        pass: false,
        message: () =>
          'Expected a DOM node with querySelectorAll method (container from render)',
      };
    }

    try {
      const css = getCssTextForNode(received);
      expect(css).toMatchSnapshot();

      return {
        pass: true,
        message: () => 'CSS snapshot matched',
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `Failed to match CSS snapshot: ${error}`,
      };
    }
  },
});

/**
 * Snapshot serializer that includes both markup and CSS
 */
export const tastySerializer = {
  test(val: unknown): val is ParentNode {
    return !!(
      val &&
      typeof val === 'object' &&
      typeof (val as ParentNode).querySelectorAll === 'function'
    );
  },

  print(val: ParentNode, serialize: (v: unknown) => string): string {
    const markup = serialize(val);
    const css = getCssTextForNode(val);

    if (!css.trim()) {
      return markup;
    }

    return `${markup}\n\n/* Tasty styles */\n${css}`;
  },
};

// Register the serializer
expect.addSnapshotSerializer(tastySerializer);
