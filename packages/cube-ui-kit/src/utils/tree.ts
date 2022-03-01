export function toFlatTree(tree, includingFolders) {
  return tree.reduce((result, node) => {
    if (!node.isLeaf) {
      result = [
        ...result,
        ...(includingFolders ? [node] : []),
        ...toFlatTree(node.children || [], includingFolders),
      ];
    } else {
      result.push(node);
    }
    return result;
  }, []);
}
