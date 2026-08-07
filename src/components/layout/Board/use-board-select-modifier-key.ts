import { useIsDarwin } from '../../../utils/react/useIsDarwin';

/** Pointer-event property carrying this platform's additive-selection modifier. */
export type BoardSelectModifierKey = 'metaKey' | 'ctrlKey';

/**
 * Which modifier adds to (or removes from) the selection on this platform.
 *
 * <kbd>Shift</kbd> works everywhere and is the canvas convention; this is the
 * second, list-style modifier that toggles a single item. It is <kbd>Cmd</kbd>
 * on Apple platforms and <kbd>Ctrl</kbd> elsewhere — deliberately not
 * <kbd>Ctrl</kbd> on macOS, where Ctrl-clicking opens the context menu.
 *
 * Read off the event rather than tracked as held state: a pointer event always
 * carries its own modifier flags, so selection can never be swallowed because a
 * `keydown` was missed (the key went down while another window had focus, or the
 * page loaded with it already held).
 */
export function useBoardSelectModifierKey(): BoardSelectModifierKey {
  return useIsDarwin() ? 'metaKey' : 'ctrlKey';
}
