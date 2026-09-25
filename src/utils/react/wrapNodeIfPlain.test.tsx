import { wrapNodeIfPlain } from './wrapNodeIfPlain';

const wrap = () => 'wrapped';

describe('wrapNodeIfPlain', () => {
  it('returns a single element as it is', () => {
    const element = <strong>10</strong>;

    expect(wrapNodeIfPlain(element, wrap)).toBe(element);
  });

  it.each([
    ['a string', 'Up to 10 items'],
    ['a number', 10],
    ['an array', ['Up to ', <strong key="n">10</strong>]],
    // `react-is@18` answered false for a React 19 fragment, so this one was
    // returned unwrapped.
    [
      'a fragment',
      <>
        Up to <strong>10</strong>
      </>,
    ],
  ])('wraps %s', (_, children) => {
    expect(wrapNodeIfPlain(children, wrap)).toBe('wrapped');
  });

  it('leaves empty content alone', () => {
    expect(wrapNodeIfPlain(null, wrap)).toBeNull();
    expect(wrapNodeIfPlain('', wrap)).toBe('');
  });
});
