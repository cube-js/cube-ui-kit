import {
  NavigateOptions,
  NavigationAdapter,
  Path,
  To,
} from './navigation.types';

/**
 * Converts a Path object to a string URL
 */
function pathToString(path: Path): string {
  let { pathname = '', search = '', hash = '' } = path;
  if (pathname && !pathname.startsWith('/')) pathname = `/${pathname}`;
  if (search && !search.startsWith('?')) search = `?${search}`;
  if (hash && !hash.startsWith('#')) hash = `#${hash}`;
  return `${pathname}${search}${hash}`;
}

/**
 * Default navigation adapter that provides native browser navigation
 * when no router is available. This ensures hooks are always callable.
 */
export const defaultNavigationAdapter: NavigationAdapter = {
  useHref: (to: To) => {
    // For strings, return as-is (SSR-safe, no window dependency)
    if (typeof to === 'string') {
      return to;
    }
    // For objects, normalize to string
    return pathToString(to);
  },

  useNavigate: () => {
    return (to: To | number, options?: NavigateOptions) => {
      // Handle history navigation (numbers)
      if (typeof to === 'number') {
        if (typeof window !== 'undefined') {
          window.history.go(to);
        }
        return;
      }

      // Handle strings and objects - convert to string URL
      const url = typeof to === 'string' ? to : pathToString(to);

      if (typeof window !== 'undefined') {
        if (options?.replace) {
          window.location.replace(url);
        } else {
          window.location.assign(url);
        }
      }
    };
  },
};
