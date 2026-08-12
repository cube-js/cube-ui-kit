import userEvent from '@testing-library/user-event';

/**
 * Hovers an element the way a tooltip needs it.
 *
 * React Aria opens a tooltip only when the last interaction came from a
 * pointer, and it learns the modality from a mouse move on the document. A real
 * browser sends those long before the cursor reaches the trigger, while in
 * jsdom the first `mouseMove` arrives with the hover itself — after the
 * `mouseEnter` that would have opened the tooltip. Moving over the body first
 * establishes the modality, so a test does not silently depend on an earlier
 * test having interacted with something.
 */
export async function hoverWithPointer(element: Element) {
  await userEvent.hover(document.body);
  await userEvent.hover(element);
}
