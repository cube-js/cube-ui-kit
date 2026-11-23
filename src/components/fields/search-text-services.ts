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
 * Attributes a caller may set on a component's own search input. Its value, type, role, ARIA
 * wiring and event handlers belong to the component, so they are left out.
 */
export type CubeSearchInputAttributes = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | keyof DOMAttributes<HTMLInputElement>
  | keyof AriaAttributes
  | 'value'
  | 'defaultValue'
  | 'type'
  | 'role'
>;
