/**
 * The element a combobox's `aria-activedescendant` points at, or `null` when
 * the attribute is missing or names no element. Asserting on the element
 * rather than the attribute string is what catches an id that references
 * nothing.
 */
export function getActiveDescendant(input: Element): HTMLElement | null {
  const id = input.getAttribute('aria-activedescendant');

  return id ? document.getElementById(id) : null;
}
