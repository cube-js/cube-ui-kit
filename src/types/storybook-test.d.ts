/**
 * Re-declare storybook/test to fix Assertion matcher resolution.
 *
 * Storybook bundles @vitest/expect@3.x while this project uses vitest 4.x.
 * The version mismatch causes JestAssertion and TestingLibraryMatchers to
 * fail to resolve, leaving the Assertion interface without any matchers.
 *
 * This file re-exports everything from the actual dist path and patches
 * the Assertion interface with the matchers we actually use.
 */
declare module 'storybook/dist/test' {
  export * from 'storybook/dist/test/index';
}

declare module 'storybook/test' {
  import type { MatchersObject, MatcherState } from '@vitest/expect';

  export {
    buildQueries,
    clearAllMocks,
    configure,
    createEvent,
    findAllByAltText,
    findAllByDisplayValue,
    findAllByLabelText,
    findAllByPlaceholderText,
    findAllByRole,
    findAllByTestId,
    findAllByText,
    findAllByTitle,
    findByAltText,
    findByDisplayValue,
    findByLabelText,
    findByPlaceholderText,
    findByRole,
    findByTestId,
    findByText,
    findByTitle,
    fireEvent,
    fn,
    getAllByAltText,
    getAllByDisplayValue,
    getAllByLabelText,
    getAllByPlaceholderText,
    getAllByRole,
    getAllByTestId,
    getAllByText,
    getAllByTitle,
    getByAltText,
    getByDisplayValue,
    getByLabelText,
    getByPlaceholderText,
    getByRole,
    getByTestId,
    getByText,
    getByTitle,
    getConfig,
    getDefaultNormalizer,
    getElementError,
    getNodeText,
    getQueriesForElement,
    getRoles,
    getSuggestedQuery,
    isInaccessible,
    logDOM,
    logRoles,
    mocked,
    onMockCall,
    prettyDOM,
    prettyFormat,
    queries,
    queryAllByAltText,
    queryAllByAttribute,
    queryAllByDisplayValue,
    queryAllByLabelText,
    queryAllByPlaceholderText,
    queryAllByRole,
    queryAllByTestId,
    queryAllByText,
    queryAllByTitle,
    queryByAltText,
    queryByAttribute,
    queryByDisplayValue,
    queryByLabelText,
    queryByPlaceholderText,
    queryByRole,
    queryByTestId,
    queryByText,
    queryByTitle,
    queryHelpers,
    resetAllMocks,
    restoreAllMocks,
    screen,
    spyOn,
    userEvent,
    waitFor,
    waitForElementToBeRemoved,
    within,
  } from '@storybook/test';

  interface Assertion<T> {
    toBe<E>(expected: E): Promise<void>;
    toEqual<E>(expected: E): Promise<void>;
    toStrictEqual<E>(expected: E): Promise<void>;
    toContain<E>(item: E): Promise<void>;
    toBeTruthy(): Promise<void>;
    toBeFalsy(): Promise<void>;
    toBeNull(): Promise<void>;
    toBeUndefined(): Promise<void>;
    toBeDefined(): Promise<void>;
    toBeNaN(): Promise<void>;
    toBeInstanceOf<E>(expected: E): Promise<void>;
    toBeGreaterThan(num: number | bigint): Promise<void>;
    toBeGreaterThanOrEqual(num: number | bigint): Promise<void>;
    toBeLessThan(num: number | bigint): Promise<void>;
    toBeLessThanOrEqual(num: number | bigint): Promise<void>;
    toMatch(expected: string | RegExp): Promise<void>;
    toMatchObject<E extends object>(expected: E): Promise<void>;
    toThrow(expected?: string | RegExp | Error): Promise<void>;
    toHaveLength(length: number): Promise<void>;
    toHaveProperty(property: string | string[], value?: unknown): Promise<void>;
    toBeCloseTo(number: number, numDigits?: number): Promise<void>;
    toHaveBeenCalled(): Promise<void>;
    toHaveBeenCalledTimes(times: number): Promise<void>;
    toHaveBeenCalledWith(...args: unknown[]): Promise<void>;
    toHaveBeenLastCalledWith(...args: unknown[]): Promise<void>;
    toHaveBeenNthCalledWith(n: number, ...args: unknown[]): Promise<void>;
    toSatisfy<E>(
      matcher: (value: E) => boolean,
      message?: string,
    ): Promise<void>;

    toBeInTheDocument(): Promise<void>;
    toBeVisible(): Promise<void>;
    toBeEmpty(): Promise<void>;
    toBeDisabled(): Promise<void>;
    toBeEnabled(): Promise<void>;
    toBeEmptyDOMElement(): Promise<void>;
    toBeInvalid(): Promise<void>;
    toBeRequired(): Promise<void>;
    toBeValid(): Promise<void>;
    toBeChecked(): Promise<void>;
    toBePartiallyChecked(): Promise<void>;
    toContainElement(element: HTMLElement | SVGElement | null): Promise<void>;
    toContainHTML(htmlText: string): Promise<void>;
    toHaveAccessibleDescription(description?: string | RegExp): Promise<void>;
    toHaveAccessibleErrorMessage(message?: string | RegExp): Promise<void>;
    toHaveAccessibleName(name?: string | RegExp): Promise<void>;
    toHaveAttribute(attr: string, value?: unknown): Promise<void>;
    toHaveClass(...classNames: string[]): Promise<void>;
    toHaveFocus(): Promise<void>;
    toHaveFormValues(expectedValues: Record<string, unknown>): Promise<void>;
    toHaveStyle(css: string | Record<string, unknown>): Promise<void>;
    toHaveTextContent(
      text: string | RegExp,
      options?: { normalizeWhitespace: boolean },
    ): Promise<void>;
    toHaveValue(value?: string | string[] | number | null): Promise<void>;
    toHaveDisplayValue(
      value?: string | RegExp | Array<string | RegExp>,
    ): Promise<void>;
    toHaveRole(role: string): Promise<void>;
    toHaveErrorMessage(message?: string | RegExp): Promise<void>;

    resolves: Assertion<T>;
    rejects: Assertion<T>;
    not: Assertion<T>;
  }

  interface Expect {
    <T>(actual: T, message?: string): Assertion<T>;
    soft<T>(actual: T, message?: string): Assertion<T>;
    extend(expects: MatchersObject): void;
    assertions(expected: number): Promise<void>;
    hasAssertions(): Promise<void>;
    anything(): unknown;
    any(constructor: unknown): unknown;
    getState(): MatcherState;
    setState(state: Partial<MatcherState>): void;
    unreachable(message?: string): Promise<never>;
  }

  export const expect: Expect;
}
