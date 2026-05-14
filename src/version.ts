declare global {
  interface Window {
    CubeUIKit: {
      version: string;
      tastyVersion: string;
    };
  }

  /** Replaced at build time by tsdown `define` */
  const __UIKIT_VERSION__: string;
  /** Replaced at build time by tsdown `define` */
  const __TASTY_VERSION__: string;
}

// eslint-disable-next-line no-undef -- replaced at build time by tsdown `define`
export const VERSION: string = __UIKIT_VERSION__;
// eslint-disable-next-line no-undef -- replaced at build time by tsdown `define`
export const TASTY_VERSION: string = __TASTY_VERSION__;

if (typeof window !== 'undefined') {
  const version = VERSION;
  const tastyVersion = TASTY_VERSION;

  // Ensure CubeUIKit is defined on window in a way bundlers recognize
  window.CubeUIKit = window.CubeUIKit || { version, tastyVersion };

  // Check for multiple versions
  if (window.CubeUIKit.version && window.CubeUIKit.version !== version) {
    console.error('More than one version of CubeUIKit is loaded', {
      loadedVersions: [window.CubeUIKit.version, version],
    });
  } else {
    window.CubeUIKit.version = version;
    window.CubeUIKit.tastyVersion = tastyVersion;
  }
}
