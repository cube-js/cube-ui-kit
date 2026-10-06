import { Tree } from '@cube-dev/ui-kit';

import type {
  CubeTreeNodeData,
  TreeItemProps,
  TreeNodeState,
} from '@cube-dev/ui-kit';

/**
 * `TreeItemProps` is what `itemProps` returns, so a consumer can type a
 * per-row helper without re-deriving it from `CubeTreeProps` (CUB-5365).
 */
function rowProps(data: CubeTreeNodeData, state: TreeNodeState): TreeItemProps {
  return { description: state.isLeaf ? undefined : `Folder ${data.key}` };
}

export function TreeWithItemProps({
  treeData,
}: {
  treeData: CubeTreeNodeData[];
}) {
  return <Tree treeData={treeData} itemProps={rowProps} />;
}
