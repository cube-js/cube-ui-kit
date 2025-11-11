declare global {
  interface Window {
    CubeUIKit: {
      version: string;
    };
  }
}

export const VERSION = '__UIKIT_VERSION__';

if (typeof window !== 'undefined') {
  const version = VERSION;

  // Ensure CubeUIKit is defined on window in a way bundlers recognize
  window.CubeUIKit = window.CubeUIKit || { version };

  // Check for multiple versions
  if (window.CubeUIKit.version && window.CubeUIKit.version !== version) {
    console.error('More than one version of CubeUIKit is loaded', {
      loadedVersions: [window.CubeUIKit.version, version],
    });
  } else {
    // Set version if not already set
    window.CubeUIKit.version = version;
  }
}
