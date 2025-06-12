// Make Storybook's assertion type aware of jest-dom matchers
import '@testing-library/jest-dom';

declare module '@storybook/test' {
  interface Assertion<T = any> {
    toBeInTheDocument(): void;
    // You can add other jest-dom matchers here if needed
  }
}
