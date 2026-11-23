import type { AriaAttributes, DOMAttributes, InputHTMLAttributes } from 'react';

/**
 * What a search input asks of a phone keyboard: a Search key in place of Return, and no capital
 * first letter, corrections or spell check, because a query is often an identifier (a member,
 * cube or deployment name). iOS labels the key Search for `type="search"` only inside a
 * `<form action>`, so `enterkeyhint` says it. Merged first, so a caller's own value wins.
 */
export const SEARCH_TEXT_SERVICES = {
  enterKeyHint: 'search',
  autoCapitalize: 'none',
  autoCorrect: 'off',
  spellCheck: 'false',
} as const;

/**
 * Attributes a caller may set on a component's own search input, such as `enterKeyHint`,
 * `autoCorrect`, `inputMode` or `name`. What the component owns, or takes as a prop of its own, is
 * left out, so every key here reaches the input in every component that takes it.
 */
export type CubeSearchInputAttributes = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | keyof DOMAttributes<HTMLInputElement>
  | keyof AriaAttributes
  | 'value'
  | 'defaultValue'
  | 'type'
  | 'role'
  | 'id'
  | 'placeholder'
  | 'autoFocus'
  | 'disabled'
  | 'readOnly'
  | 'className'
  | 'style'
> & {
  [key: `data-${string}`]: string | undefined;
};
