import { useEffect, useState } from 'react';

/**
 * useIsDarwin
 * ----------
 * @returns true  – if the browser is running on macOS / iOS
 *          false – otherwise (Windows, Linux, Android…)
 *
 * • Safe to call during server-side rendering: it defaults to `true`
 *   until it can really inspect the client.
 * • Uses the modern UA-Client-Hints platform field where available,
 *   then falls back to navigator.platform, then navigator.userAgent.
 */
export function useIsDarwin(defaultValue: boolean = true): boolean {
  const [isDarwin, setIsDarwin] = useState<boolean>(defaultValue);

  useEffect(() => {
    if (typeof navigator === 'undefined') return; // ← running on the server

    // 1 — Prefer UA-CH (Chromium 89+, Edge 94+, Arc, Opera, Android Chrome)
    const chPlatform = (navigator as any).userAgentData?.platform;
    if (chPlatform) {
      setIsDarwin(/mac|iphone|ipad|ipod/i.test(chPlatform));
      return;
    }

    // 2 — Safari & Firefox: navigator.platform is still reliable
    if (navigator.platform) {
      setIsDarwin(/mac|iphone|ipad|ipod/i.test(navigator.platform));
      return;
    }

    // 3 — Last-ditch for very old browsers
    setIsDarwin(/mac|iphone|ipad|ipod/i.test(navigator.userAgent));
  }, []);

  return isDarwin;
}
