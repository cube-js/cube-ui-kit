/**
 * Lightweight relative time formatter.
 * No external dependencies.
 *
 * Output format:
 * - `just now` (< 1 minute)
 * - `N min ago` (1–59 minutes)
 * - `N h ago` (1–23 hours)
 * - `N d ago` (1–6 days)
 * - `N w ago` (1–4 weeks)
 * - `N mo ago` (1–11 months)
 * - `N y ago` (1+ years)
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;

  if (diffMs < 0) {
    return 'just now';
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return 'just now';
  }

  if (diffHours < 1) {
    return `${diffMinutes} min ago`;
  }

  if (diffDays < 1) {
    return `${diffHours} h ago`;
  }

  if (diffDays < 7) {
    return `${diffDays} d ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);

  if (diffDays < 30) {
    return `${diffWeeks} w ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);

  if (diffDays < 365) {
    return `${diffMonths} mo ago`;
  }

  const diffYears = Math.floor(diffDays / 365);

  return `${diffYears} y ago`;
}
