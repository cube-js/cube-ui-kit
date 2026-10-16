const URL_SCHEME = /^[a-z][a-z\d+.-]*:/i;

/**
 * Strips what the URL parser strips: leading and trailing C0 controls and
 * spaces. Not `trim()`, which also drops a no-break space the parser keeps.
 */
export function normalizeNavigationUrl(url: string): string {
  let start = 0;
  let end = url.length;

  while (start < end && url.charCodeAt(start) <= 0x20) start++;
  while (end > start && url.charCodeAt(end - 1) <= 0x20) end--;

  return url.slice(start, end);
}

/** A URL scheme or protocol-relative host, rather than an application path. */
export function isExternalUrl(url: string): boolean {
  const value = normalizeNavigationUrl(url);

  return URL_SCHEME.test(value) || value.startsWith('//');
}
