// Vitest 5 declares `Assertion<R, T>` and expects custom matchers on
// `Matchers<R, T>`. jest-dom (through 7.0.1) still augments the old
// one-parameter `Assertion<T>`, which no longer merges, so its matchers are
// registered here instead. The type parameters must match Vitest's exactly.
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  interface Matchers<
    R extends void | Promise<void> = void | Promise<void>,
    T = unknown,
  > extends TestingLibraryMatchers<any, R> {
    toMatchTastySnapshot(): R;
  }
}
