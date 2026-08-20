import {
  buildTableTree,
  filterTableTree,
  flattenTableTree,
  isTableTreeDescendant,
  reindexTableTree,
  sortTableTree,
} from './table-tree';

interface Row {
  id: string;
  name: string;
  children?: Row[];
}

const DATA: Row[] = [
  {
    id: 'b',
    name: 'Beta',
    children: [
      {
        id: 'b2',
        name: 'Beta two',
        children: [{ id: 'b21', name: 'Needle' }],
      },
      { id: 'b1', name: 'Beta one' },
    ],
  },
  { id: 'a', name: 'Alpha', children: [{ id: 'a1', name: 'Alpha one' }] },
];

const build = (rows: readonly Row[] = DATA) =>
  buildTableTree(
    rows,
    (row) => row.children,
    (row) => row.id,
  );
const keys = (nodes: ReturnType<typeof build>['roots']) =>
  flattenTableTree(nodes).map((node) => node.key);

describe('table tree model', () => {
  it('indexes deep nesting without cloning or mutating rows', () => {
    const model = build();

    expect(keys(model.roots)).toEqual(['b', 'b2', 'b21', 'b1', 'a', 'a1']);
    expect(model.byKey.get('b21')).toMatchObject({
      row: DATA[0].children![0].children![0],
      parentKey: 'b2',
      level: 2,
      sourceIndex: 2,
    });
    expect(model.parentOf.get('a1')).toBe('a');
    expect(model.childrenOf.get('b')).toEqual(['b2', 'b1']);
  });

  it('reports duplicate and cyclic keys and ignores the repeated branch', () => {
    const cycle: Row = { id: 'cycle', name: 'Cycle' };
    cycle.children = [cycle];
    const model = build([
      cycle,
      { id: 'duplicate', name: 'First' },
      { id: 'duplicate', name: 'Second' },
    ]);

    expect(model.cyclicKeys).toEqual(['cycle']);
    expect(model.duplicateKeys).toEqual(['duplicate']);
    expect(keys(model.roots)).toEqual(['cycle', 'duplicate']);
  });

  it('sorts each sibling collection independently', () => {
    const sorted = sortTableTree(build().roots, (a, b) =>
      a.row.name.localeCompare(b.row.name),
    );

    expect(keys(sorted)).toEqual(['a', 'a1', 'b', 'b1', 'b2', 'b21']);
    expect(sorted[1].children.map((node) => node.siblingIndex)).toEqual([0, 1]);
  });

  it('retains ancestor paths and forces search branches open', () => {
    const filtered = filterTableTree(build().roots, (node) =>
      node.row.name.includes('Needle'),
    );

    expect(keys(filtered.roots)).toEqual(['b', 'b2', 'b21']);
    expect(filtered.forcedExpandedKeys).toEqual(new Set(['b', 'b2']));
  });

  it('keeps a matching parent complete', () => {
    const filtered = filterTableTree(build().roots, (node) => node.key === 'b');

    expect(keys(filtered.roots)).toEqual(['b', 'b2', 'b21', 'b1']);
    expect(filtered.forcedExpandedKeys).toEqual(new Set(['b', 'b2']));
  });

  it('flattens only open branches and reindexes a root page', () => {
    const model = build();

    expect(flattenTableTree(model.roots, new Set(['b']))).toMatchObject([
      { key: 'b' },
      { key: 'b2' },
      { key: 'b1' },
      { key: 'a' },
    ]);
    expect(reindexTableTree(model.roots.slice(1))).toMatchObject([
      { key: 'a', siblingIndex: 0, siblingCount: 1 },
    ]);
  });

  it('recognizes descendants but not self or ancestors', () => {
    const model = build();

    expect(isTableTreeDescendant(model, 'b21', 'b')).toBe(true);
    expect(isTableTreeDescendant(model, 'b', 'b')).toBe(false);
    expect(isTableTreeDescendant(model, 'b', 'b21')).toBe(false);
  });
});
