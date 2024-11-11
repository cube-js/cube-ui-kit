// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Window {
  CubeUIKit: {
    version: string;
  };
}

if (window.CubeUIKit?.version) {
  console.error('More than one version of CubeUIKit is loaded', {
    loadedVersions: [window.CubeUIKit.version, '__UIKIT_VERSION'],
  });
} else {
  if (!window.CubeUIKit || !Array.isArray(window.CubeUIKit)) {
    window.CubeUIKit = {
      version: '__UIKIT_VERSION__',
    };
  } else {
    window.CubeUIKit.version = '__UIKIT_VERSION__';
  }
}
