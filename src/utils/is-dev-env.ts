export function isDevEnv(): boolean {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const flag = window.localStorage.getItem('UIKIT_DEBUG');
      if (flag !== null && flag.toLowerCase() === 'true') return true;
    } catch {
      // localStorage might not be available (private browsing, etc.)
    }
  }
  if (typeof process === 'undefined') return false;
  const nodeEnv = process.env?.['NODE_ENV'];
  return nodeEnv !== 'test' && nodeEnv !== 'production';
}
