// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Window {
  CubeUIKit: {
    version: string[];
  };
}

if (!window.CubeUIKit || !Array.isArray(window.CubeUIKit)) {
  window.CubeUIKit = {
    version: [],
  };
}

// @ts-ignore
if ('__UIKIT_VERSION__') {
  window.CubeUIKit.version.push('__UIKIT_VERSION__');
}

if (window.CubeUIKit.version.length > 1) {
  console.error('More than one version of CubeUIKit is loaded');
}
