/**
 * Module-level mirror of the active formatting locale.
 *
 * The primary formatting API is the `useFormatter()` hook, which reads the
 * locale from React Aria's context. But a lot of code that needs to format a
 * value isn't in a component render — table column definitions, event handlers,
 * plain utilities — so it can't call a hook. Rather than thread a locale through
 * every such call site, the pure helpers (`formatDate`, `formatNumber`, ...) read
 * the current locale from here, and `UIKitI18nProvider` keeps it in sync whenever
 * the UI language changes.
 *
 * Defaults to `en-US` until a provider mounts (Storybook, unit tests, or a host
 * that hasn't wrapped the tree in `<Root>` / `<UIKitI18nProvider>`).
 */
let activeLocale = 'en-US';

/** Sets the locale the pure (non-hook) formatting helpers read. */
export function setActiveFormattingLocale(locale: string): void {
  activeLocale = locale;
}

/** Returns the locale the pure (non-hook) formatting helpers read. */
export function getActiveFormattingLocale(): string {
  return activeLocale;
}
