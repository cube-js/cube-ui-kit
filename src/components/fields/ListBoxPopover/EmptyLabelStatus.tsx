import { ReactNode } from 'react';
import { VisuallyHidden } from 'react-aria';

/**
 * Announces a picker's empty label to screen readers. Focus stays in the
 * picker's input, where the listbox's description isn't read, so this polite
 * status says it instead.
 *
 * Render it whenever the picker can show an empty label, so the region is in
 * the page before any text arrives: a region inserted with its text is often
 * not announced. Pass the label only once the list has settled on it, never
 * while loading: a loading label is a passing state, and announcing it is
 * noise.
 */
export function EmptyLabelStatus({ children }: { children?: ReactNode }) {
  return (
    <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
      {children}
    </VisuallyHidden>
  );
}
