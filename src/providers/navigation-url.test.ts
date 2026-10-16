import { isExternalUrl, normalizeNavigationUrl } from './navigation-url';

describe('normalizeNavigationUrl', () => {
  it.each([
    [' https://example.com', 'https://example.com'],
    ['https://example.com ', 'https://example.com'],
    ['\thttps://example.com\n', 'https://example.com'],
    ['\r\n /path \u001f', '/path'],
    ['\u0000https://example.com\u0001 ', 'https://example.com'],
    ['  ', ''],
  ])('strips what the URL parser strips from %j', (value, expected) => {
    expect(normalizeNavigationUrl(value)).toBe(expected);
  });

  it.each([
    ['a clean URL', 'https://example.com'],
    ['an inner space', '/a b'],
    ['an inner tab', 'https://example.com/a\tb'],
    ['a leading no-break space', '\u00a0https://example.com'],
    ['a trailing no-break space', 'https://example.com\u00a0'],
    ['a leading em space', '\u2003/path'],
  ])('keeps %s', (_, value) => {
    expect(normalizeNavigationUrl(value)).toBe(value);
  });

  it('stays linear on a long run of spaces', () => {
    const value = `/a${' '.repeat(100_000)}b${' '.repeat(100_000)}`;

    expect(normalizeNavigationUrl(value)).toBe(`/a${' '.repeat(100_000)}b`);
  });
});

describe('isExternalUrl', () => {
  it.each([
    ' https://example.com',
    'https://example.com ',
    '\thttps://example.com',
    '\nhttps://example.com\n',
    '\u0000https://example.com',
    ' mailto:test@example.com',
    ' //example.com',
    '\t//example.com',
  ])('treats %j as external', (url) => {
    expect(isExternalUrl(url)).toBe(true);
  });

  it.each([
    ['a no-break space before a scheme', '\u00a0https://example.com'],
    ['a no-break space before //', '\u00a0//example.com'],
    ['a space before a path', ' /path'],
    ['a space before a path with a colon', ' /models/cube:orders'],
    ['only spaces', '  '],
  ])('treats %s as an app path', (_, url) => {
    expect(isExternalUrl(url)).toBe(false);
  });
});
