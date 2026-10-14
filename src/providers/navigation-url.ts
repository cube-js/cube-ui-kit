const URL_SCHEME = /^[a-z][a-z\d+.-]*:/i;

/** A URL scheme or protocol-relative host, rather than an application path. */
export function isExternalUrl(url: string): boolean {
  return URL_SCHEME.test(url) || url.startsWith('//');
}
