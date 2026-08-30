import { precompileTastyStyles } from '@tenphi/tasty/precompile';
import { createElement } from 'react';

import { Root } from '../components/Root';

import type {
  TastyPrecompileCase,
  TastyPrecompileResult,
} from '@tenphi/tasty/precompile';
import type { CubeRootProps } from '../components/Root';

export type PrecompileCase = TastyPrecompileCase;

export interface PrecompileStylesOptions {
  id: string;
  cases: readonly PrecompileCase[];
  /**
   * Props for the UI Kit Root wrapped around every case. Pass false when each
   * case already returns the application's complete Root tree.
   */
  root?: false | Omit<CubeRootProps, 'children'>;
}

/**
 * Compile application-owned catalog cases under UI Kit's exact Tasty
 * configuration and normal Root providers.
 */
export function precompileStyles(
  options: PrecompileStylesOptions,
): Promise<TastyPrecompileResult> {
  const { id, cases, root = {} } = options;

  return precompileTastyStyles({
    id,
    cases: cases.map((item) => ({
      id: item.id,
      async render() {
        const tree = await item.render();

        return root === false ? tree : createElement(Root, root, tree);
      },
    })),
  });
}
