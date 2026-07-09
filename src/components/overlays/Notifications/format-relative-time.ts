import type { TFunction } from 'i18next';

/**
 * Lightweight relative time formatter.
 *
 * Output format (English source; localized via the `uikit` bundle's
 * `relativeTime.*` keys):
 * - `just now` (< 1 minute)
 * - `N min ago` (1–59 minutes)
 * - `N h ago` (1–23 hours)
 * - `N d ago` (1–6 days)
 * - `N w ago` (1–4 weeks)
 * - `N mo ago` (1–11 months)
 * - `N y ago` (1+ years)
 *
 * `t` is the UI Kit translation function (from `useUIKitTranslation`), passed
 * in so the string reacts to the active language. When omitted (non-component
 * callers), English defaults are used.
 */
export function formatRelativeTime(timestamp: number, t?: TFunction): string {
  const translate = (
    key: string,
    defaultValue: string,
    count?: number,
  ): string => {
    if (t) {
      return t(key, defaultValue, count != null ? { count } : undefined);
    }

    return count != null
      ? defaultValue.replace('{{count}}', String(count))
      : defaultValue;
  };

  const now = Date.now();
  const diffMs = now - timestamp;

  if (diffMs < 0) {
    return translate('relativeTime.justNow', 'just now');
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return translate('relativeTime.justNow', 'just now');
  }

  if (diffHours < 1) {
    return translate('relativeTime.minAgo', '{{count}} min ago', diffMinutes);
  }

  if (diffDays < 1) {
    return translate('relativeTime.hoursAgo', '{{count}} h ago', diffHours);
  }

  if (diffDays < 7) {
    return translate('relativeTime.daysAgo', '{{count}} d ago', diffDays);
  }

  const diffWeeks = Math.floor(diffDays / 7);

  if (diffDays < 30) {
    return translate('relativeTime.weeksAgo', '{{count}} w ago', diffWeeks);
  }

  const diffMonths = Math.floor(diffDays / 30);

  if (diffDays < 365) {
    return translate('relativeTime.monthsAgo', '{{count}} mo ago', diffMonths);
  }

  const diffYears = Math.floor(diffDays / 365);

  return translate('relativeTime.yearsAgo', '{{count}} y ago', diffYears);
}
