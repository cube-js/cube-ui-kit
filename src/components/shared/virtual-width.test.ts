import { getLongestRows, rangeWithRows } from './virtual-width';

// `src/test/setup.ts` mocks the virtualizer; these helpers use the real range.
vi.unmock('@tanstack/react-virtual');

describe('getLongestRows', () => {
  const lengths = [3, 9, 1, 9, 7, 2, 8];

  it('picks the three rows with the longest text', () => {
    expect(
      getLongestRows(lengths.length, (index) => lengths[index]).sort(
        (a, b) => a - b,
      ),
    ).toEqual([1, 3, 6]);
  });

  it('keeps the earlier rows on a tie at the cut-off', () => {
    expect(getLongestRows(4, () => 5).sort((a, b) => a - b)).toEqual([0, 1, 2]);
  });

  it('picks every row of a shorter list', () => {
    expect(
      getLongestRows(2, (index) => lengths[index]).sort((a, b) => a - b),
    ).toEqual([0, 1]);
  });
});

describe('rangeWithRows', () => {
  const range = { startIndex: 10, endIndex: 12, overscan: 1, count: 50 };

  it('adds the rows to the rendered range, in index order', () => {
    expect(rangeWithRows(range, [40, 2, 11])).toEqual([
      2, 9, 10, 11, 12, 13, 40,
    ]);
  });

  it('skips a row past the end of the list', () => {
    expect(rangeWithRows({ ...range, count: 14 }, [40])).toEqual([
      9, 10, 11, 12, 13,
    ]);
  });
});
