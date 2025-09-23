export interface Path {
  pathname?: string; // may be relative or absolute
  search?: string; // may start with "?" or be a raw query
  hash?: string; // may start with "#" or be a raw hash
}

export type To = string | Path;
export type NavigateArg = To | number; // numbers for history deltas

export type RelativeRoutingType = 'route' | 'path';

export interface NavigateOptions {
  replace?: boolean;
  state?: unknown;
  relative?: RelativeRoutingType;
  preventScrollReset?: boolean;
}

// Overload-style type (NOT a union in the first arg)
export type NavigateLike = {
  (to: To, options?: NavigateOptions): void;
  (delta: number): void;
};

export interface NavigationAdapter {
  // React Router compatible hook signatures
  useHref: (to: To, options?: { relative?: RelativeRoutingType }) => string;
  useNavigate: () => NavigateLike;
}
