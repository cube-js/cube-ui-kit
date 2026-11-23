import type { ReactElement } from 'react';
import type { TreeItemProps } from '../../content/Tree/types';
import type { CubeFilterPickerProps } from './FilterPicker';

/**
 * `treeItemProps` takes a row's `Item` props without the actions keys, in a
 * literal, a returned object and a helper typed as `Tree`'s `TreeItemProps`
 * alike: the search keeps focus, so nothing in a row can take it. Compiled by
 * `pnpm test:types`; nothing here runs.
 */
type TreeItemPropsProp = CubeFilterPickerProps<object>['treeItemProps'];

declare const icon: ReactElement;
declare const button: ReactElement;
declare const treeRow: () => TreeItemProps;

export const prefixAndSuffix: TreeItemPropsProp = (_, { isLeaf }) => ({
  prefix: icon,
  suffix: isLeaf ? icon : undefined,
});

// @ts-expect-error — no actions in a literal.
export const literalActions: TreeItemPropsProp = { actions: button };

// @ts-expect-error — no actions beside other keys in a returned object.
export const returnedActions: TreeItemPropsProp = () => ({
  prefix: icon,
  actions: button,
  autoHideActions: true,
});

// @ts-expect-error — nor from a helper typed as Tree's wider TreeItemProps.
export const helperActions: TreeItemPropsProp = () => treeRow();
