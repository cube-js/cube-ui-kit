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

if (typeof process !== 'undefined' && process.env?.VERSION) {
  window.CubeUIKit.version.push(process.env.VERSION as string);
}

if (window.CubeUIKit.version.length > 1) {
  console.error('More than one version of CubeUIKit is loaded');
}
