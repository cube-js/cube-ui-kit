import { useContext } from 'react';

import { UIKitContext } from '../Provider';

import { defaultNavigationAdapter } from './navigation-adapter.default';

import type { RelativeRoutingType, To } from './navigation.types';

/** Isolates the existing hook-based NavigationAdapter contract. */
export function useNavigation(
  to: To,
  options?: { relative?: RelativeRoutingType },
) {
  const navigation = useContext(UIKitContext).navigation;
  const navigate = navigation.useNavigate();
  const resolvedHref = navigation.useHref(to, options);

  return {
    navigate,
    resolvedHref,
    isDefault: navigation === defaultNavigationAdapter,
  };
}
