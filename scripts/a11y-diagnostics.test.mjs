// @vitest-environment node
import {
  confirmCount,
  countsOf,
  differences,
  mergeBaseline,
  parseShard,
  shardOf,
  totalsOf,
} from './a11y-diagnostics.mjs';

const story = (id, violations) => ({
  id,
  violations: Object.entries(violations).map(([rule, nodes]) => ({
    rule,
    nodes,
  })),
});

describe('countsOf', () => {
  it('keeps stories with violations and leaves out clean and failed ones', () => {
    expect(
      countsOf([
        story('b', { label: 1, 'color-contrast': 3 }),
        story('a', {}),
        { id: 'c', error: 'timeout' },
      ]),
    ).toEqual({ b: { 'color-contrast': 3, label: 1 } });
  });
});

describe('differences', () => {
  const baseline = { a: { label: 2 }, b: { 'button-name': 1 } };

  it('reports growth, new rules and new stories', () => {
    expect(
      differences(
        {
          a: { label: 3, 'color-contrast': 1 },
          b: { 'button-name': 1 },
          c: { label: 1 },
        },
        baseline,
        ['a', 'b', 'c'],
      ),
    ).toEqual([
      { id: 'a', rule: 'color-contrast', before: 0, after: 1 },
      { id: 'a', rule: 'label', before: 2, after: 3 },
      { id: 'c', rule: 'label', before: 0, after: 1 },
    ]);
  });

  it('reports a fixed rule as a drop to zero', () => {
    expect(differences({ a: { label: 2 } }, baseline, ['a', 'b'])).toEqual([
      { id: 'b', rule: 'button-name', before: 1, after: 0 },
    ]);
  });

  it('only looks at the stories that ran', () => {
    expect(differences({}, baseline, ['a'])).toEqual([
      { id: 'a', rule: 'label', before: 2, after: 0 },
    ]);
  });
});

describe('confirmCount', () => {
  it('accepts a change only when both renders moved the same way', () => {
    expect(confirmCount(2, 4, 3)).toBe(3);
    expect(confirmCount(2, 0, 1)).toBe(1);
    expect(confirmCount(0, 5, 5)).toBe(5);
  });

  it('keeps the baseline when the renders disagree', () => {
    expect(confirmCount(2, 4, 2)).toBe(2);
    expect(confirmCount(2, 0, 3)).toBe(2);
    expect(confirmCount(0, 1, 0)).toBe(0);
  });
});

describe('mergeBaseline', () => {
  const baseline = { a: { label: 2 }, b: { label: 1 }, gone: { label: 1 } };

  it('replaces the stories that ran and keeps the rest', () => {
    expect(mergeBaseline(baseline, { a: { label: 1 } }, ['a', 'b'])).toEqual({
      a: { label: 1 },
      gone: { label: 1 },
    });
  });

  it('drops stories that no longer exist when every story ran', () => {
    expect(
      mergeBaseline(baseline, { c: { label: 4 } }, ['c'], ['a', 'b', 'c']),
    ).toEqual({ a: { label: 2 }, b: { label: 1 }, c: { label: 4 } });
  });
});

it('totals elements per rule across stories', () => {
  expect(totalsOf({ a: { label: 2, region: 1 }, b: { label: 3 } })).toEqual({
    label: 5,
    region: 1,
  });
});

describe('shards', () => {
  const ids = Array.from({ length: 300 }, (_, i) => `story-${i}--default`);

  it('puts every story in exactly one shard, the same one every time', () => {
    for (const id of ids) {
      const shard = shardOf(id, 3);
      expect([1, 2, 3]).toContain(shard);
      expect(shardOf(id, 3)).toBe(shard);
    }
  });

  it('keeps the shards roughly even', () => {
    for (const index of [1, 2, 3]) {
      const size = ids.filter((id) => shardOf(id, 3) === index).length;
      expect(size).toBeGreaterThan(70);
      expect(size).toBeLessThan(130);
    }
  });

  it('reads index/count and rejects anything else', () => {
    expect(parseShard('2/3')).toEqual({ index: 2, count: 3 });
    for (const value of ['0/3', '4/3', '3', 'a/b', '1/0']) {
      expect(() => parseShard(value)).toThrow('--shard');
    }
  });
});
